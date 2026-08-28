import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Order, OrderStatus } from '@/features/order/entities/order.entity';
import {
  SaleStatus,
  UsedBookSale,
} from '@/features/used-book-sale/entities/used-book-sale.entity';
import { UsedBookSaleService } from '@/features/used-book-sale/services/used-book-sale.service';
import { User } from '@/features/user/entities/user.entity';
import { BusinessException } from '@/shared/exceptions/business.exception';

import { ChatMessage, ChatMessageType } from '../entities/chat-message.entity';
import { ChatParticipant } from '../entities/chat-participant.entity';
import { ChatRoom } from '../entities/chat-room.entity';
import { ReadReceipt } from '../entities/read-receipt.entity';
import { ChatGateway } from '../gateways/chat.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(ChatParticipant)
    private readonly chatParticipantRepository: Repository<ChatParticipant>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly usedBookSaleService: UsedBookSaleService,
    @InjectRepository(ReadReceipt)
    private readonly readReceiptRepository: Repository<ReadReceipt>,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // 동일 saleId:buyerId에 대해 동시에 진행 중인 채팅방 조회/생성 작업을 관리하는 Map (Request Collapsing)
  private roomCreationTasks = new Map<string, Promise<ChatRoom>>();

  /**
   * 판매글 ID와 구매자 ID로 채팅방을 찾거나 생성하여 반환합니다.
   * - Request Collapsing을 통해 동일 판매글/구매자 동시 요청 시 중복 방 생성을 방지합니다.
   * @param saleId 판매글 ID
   * @param buyerId 구매자 ID
   * @returns 채팅방 엔티티
   */
  async getChatRoom(saleId: number, buyerId: number): Promise<ChatRoom> {
    const taskKey = `${saleId}:${buyerId}`;
    const existingTask = this.roomCreationTasks.get(taskKey);
    if (existingTask) {
      return await existingTask;
    }

    const task = this.resolveChatRoom(saleId, buyerId).finally(() => {
      this.roomCreationTasks.delete(taskKey);
    });

    this.roomCreationTasks.set(taskKey, task);
    return await task;
  }

  /**
   * 채팅방 조회 및 신규 생성 실제 비즈니스 로직
   */
  private async resolveChatRoom(
    saleId: number,
    buyerId: number,
  ): Promise<ChatRoom> {
    const sale = await this.usedBookSaleService.findSaleById(saleId);
    if (!sale) {
      throw new BusinessException('SALE_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    if (sale.status === SaleStatus.WITHDRAWN) {
      throw new BusinessException(
        'SALE_ALREADY_WITHDRAWN',
        HttpStatus.BAD_REQUEST,
      );
    }

    const sellerId = sale.user.id;
    if (sellerId === buyerId) {
      throw new BusinessException('CHAT_SELF_CHAT', HttpStatus.FORBIDDEN);
    }

    // 판매자 이메일 인증 여부 검증
    if (sale.user.isEmailVerified === false) {
      throw new BusinessException('EMAIL_NOT_VERIFIED', HttpStatus.FORBIDDEN);
    }

    // 1. 기존 방 조회 (탈퇴자 제외하고 활성 참가자 확인)
    const existingRoom = await this.chatRoomRepository
      .createQueryBuilder('room')
      .innerJoin('room.participants', 'p1')
      .innerJoin('p1.user', 'u1', 'u1.id = :buyerId AND u1.deletedAt IS NULL', {
        buyerId,
      })
      .innerJoin('room.participants', 'p2')
      .innerJoin(
        'p2.user',
        'u2',
        'u2.id = :sellerId AND u2.deletedAt IS NULL',
        { sellerId },
      )
      .where('room.usedBookSale.id = :saleId', { saleId })
      .leftJoinAndSelect('room.participants', 'allParticipants')
      .leftJoinAndSelect('allParticipants.user', 'user')
      .getOne();

    if (existingRoom) {
      const participantsToUpdate = existingRoom.participants.filter(
        (p) => !p.isActive,
      );

      if (participantsToUpdate.length > 0) {
        const systemMessages = await this.reactivateParticipants(
          existingRoom,
          participantsToUpdate,
        );

        // 소켓 이벤트 전송
        for (const msg of systemMessages) {
          this.chatGateway.emitUserRejoined(existingRoom.id, msg);
        }
      }

      // 유저가 나갔다가 다시 들어온 경우, 필요한 관계들이 로드되지 않았을 수 있으므로 다시 조회합니다.
      const reloadedRoom = await this.chatRoomRepository.findOne({
        where: { id: existingRoom.id },
        relations: [
          'participants',
          'participants.user',
          'usedBookSale',
          'usedBookSale.book',
          'usedBookSale.user',
        ],
      });

      if (!reloadedRoom) {
        throw new BusinessException(
          'CHAT_FAILED_RETRIEVE',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return reloadedRoom;
    }

    // 2. 새 방 생성
    const savedRoom = await this.createNewChatRoom(sale, buyerId, sellerId);

    // 소켓 작업
    this.chatGateway.joinRoom([buyerId, sellerId], savedRoom.id);

    const createdRoom = await this.chatRoomRepository.findOne({
      where: { id: savedRoom.id },
      relations: [
        'participants',
        'participants.user',
        'usedBookSale',
        'usedBookSale.book',
        'usedBookSale.user',
      ],
    });

    if (!createdRoom)
      throw new BusinessException(
        'CHAT_FAILED_RETRIEVE',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    this.chatGateway.notifyNewRoom(sellerId, createdRoom);

    // 신규 채팅방 생성 비동기 알림 이벤트 발행
    const buyerParticipant = createdRoom.participants?.find(
      (p) => p.user?.id === buyerId,
    );
    this.eventEmitter.emit('chat.room_created', {
      seller: sale.user,
      buyerNickname: buyerParticipant?.user?.nickname ?? '구매자',
      bookTitle: sale.book?.title ?? '중고 도서',
      chatRoomId: createdRoom.id,
    });

    return createdRoom;
  }

  private async reactivateParticipants(
    existingRoom: ChatRoom,
    participantsToUpdate: ChatParticipant[],
  ): Promise<ChatMessage[]> {
    participantsToUpdate.forEach((p) => (p.isActive = true));
    await this.chatParticipantRepository.save(participantsToUpdate);

    existingRoom.updatedAt = new Date();
    await this.chatRoomRepository.save(existingRoom);

    const systemMessages: ChatMessage[] = [];
    for (const participant of participantsToUpdate) {
      const systemMessage = this.chatMessageRepository.create({
        chatRoom: { id: existingRoom.id },
        content: `${participant.user.nickname}님이 다시 참여했습니다.`,
        sender: null,
      });
      const savedMessage = await this.chatMessageRepository.save(systemMessage);
      systemMessages.push(savedMessage);
    }
    return systemMessages;
  }

  private async createNewChatRoom(
    sale: UsedBookSale,
    buyerId: number,
    sellerId: number,
  ): Promise<ChatRoom> {
    const newRoom = this.chatRoomRepository.create({ usedBookSale: sale });
    const room = await this.chatRoomRepository.save(newRoom);

    const buyerParticipant = this.chatParticipantRepository.create({
      chatRoom: room,
      user: { id: buyerId } as User,
      isActive: true,
    });
    const sellerParticipant = this.chatParticipantRepository.create({
      chatRoom: room,
      user: { id: sellerId } as User,
      isActive: true,
    });

    await this.chatParticipantRepository.save([
      buyerParticipant,
      sellerParticipant,
    ]);
    return room;
  }

  /**
   * 현재 로그인한 유저의 모든 채팅방 목록을 조회합니다.
   * 각 채팅방의 마지막 메시지, 안 읽은 메시지 개수, 상대방 정보를 포함합니다.
   * @param userId 유저 ID
   * @returns 채팅방 목록 및 상세 정보
   */
  async getChatRooms(userId: number) {
    // 1. 현재 유저가 참여하고 있는 모든 채팅방을 찾습니다.
    const rooms = await this.chatRoomRepository
      .createQueryBuilder('room')
      .innerJoin(
        'room.participants',
        'participant',
        'participant.userId = :userId AND participant.isActive = true',
        { userId },
      )
      .leftJoinAndSelect('room.participants', 'allParticipants')
      .leftJoinAndSelect('allParticipants.user', 'participantUser')
      .leftJoinAndSelect('room.usedBookSale', 'sale')
      .leftJoinAndSelect('sale.book', 'book')
      .leftJoinAndSelect('sale.user', 'saleUser')
      .orderBy('room.updatedAt', 'DESC')
      .getMany();

    if (rooms.length === 0) {
      return [];
    }

    const roomIds = rooms.map((room) => room.id);

    // 2. 각 채팅방의 마지막 메시지를 일괄 조회합니다.
    // PostgreSQL의 DISTINCT ON을 사용하여 각 채팅방별 최신 메시지 하나씩만 가져옵니다.
    const lastMessages = await this.chatMessageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.chatRoom', 'chatRoom')
      .where('message.chatRoom.id IN (:...roomIds)', { roomIds })
      .distinctOn(['message.chatRoom.id'])
      .orderBy('message.chatRoom.id')
      .addOrderBy('message.createdAt', 'DESC')
      .getMany();

    const lastMessageMap = new Map<number, ChatMessage>();
    lastMessages.forEach((msg) => {
      lastMessageMap.set(msg.chatRoom.id, msg);
    });

    // 3. 안 읽은 메시지 개수 일괄 조회 (내가 보낸 메시지 제외, 상대방 메시지 및 시스템/거래 메시지 포함)
    const unreadCounts = await this.chatMessageRepository
      .createQueryBuilder('message')
      .leftJoin('message.sender', 'sender')
      .leftJoin('message.readReceipts', 'receipt', 'receipt.userId = :userId', {
        userId,
      })
      .select('message.chatRoom.id', 'roomId')
      .addSelect('COUNT(message.id)', 'count')
      .where('message.chatRoom.id IN (:...roomIds)', { roomIds })
      .andWhere('(sender.id IS NULL OR sender.id != :userId)', { userId })
      .andWhere('receipt.id IS NULL')
      .groupBy('message.chatRoom.id')
      .getRawMany();

    const unreadCountMap = new Map<number, number>();
    unreadCounts.forEach((row) => {
      unreadCountMap.set(row.roomId, parseInt(row.count, 10));
    });

    // 4. 데이터 병합
    const roomsWithDetails = rooms.map((room) => {
      return {
        ...room,
        lastMessage: lastMessageMap.get(room.id) || null,
        unreadCount: unreadCountMap.get(room.id) || 0,
      };
    });

    // 5. 정렬 (마지막 메시지 최신순, 없으면 방 업데이트 순)
    roomsWithDetails.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt.getTime() || a.updatedAt.getTime();
      const timeB = b.lastMessage?.createdAt.getTime() || b.updatedAt.getTime();
      return timeB - timeA;
    });

    return roomsWithDetails;
  }

  /**
   * 특정 채팅방의 메시지 목록을 페이지네이션으로 조회합니다.
   * 채팅방 참여자만 조회할 수 있습니다.
   * @param roomId 채팅방 ID
   * @param userId 요청자 ID (참여자 검증용)
   * @param page 페이지 번호
   * @param limit 페이지 당 메시지 수
   * @returns 메시지 목록 및 메타데이터
   */
  async getChatMessages(
    roomId: number,
    userId: number,
    page: number,
    limit: number,
    cursorId?: number,
  ) {
    // 채팅방 참여자 검증
    const participant = await this.chatParticipantRepository.findOne({
      where: { chatRoom: { id: roomId }, user: { id: userId } },
    });

    if (!participant) {
      throw new BusinessException('CHAT_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    const queryBuilder = this.chatMessageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('message.chatRoom.id = :roomId', { roomId })
      .orderBy('message.createdAt', 'DESC');

    // 커서 기반 페이지네이션
    if (cursorId) {
      queryBuilder.andWhere('message.id < :cursorId', { cursorId });
    } else {
      // 오프셋 기반 (fallback)
      queryBuilder.skip((page - 1) * limit);
    }

    queryBuilder.take(limit);

    const messages = await queryBuilder.getMany();

    // 페이지네이션 정보 계산
    const hasNextPage = messages.length === limit;
    let nextCursor: number | null = null;

    if (hasNextPage && messages.length > 0) {
      nextCursor = messages[messages.length - 1].id;
    }

    return {
      messages,
      hasNextPage,
      nextCursor,
    };
  }

  /**
   * 메시지를 저장하고 채팅방의 업데이트 시간을 갱신합니다.
   * 채팅방 참여자만 메시지를 보낼 수 있습니다.
   * @param content 메시지 내용
   * @param roomId 채팅방 ID
   * @param sender 보낸 사람
   * @returns 저장된 메시지
   */
  async saveMessage(
    content: string,
    roomId: number,
    sender: User,
  ): Promise<ChatMessage> {
    // 참여자 검증: 활성 상태인 참여자만 메시지 전송 가능
    const participant = await this.chatParticipantRepository.findOne({
      where: {
        chatRoom: { id: roomId },
        user: { id: sender.id },
        isActive: true,
      },
    });

    if (!participant) {
      throw new BusinessException('CHAT_FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    // 상대방 검증: 상대방 참여자가 비활성화(isActive = false) 또는 탈퇴(deletedAt is not null) 상태인 경우 메시지 전송 불가
    const otherParticipants = await this.chatParticipantRepository.find({
      where: {
        chatRoom: { id: roomId },
      },
      relations: ['user'],
    });

    const hasWithdrawnParticipant = otherParticipants.some(
      (p) => p.user.id !== sender.id && (!p.isActive || p.user.deletedAt),
    );

    if (hasWithdrawnParticipant) {
      throw new BusinessException(
        'CHAT_PARTICIPANT_WITHDRAWN',
        HttpStatus.BAD_REQUEST,
      );
    }

    const chatRoom = await this.chatRoomRepository.findOneBy({ id: roomId });
    if (!chatRoom)
      throw new BusinessException('CHAT_ROOM_NOT_FOUND', HttpStatus.NOT_FOUND);

    chatRoom.updatedAt = new Date();
    await this.chatRoomRepository.save(chatRoom);

    const message = this.chatMessageRepository.create({
      content,
      chatRoom,
      sender,
    });
    return await this.chatMessageRepository.save(message);
  }

  /**
   * 특정 채팅방의 안 읽은 메시지를 모두 읽음으로 처리합니다.
   * @param roomId 채팅방 ID
   * @param userId 유저 ID
   * @returns 처리 결과
   */
  async markMessagesAsRead(roomId: number, userId: number) {
    // 1. 이 방에서, 내가 보낸 메시지가 아니고(상대방 메시지 및 시스템/거래 메시지), 내가 아직 읽지 않은 모든 메시지를 찾습니다.
    const unreadMessages = await this.chatMessageRepository
      .createQueryBuilder('message')
      .leftJoin('message.sender', 'sender')
      .leftJoin('message.readReceipts', 'receipt', 'receipt.userId = :userId', {
        userId,
      })
      .where('message.chatRoom.id = :roomId', { roomId })
      .andWhere('(sender.id IS NULL OR sender.id != :userId)', { userId })
      .andWhere('receipt.id IS NULL')
      .getMany();

    if (unreadMessages.length === 0) {
      return { success: true, message: 'No new messages to mark as read.' };
    }

    // 2. 찾아낸 모든 메시지에 대해 "내가 읽었다"는 기록을 새로 생성합니다.
    const newReceipts = unreadMessages.map((message) =>
      this.readReceiptRepository.create({
        user: { id: userId } as User,
        message: { id: message.id } as ChatMessage,
      }),
    );

    await this.readReceiptRepository.save(newReceipts);

    return { success: true, message: 'Messages marked as read.' };
  }

  /**
   * 채팅방 나가기
   * @param roomId - 나갈 채팅방 ID
   * @param userId - 나가는 사용자 ID
   */
  async leaveRoom(roomId: number, userId: number) {
    // 1. 활성 거래 여부 검증 (결제 기능 활성화 시 진행 중인 거래가 있는 경우 나가기 불가)
    const isPaymentEnabled = process.env.FEATURE_PAYMENT_ENABLED === 'true';
    if (isPaymentEnabled) {
      const activeOrder = await this.orderRepository.findOne({
        where: {
          chatRoomId: roomId,
          status: In([
            OrderStatus.AWAITING_PAYMENT,
            OrderStatus.PAID,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
            OrderStatus.DISPUTED,
          ]),
        },
      });

      if (activeOrder) {
        throw new BusinessException(
          'CHAT_CANNOT_LEAVE_DURING_TRADE',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // 2. 내 참여 정보 조회
    const participant = await this.chatParticipantRepository.findOne({
      where: { chatRoom: { id: roomId }, user: { id: userId } },
      relations: ['user'],
    });

    if (!participant || !participant.isActive) {
      throw new BusinessException('CHAT_ALREADY_LEFT', HttpStatus.NOT_FOUND);
    }

    // 3. 내 참여 상태를 false로 변경
    participant.isActive = false;
    await this.chatParticipantRepository.save(participant);

    // 4. 시스템 메시지 생성 ("OOO님이 나갔습니다.")
    const systemMessage = this.chatMessageRepository.create({
      chatRoom: { id: roomId },
      content: `${participant.user.nickname}님이 나갔습니다.`,
      sender: null,
    });
    return await this.chatMessageRepository.save(systemMessage);
  }

  /**
   * 거래 상태 변경 또는 거래 액션에 대한 시스템 메시지를 저장하고 브로드캐스트합니다.
   * @param roomId 채팅방 ID
   * @param content 메시지 내용
   * @param type 메시지 타입 (기본: TRADE_STATUS)
   * @param metadata 거래 상태 정보 등 메타데이터
   */
  async sendTradeMessage(
    roomId: number,
    content: string,
    type: ChatMessageType = ChatMessageType.TRADE_STATUS,
    metadata?: Record<string, any>,
  ): Promise<ChatMessage> {
    const chatRoom = await this.chatRoomRepository.findOneBy({ id: roomId });
    if (!chatRoom) {
      throw new BusinessException('CHAT_ROOM_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    chatRoom.updatedAt = new Date();
    await this.chatRoomRepository.save(chatRoom);

    const message = this.chatMessageRepository.create({
      chatRoom: { id: roomId },
      content,
      type,
      metadata: metadata || null,
      sender: null,
    });

    const savedMessage = await this.chatMessageRepository.save(message);

    // 실시간 소켓 브로드캐스트
    if (this.chatGateway?.server) {
      this.chatGateway.server
        .to(String(roomId))
        .emit('newMessage', savedMessage);
    }

    return savedMessage;
  }

  /**
   * 판매자가 특정 구매자와 거래를 시작했을 때, 해당 판매글의 다른 활성 채팅방들에 알림 메시지를 전송합니다.
   * @param saleId 판매글 ID
   * @param currentChatRoomId 제외할 현재 거래 진행 중인 채팅방 ID
   */
  async notifyOtherBuyersTrading(
    saleId: number,
    currentChatRoomId?: number | null,
  ): Promise<void> {
    const queryBuilder = this.chatRoomRepository
      .createQueryBuilder('room')
      .innerJoin('room.usedBookSale', 'sale')
      .where('sale.id = :saleId', { saleId });

    if (currentChatRoomId) {
      queryBuilder.andWhere('room.id != :currentChatRoomId', {
        currentChatRoomId,
      });
    }

    const otherRooms = await queryBuilder.getMany();

    for (const room of otherRooms) {
      try {
        await this.sendTradeMessage(
          room.id,
          '판매자가 다른 구매자와 거래를 진행 중입니다.',
          ChatMessageType.TRADE_STATUS,
          { saleId, status: 'RESERVED' },
        );
      } catch (error) {
        // 개별 방 알림 실패는 무시하고 계속 진행
      }
    }
  }
}
