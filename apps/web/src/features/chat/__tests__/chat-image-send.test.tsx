/**
 * 이미지 첨부 메시지 전송의 실패 경로를 검증합니다.
 *
 * 실패한 메시지는 목록에서 사라지지 않고 실패 상태로 남습니다.
 * 재전송에 필요한 값(본문 · 업로드된 URL · 상관 ID)을 그 메시지가 들고 있어야
 * 입력창 상태에 기대지 않고 그 자리에서 다시 보낼 수 있습니다(useMessageRetry).
 *
 * 1. 전송(ack) 실패 시 메시지가 실패 상태로 남고 재전송 재료를 보존하는지
 * 2. ack 타임아웃도 같은 경로를 타는지
 * 3. 업로드 도중 컴포넌트가 언마운트돼도 전송이 정상적으로 완료되는지
 * 4. 미리보기 object URL이 새어 나가지 않는지
 */
import { chatKeys, ChatMessage, MAX_CHAT_IMAGES } from "@bookjeok/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChatInput } from "@/features/chat/components/room/chat-room/input";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

vi.mock("next-intl", () => ({
  useLocale: () => "ko",
  useTranslations: (section?: string) => (key: string) =>
    `${section ? `${section}.` : ""}${key}`,
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) =>
    React.createElement("img", { src, alt }),
}));

vi.mock("@/shared/utils/compress-image", () => ({
  validateImageForUpload: () => null,
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024,
}));

const mockEmit = vi.fn();
const mockTimeout = vi.fn((_ms: number) => ({ emit: mockEmit }));
vi.mock("@/shared/providers/socket-provider", () => ({
  useSocketContext: () => ({
    socket: { timeout: (ms: number) => mockTimeout(ms) },
    isConnected: true,
  }),
}));

vi.mock("@/features/auth/stores/use-auth-store", () => ({
  useAuthStore: {
    getState: () => ({
      user: { id: 1, provider: "kakao" },
      accessToken: "token",
    }),
  },
}));

const mockUploadChatImages = vi.fn();
vi.mock("@/features/chat/services/chat-image-upload-service", () => ({
  uploadChatImages: (...args: unknown[]) => mockUploadChatImages(...args),
}));

const ROOM_ID = 10;

const renderInput = (queryClient: QueryClient) =>
  render(
    <QueryClientProvider client={queryClient}>
      <ChatInput
        roomId={ROOM_ID}
        currentUserId={1}
        currentUserHandle="me"
        currentUserNickname="나"
        isInactive={false}
        onTyping={vi.fn()}
        cancelTyping={vi.fn()}
      />
    </QueryClientProvider>,
  );

const createQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(chatKeys.messages(ROOM_ID).queryKey, {
    pages: [{ messages: [] }],
    pageParams: [undefined],
  });
  return queryClient;
};

const getCachedMessages = (queryClient: QueryClient): ChatMessage[] => {
  const data = queryClient.getQueryData<{ pages: { messages: ChatMessage[] }[] }>(
    chatKeys.messages(ROOM_ID).queryKey,
  );
  return data?.pages.flatMap((page) => page.messages) ?? [];
};

/** 파일 입력에 이미지를 첨부합니다. */
const attachImage = (container: HTMLElement, count = 1) => {
  const files = Array.from(
    { length: count },
    (_, i) => new File(["dummy"], `photo-${i}.png`, { type: "image/png" }),
  );
  const fileInput = container.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;

  Object.defineProperty(fileInput, "files", {
    value: files,
    configurable: true,
  });
  fireEvent.change(fileInput);

  return files;
};

let previewUrlCount = 0;

beforeEach(() => {
  vi.clearAllMocks();
  previewUrlCount = 0;
  global.URL.createObjectURL = vi.fn(() => `blob:preview-${++previewUrlCount}`);
  global.URL.revokeObjectURL = vi.fn();
});

describe("이미지 첨부 메시지 전송", () => {
  it("ack 실패 시 메시지를 지우지 않고 실패 상태로 남긴다", async () => {
    const queryClient = createQueryClient();
    mockUploadChatImages.mockResolvedValue(["https://blob.test/uploaded.jpg"]);
    // 서버가 전송을 거부하는 상황 (예: 상대방 탈퇴)
    mockEmit.mockImplementation((_event, _payload, ack) => {
      ack(null, { status: "error", error: "CHAT_PARTICIPANT_WITHDRAWN" });
    });

    const { container } = renderInput(queryClient);
    attachImage(container);
    fireEvent.change(screen.getByLabelText("chat.input_placeholder"), {
      target: { value: "사진 보냅니다" },
    });

    await act(async () => {
      fireEvent.submit(container.querySelector("form")!);
    });

    await waitFor(() => expect(mockEmit).toHaveBeenCalled());

    // 말풍선은 그 자리에 실패 상태로 남는다
    const cached = getCachedMessages(queryClient);
    expect(cached).toHaveLength(1);
    expect(cached[0].sendState).toBe("failed");

    // 재전송에 필요한 재료가 메시지에 모두 들어 있다
    expect(cached[0].content).toBe("사진 보냅니다");
    expect(cached[0].metadata).toMatchObject({
      imageUrls: ["https://blob.test/uploaded.jpg"],
    });
    expect(cached[0].clientMessageId).toBeTruthy();

    // 입력창으로 되돌리지 않는다 (대기 중 새로 입력한 내용과 충돌하지 않도록)
    expect(screen.getByLabelText("chat.input_placeholder")).toHaveValue("");
    expect(screen.queryByAltText("common.aria.preview_image")).toBeNull();
    expect(toast.error).toHaveBeenCalled();
  });

  it("전송을 넘긴 뒤에는 미리보기 object URL을 해제한다", async () => {
    const queryClient = createQueryClient();
    mockUploadChatImages.mockResolvedValue(["https://blob.test/uploaded.jpg"]);
    mockEmit.mockImplementation((_event, _payload, ack) => {
      ack(null, { status: "error", error: "CHAT_PARTICIPANT_WITHDRAWN" });
    });

    const { container } = renderInput(queryClient);
    attachImage(container);

    await act(async () => {
      fireEvent.submit(container.querySelector("form")!);
    });
    await waitFor(() => expect(mockEmit).toHaveBeenCalled());

    // 말풍선은 업로드된 URL을 쓰므로 실패해도 미리보기 URL은 남길 필요가 없다
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview-1");
  });

  it("ack 타임아웃도 동일하게 실패 상태로 남긴다", async () => {
    const queryClient = createQueryClient();
    mockUploadChatImages.mockResolvedValue(["https://blob.test/uploaded.jpg"]);
    // socket.io가 타임아웃을 알리는 형태: 첫 인자로 에러
    mockEmit.mockImplementation((_event, _payload, ack) => {
      ack(new Error("operation has timed out"));
    });

    const { container } = renderInput(queryClient);
    attachImage(container);

    await act(async () => {
      fireEvent.submit(container.querySelector("form")!);
    });

    await waitFor(() => expect(mockEmit).toHaveBeenCalled());

    // 타임아웃 시간이 실제로 설정됐다
    expect(mockTimeout).toHaveBeenCalledWith(10_000);
    const cached = getCachedMessages(queryClient);
    expect(cached).toHaveLength(1);
    expect(cached[0].sendState).toBe("failed");
  });

  it("업로드에 실패하면 첨부를 남겨 바로 다시 시도할 수 있다", async () => {
    const queryClient = createQueryClient();
    mockUploadChatImages.mockRejectedValue(new Error("network"));

    const { container } = renderInput(queryClient);
    attachImage(container);

    await act(async () => {
      fireEvent.submit(container.querySelector("form")!);
    });

    // 아직 전송 자체를 시작하지 않았으므로 첨부는 그대로 둔다
    expect(mockEmit).not.toHaveBeenCalled();
    expect(getCachedMessages(queryClient)).toHaveLength(0);
    expect(
      await screen.findByAltText("common.aria.preview_image"),
    ).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("chat.image.upload_error");
  });

  it("업로드 도중 컴포넌트가 언마운트돼도 전송은 정상 완료된다", async () => {
    const queryClient = createQueryClient();
    let resolveUpload: (urls: string[]) => void = () => {};
    mockUploadChatImages.mockImplementation(
      () => new Promise<string[]>((resolve) => {
        resolveUpload = resolve;
      }),
    );
    mockEmit.mockImplementation((_event, _payload, ack) => {
      ack(null, { status: "ok" });
    });

    const { container, unmount } = renderInput(queryClient);
    attachImage(container);

    await act(async () => {
      fireEvent.submit(container.querySelector("form")!);
    });

    // 업로드가 끝나기 전에 채팅방을 닫는다
    unmount();

    await act(async () => {
      resolveUpload(["https://blob.test/uploaded.jpg"]);
    });

    await waitFor(() => expect(mockEmit).toHaveBeenCalled());

    // 언마운트됐어도 올바른 방으로 전송이 나갔다
    expect(mockEmit.mock.calls[0][1]).toMatchObject({
      roomId: ROOM_ID,
      imageUrls: ["https://blob.test/uploaded.jpg"],
    });
    // 낙관적 메시지 교체를 위한 상관 ID가 함께 실려 나간다
    const payload = mockEmit.mock.calls[0][1] as { clientMessageId?: string };
    expect(payload.clientMessageId).toBeTruthy();
    expect(getCachedMessages(queryClient)[0].clientMessageId).toBe(
      payload.clientMessageId,
    );
    // 낙관적 메시지도 전역 캐시에 정상 반영됐다
    expect(getCachedMessages(queryClient)).toHaveLength(1);
  });

});

describe("이미지 첨부", () => {
  it("최대 개수를 넘겨 선택하면 초과분은 버리고 안내한다", async () => {
    const { container } = renderInput(createQueryClient());

    attachImage(container, MAX_CHAT_IMAGES + 2);

    expect(await screen.findAllByAltText("common.aria.preview_image")).toHaveLength(
      MAX_CHAT_IMAGES,
    );
    expect(toast.error).toHaveBeenCalledWith("chat.image.limit_exceeded");
  });

  it("여러 번에 나눠 첨부해도 누적되고, 한도를 넘으면 막힌다", async () => {
    const { container } = renderInput(createQueryClient());

    attachImage(container, 2);
    expect(await screen.findAllByAltText("common.aria.preview_image")).toHaveLength(2);

    // 두 번째 배치: 남은 자리는 1개뿐
    attachImage(container, 2);
    expect(await screen.findAllByAltText("common.aria.preview_image")).toHaveLength(
      MAX_CHAT_IMAGES,
    );
    expect(toast.error).toHaveBeenCalledWith("chat.image.limit_exceeded");

    // 가득 찬 상태에서는 첨부 버튼이 비활성화된다
    expect(screen.getByLabelText("chat.aria.attach_image")).toBeDisabled();
  });

  it("첨부를 제거하면 미리보기 URL이 해제된다", async () => {
    const { container } = renderInput(createQueryClient());

    attachImage(container, 2);
    await screen.findAllByAltText("common.aria.preview_image");

    fireEvent.click(screen.getAllByLabelText("common.aria.delete_image")[0]);

    await waitFor(() =>
      expect(screen.getAllByAltText("common.aria.preview_image")).toHaveLength(1),
    );
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview-1");
    // 남은 이미지의 URL은 해제되지 않는다
    expect(global.URL.revokeObjectURL).not.toHaveBeenCalledWith("blob:preview-2");
  });
});
