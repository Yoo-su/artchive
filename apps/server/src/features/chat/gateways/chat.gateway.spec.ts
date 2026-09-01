import { Test, TestingModule } from '@nestjs/testing';

jest.mock('../services/chat.service');
import { JwtService } from '@nestjs/jwt';

import { UserService } from '@/features/user/services/user.service';

import { ChatService } from '../services/chat.service';
import { ChatGateway } from './chat.gateway';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let chatService: { saveMessage: jest.Mock };

  beforeEach(async () => {
    chatService = { saveMessage: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: ChatService,
          useValue: chatService,
        },
        {
          provide: JwtService,
          useValue: {},
        },
        {
          provide: UserService,
          useValue: {},
        },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleSendMessage', () => {
    const savedMessage = { id: 1, content: '안녕하세요' };
    const user = { id: 10 };
    const client = { data: { user } };
    let emit: jest.Mock;

    beforeEach(() => {
      emit = jest.fn();
      gateway.server = { to: jest.fn(() => ({ emit })) } as never;
      chatService.saveMessage.mockResolvedValue(savedMessage);
    });

    it('상관 ID를 브로드캐스트와 응답에 그대로 되돌려준다', async () => {
      const result = await gateway.handleSendMessage(
        { roomId: 3, content: '안녕하세요', clientMessageId: 'cid-1' },
        client as never,
      );

      expect(emit).toHaveBeenCalledWith('newMessage', {
        ...savedMessage,
        clientMessageId: 'cid-1',
      });
      expect(result).toEqual({
        status: 'ok',
        message: { ...savedMessage, clientMessageId: 'cid-1' },
      });
      // 저장에는 관여하지 않는 일회성 필드
      expect(chatService.saveMessage).toHaveBeenCalledWith(
        '안녕하세요',
        3,
        user,
        undefined,
      );
    });

    it('상관 ID가 없으면 메시지에 필드를 붙이지 않는다', async () => {
      await gateway.handleSendMessage(
        { roomId: 3, content: '안녕하세요' },
        client as never,
      );

      expect(emit).toHaveBeenCalledWith('newMessage', savedMessage);
    });

    it('허용 길이를 넘는 상관 ID는 무시한다', async () => {
      await gateway.handleSendMessage(
        {
          roomId: 3,
          content: '안녕하세요',
          clientMessageId: 'x'.repeat(65),
        },
        client as never,
      );

      expect(emit).toHaveBeenCalledWith('newMessage', savedMessage);
    });
  });
});
