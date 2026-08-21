/* eslint-disable @typescript-eslint/unbound-method */
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Socket } from 'socket.io';

import { UserService } from '@/features/user/services/user.service';

import { NotificationGateway } from './notification.gateway';

describe('NotificationGateway', () => {
  let gateway: NotificationGateway;
  let jwtService: { verifyAsync: jest.Mock };
  let userService: { findById: jest.Mock };

  beforeEach(async () => {
    jwtService = {
      verifyAsync: jest.fn(),
    };
    userService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationGateway,
        { provide: JwtService, useValue: jwtService },
        { provide: UserService, useValue: userService },
      ],
    }).compile();

    gateway = module.get<NotificationGateway>(NotificationGateway);
    gateway.server = {
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
    } as any;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('handleConnection should authenticate and join user room', async () => {
    const mockSocket = {
      id: 'sock-1',
      handshake: {
        auth: { token: 'valid-jwt-token' },
      },
      data: {},
      join: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
      emit: jest.fn(),
    } as unknown as Socket;

    jwtService.verifyAsync.mockResolvedValue({ sub: 42 });
    userService.findById.mockResolvedValue({ id: 42, nickname: 'User42' });

    await gateway.handleConnection(mockSocket);

    expect(mockSocket.data.user).toEqual({ id: 42, nickname: 'User42' });
    expect(mockSocket.join).toHaveBeenCalledWith('user:42');
  });

  it('sendNotification should broadcast to user room', () => {
    const mockPayload = { id: 1, type: 'COMMENT_LIKE' };
    const mockToEmitter = { emit: jest.fn() };
    (gateway.server.to as jest.Mock).mockReturnValue(mockToEmitter);

    gateway.sendNotification(42, mockPayload as any);

    expect(gateway.server.to).toHaveBeenCalledWith('user:42');
    expect(mockToEmitter.emit).toHaveBeenCalledWith(
      'newNotification',
      mockPayload,
    );
  });
});
