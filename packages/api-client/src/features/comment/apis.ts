import { API_PATHS } from "@bookjeok/core";
import { Comment, CreateCommentParams, GetCommentsParams, GetCommentsResponse, GetMyCommentsResponse, UpdateCommentParams } from "@bookjeok/core/comment";
import { AxiosInstance } from "axios";

/**
 * 댓글 목록을 조회합니다.
 */
export const getComments = async (
  client: AxiosInstance,
  params: GetCommentsParams,
): Promise<GetCommentsResponse> => {
  const { data } = await client.get<GetCommentsResponse>(
    API_PATHS.comment.base,
    { params },
  );
  return data;
};

/**
 * 댓글을 생성합니다.
 */
export const createComment = async (
  client: AxiosInstance,
  params: CreateCommentParams,
): Promise<Comment> => {
  const { data } = await client.post<Comment>(API_PATHS.comment.base, params);
  return data;
};

/**
 * 댓글을 수정합니다.
 */
export const updateComment = async (
  client: AxiosInstance,
  id: number,
  params: UpdateCommentParams,
): Promise<Comment> => {
  const { data } = await client.patch<Comment>(
    API_PATHS.comment.detail(id),
    params,
  );
  return data;
};

/**
 * 댓글을 삭제합니다.
 */
export const deleteComment = async (
  client: AxiosInstance,
  id: number,
): Promise<void> => {
  await client.delete(API_PATHS.comment.detail(id));
};

/**
 * 댓글 좋아요를 토글합니다.
 */
export const toggleCommentLike = async (
  client: AxiosInstance,
  id: number,
): Promise<Comment & { isLiked: boolean }> => {
  const { data } = await client.post<Comment & { isLiked: boolean }>(
    API_PATHS.comment.like(id),
  );
  return data;
};

/**
 * 내 좋아요 상태를 조회합니다.
 */
export const getMyLikeStatus = async (
  client: AxiosInstance,
  id: number,
): Promise<boolean> => {
  const { data } = await client.get<{ isLiked: boolean }>(
    API_PATHS.comment.like(id),
  );
  return data.isLiked;
};

/**
 * 내 댓글 목록을 조회합니다.
 */
export const getMyComments = async (
  client: AxiosInstance,
  page: number = 1,
  limit: number = 10,
  cursorId?: number,
): Promise<GetMyCommentsResponse> => {
  const { data } = await client.get<GetMyCommentsResponse>(
    API_PATHS.comment.my,
    { params: { page, limit, cursorId } },
  );
  return data;
};
