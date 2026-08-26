import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  SaleStatus,
  UsedBookSale,
} from '@/features/used-book-sale/entities/used-book-sale.entity';
import { UsedBookSaleService } from '@/features/used-book-sale/services/used-book-sale.service';
import { User } from '@/features/user/entities/user.entity';
import { BusinessException } from '@/shared/exceptions/business.exception';

import { ChatMessage } from '../entities/chat-message.entity';
import { ChatParticipant } from '../entities/chat-participant.entity';
import { ChatRoom } from '../entities/chat-room.entity';
import { ReadReceipt } from '../entities/read-receipt.entity';
import { ChatGateway } from '../gateways/chat.gateway';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;

  // Repositories
  let chatRoomRepo: Partial<Repository<ChatRoom>>;
  let chatParticipantRepo: Partial<Repository<ChatParticipant>>;
  let chatMessageRepo: Partial<Repository<ChatMessage>>;
  let mockQueryBuilder: any;

  // Services
  let usedBookSaleService: any;

  // Gateway
  let chatGateway: Partial<ChatGateway>;

  beforeEach(async () => {
    mockQueryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    chatRoomRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      create: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
    };

    chatParticipantRepo = {
      create: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    };

    chatMessageRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    usedBookSaleService = {
      findSaleById: jest.fn(),
    };

    chatGateway = {
      joinRoom: jest.fn(),
      notifyNewRoom: jest.fn(),
      emitUserRejoined: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getRepositoryToken(ChatRoom), useValue: chatRoomRepo },
        {
          provide: getRepositoryToken(ChatParticipant),
          useValue: chatParticipantRepo,
        },
        { provide: getRepositoryToken(ChatMessage), useValue: chatMessageRepo },
        {
          provide: UsedBookSaleService,
          useValue: usedBookSaleService,
        },
        { provide: getRepositoryToken(ReadReceipt), useValue: {} },
        { provide: ChatGateway, useValue: chatGateway },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  describe('getChatRoom', () => {
    it('판매글이 없으면 예외를 던져야 합니다', async () => {
      (usedBookSaleService.findSaleById as jest.Mock).mockResolvedValue(null);

      await expect(service.getChatRoom(1, 1)).rejects.toThrow(
        BusinessException,
      );
    });

    it('자신의 판매글에 채팅을 시도하면 예외를 던져야 합니다', async () => {
      (usedBookSaleService.findSaleById as jest.Mock).mockResolvedValue({
        user: { id: 1 },
      });

      await expect(service.getChatRoom(1, 1)).rejects.toThrow(
        BusinessException,
      );
    });

    it('탈퇴한 회원의 판매글로 채팅방 개설을 시도하면 예외를 던져야 합니다', async () => {
      (usedBookSaleService.findSaleById as jest.Mock).mockResolvedValue({
        user: { id: 2 },
        status: SaleStatus.WITHDRAWN,
      });

      await expect(service.getChatRoom(1, 1)).rejects.toThrow(
        BusinessException,
      );
    });

    it('기존 채팅방이 있으면 올바른 조인 쿼리를 실행하고 반환해야 합니다', async () => {
      const existingRoom = { id: 1, participants: [{ isActive: true }] };
      const sale = { id: 1, user: { id: 2 } };

      (usedBookSaleService.findSaleById as jest.Mock).mockResolvedValue(sale);
      mockQueryBuilder.getOne.mockResolvedValue(existingRoom);
      (chatRoomRepo.findOne as jest.Mock).mockResolvedValue(existingRoom);

      const result = await service.getChatRoom(1, 1);
      expect(result).toEqual(existingRoom);

      // 올바른 조인 체인 검증
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'room.participants',
        'p1',
      );
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'p1.user',
        'u1',
        'u1.id = :buyerId AND u1.deletedAt IS NULL',
        { buyerId: 1 },
      );
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'room.participants',
        'p2',
      );
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'p2.user',
        'u2',
        'u2.id = :sellerId AND u2.deletedAt IS NULL',
        { sellerId: 2 },
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'room.usedBookSale.id = :saleId',
        { saleId: 1 },
      );
    });

    it('기존 채팅방이 없으면 새로 생성해야 합니다', async () => {
      const sale = { id: 1, user: { id: 2 } }; // Seller = 2
      const buyerId = 1;

      (usedBookSaleService.findSaleById as jest.Mock).mockResolvedValue(sale);
      mockQueryBuilder.getOne.mockResolvedValue(null);

      const newRoom = { id: 99 };
      (chatRoomRepo.create as jest.Mock).mockReturnValue(newRoom);
      (chatRoomRepo.save as jest.Mock).mockResolvedValue({
        ...newRoom,
        id: 99,
      });
      (chatParticipantRepo.create as jest.Mock).mockImplementation(
        (data: ChatParticipant) => data,
      );
      (chatParticipantRepo.save as jest.Mock).mockResolvedValue([]);
      (chatRoomRepo.findOne as jest.Mock).mockResolvedValue({ ...newRoom });

      await service.getChatRoom(1, buyerId);

      expect(chatRoomRepo.save).toHaveBeenCalled();
      expect(chatParticipantRepo.save).toHaveBeenCalled();
      expect(chatGateway.joinRoom).toHaveBeenCalledWith([buyerId, 2], 99);
      expect(chatGateway.notifyNewRoom).toHaveBeenCalled();
    });

    it('동시에 여러 요청이 들어와도 Request Collapsing에 의해 방 생성이 1회만 실행되어야 합니다', async () => {
      const sale = { id: 1, user: { id: 2 } };
      const buyerId = 1;

      (usedBookSaleService.findSaleById as jest.Mock).mockResolvedValue(sale);
      mockQueryBuilder.getOne.mockResolvedValue(null);

      const newRoom = { id: 99 };
      (chatRoomRepo.create as jest.Mock).mockReturnValue(newRoom);
      (chatRoomRepo.save as jest.Mock).mockResolvedValue({
        ...newRoom,
        id: 99,
      });
      (chatParticipantRepo.create as jest.Mock).mockImplementation(
        (data: ChatParticipant) => data,
      );
      (chatParticipantRepo.save as jest.Mock).mockResolvedValue([]);
      (chatRoomRepo.findOne as jest.Mock).mockResolvedValue({ ...newRoom });

      // 5개의 동시 요청 실행
      const results = await Promise.all([
        service.getChatRoom(1, buyerId),
        service.getChatRoom(1, buyerId),
        service.getChatRoom(1, buyerId),
        service.getChatRoom(1, buyerId),
        service.getChatRoom(1, buyerId),
      ]);

      expect(results).toHaveLength(5);
      results.forEach((res) => expect(res).toEqual(newRoom));
      expect(chatRoomRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('saveMessage', () => {
    it('참여자가 아니면 메시지를 보낼 수 없습니다', async () => {
      (chatParticipantRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.saveMessage('hello', 1, { id: 1 } as User),
      ).rejects.toThrow(BusinessException);
    });

    it('메시지를 저장하고 채팅방 시간을 업데이트해야 합니다', async () => {
      const user = { id: 1 } as User;
      const room = { id: 1, updatedAt: new Date() };

      (chatParticipantRepo.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (chatParticipantRepo.find as jest.Mock).mockResolvedValue([
        { user: { id: 1 }, isActive: true },
        { user: { id: 2 }, isActive: true },
      ]);
      (chatRoomRepo.findOneBy as jest.Mock).mockResolvedValue(room);
      (chatMessageRepo.create as jest.Mock).mockReturnValue({ content: 'hi' });
      (chatMessageRepo.save as jest.Mock).mockResolvedValue({
        id: 100,
        content: 'hi',
      });

      await service.saveMessage('hi', 1, user);

      expect(chatRoomRepo.save).toHaveBeenCalledWith(room);
      expect(chatMessageRepo.save).toHaveBeenCalled();
    });

    it('상대방이 탈퇴한 경우 메시지를 전송할 수 없습니다', async () => {
      const user = { id: 1 } as User;

      (chatParticipantRepo.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      (chatParticipantRepo.find as jest.Mock).mockResolvedValue([
        { user: { id: 1 }, isActive: true },
        { user: { id: 2, deletedAt: new Date() }, isActive: true },
      ]);

      await expect(service.saveMessage('hi', 1, user)).rejects.toThrow(
        BusinessException,
      );
    });
  });

  describe('leaveRoom', () => {
    it('참여자가 아니거나 이미 나간 경우 예외를 던져야 합니다', async () => {
      (chatParticipantRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.leaveRoom(1, 1)).rejects.toThrow(BusinessException);
    });

    it('채팅방을 정상적으로 나가고 시스템 메시지를 생성해야 합니다', async () => {
      const participant = {
        id: 1,
        isActive: true,
        user: { id: 1, nickname: '테스터' },
      };

      (chatParticipantRepo.findOne as jest.Mock).mockResolvedValue(participant);
      (chatMessageRepo.create as jest.Mock).mockReturnValue({
        content: '테스터님이 나갔습니다.',
      });
      (chatMessageRepo.save as jest.Mock).mockResolvedValue({
        id: 200,
        content: '테스터님이 나갔습니다.',
      });

      const result = await service.leaveRoom(1, 1);

      expect(participant.isActive).toBe(false);
      expect(chatParticipantRepo.save).toHaveBeenCalledWith(participant);
      expect(chatMessageRepo.save).toHaveBeenCalled();
      expect(result.content).toBe('테스터님이 나갔습니다.');
    });
  });
});
