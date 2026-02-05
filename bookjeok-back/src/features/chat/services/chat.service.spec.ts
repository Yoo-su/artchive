import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ChatRoom } from '../entities/chat-room.entity';
import { ChatParticipant } from '../entities/chat-participant.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { UsedBookSale } from '@/features/used-book-sale/entities/used-book-sale.entity';
import { ReadReceipt } from '../entities/read-receipt.entity';
import { ChatGateway } from '../gateways/chat.gateway';
import { BusinessException } from '@/shared/exceptions/business.exception';
import { User } from '@/features/user/entities/user.entity';

describe('ChatService', () => {
  let service: ChatService;
  let mockDataSource: Partial<DataSource>;
  let mockManager: Partial<EntityManager>;

  // Repositories
  let chatRoomRepo: Partial<Repository<ChatRoom>>;
  let chatParticipantRepo: Partial<Repository<ChatParticipant>>;
  let chatMessageRepo: Partial<Repository<ChatMessage>>;
  let usedBookSaleRepo: Partial<Repository<UsedBookSale>>;

  // Gateway
  let chatGateway: Partial<ChatGateway>;

  beforeEach(async () => {
    mockManager = {
      save: jest.fn(),
      findOne: jest.fn(),
    };

    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: mockManager,
      }),
    };

    chatRoomRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
      }),
      create: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
    };

    chatParticipantRepo = {
      create: jest.fn(),
      findOne: jest.fn(),
    };

    chatMessageRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    usedBookSaleRepo = {
      findOne: jest.fn(),
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
          provide: getRepositoryToken(UsedBookSale),
          useValue: usedBookSaleRepo,
        },
        { provide: getRepositoryToken(ReadReceipt), useValue: {} },
        { provide: ChatGateway, useValue: chatGateway },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  describe('getChatRoom', () => {
    it('판매글이 없으면 예외를 던져야 합니다', async () => {
      (usedBookSaleRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getChatRoom(1, 1)).rejects.toThrow(
        BusinessException,
      );
    });

    it('자신의 판매글에 채팅을 시도하면 예외를 던져야 합니다', async () => {
      (usedBookSaleRepo.findOne as jest.Mock).mockResolvedValue({
        user: { id: 1 },
      });

      await expect(service.getChatRoom(1, 1)).rejects.toThrow(
        BusinessException,
      );
    });

    it('기존 채팅방이 있으면 반환해야 합니다', async () => {
      const sale = { id: 1, user: { id: 2 } };
      const existingRoom = { id: 10, participants: [] };

      (usedBookSaleRepo.findOne as jest.Mock).mockResolvedValue(sale);

      const queryBuilder = chatRoomRepo.createQueryBuilder!();
      (queryBuilder.getOne as jest.Mock).mockResolvedValue(existingRoom);

      // 방을 다시 로드하는 로직 대응
      (chatRoomRepo.findOne as jest.Mock).mockResolvedValue(existingRoom);

      const result = await service.getChatRoom(1, 1);
      expect(result).toEqual(existingRoom);
    });

    it('기존 채팅방이 없으면 새로 생성해야 합니다 (트랜잭션)', async () => {
      const sale = { id: 1, user: { id: 2 } }; // Seller = 2
      const buyerId = 1;

      (usedBookSaleRepo.findOne as jest.Mock).mockResolvedValue(sale);

      // 기존 방 없음
      const queryBuilder = chatRoomRepo.createQueryBuilder!();
      (queryBuilder.getOne as jest.Mock).mockResolvedValue(null);

      // 새 방 생성 모의
      const newRoom = { id: 99 };
      (chatRoomRepo.create as jest.Mock).mockReturnValue(newRoom);
      (mockManager.save as jest.Mock).mockImplementation((entity, data) => {
        if (entity === ChatRoom) return { ...data, id: 99 } as ChatRoom; // 저장된 방
        return data as ChatParticipant;
      });

      // 최종 조회 모의
      (chatRoomRepo.findOne as jest.Mock).mockResolvedValue({ ...newRoom });

      await service.getChatRoom(1, buyerId);

      // 검증
      expect(mockDataSource.createQueryRunner).toHaveBeenCalled();
      expect(mockManager.save).toHaveBeenCalled(); // 방 저장, 참여자 저장
      expect(chatGateway.joinRoom).toHaveBeenCalledWith([buyerId, 2], 99); // 소켓 조인 확인
      expect(chatGateway.notifyNewRoom).toHaveBeenCalled();
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
      (chatRoomRepo.findOneBy as jest.Mock).mockResolvedValue(room);
      (chatMessageRepo.create as jest.Mock).mockReturnValue({ content: 'hi' });
      (chatMessageRepo.save as jest.Mock).mockResolvedValue({
        id: 100,
        content: 'hi',
      });

      await service.saveMessage('hi', 1, user);

      expect(chatRoomRepo.save).toHaveBeenCalled(); // 시간 업데이트 확인
      expect(chatMessageRepo.save).toHaveBeenCalled(); // 메시지 저장 확인
    });
  });
});
