import { io, Socket } from 'socket.io-client';
import { Message } from '../types';

const SOCKET_URL = 'http://localhost:8080';

class SocketService {
    private socket: Socket | null = null;

    connect() {
        if (!this.socket) {
            this.socket = io(SOCKET_URL);

            this.socket.on('connect', () => {
                // Socket connected
            });

            this.socket.on('disconnect', () => {
                // Socket disconnected
            });
        }
        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // 채팅방 입장
    joinRoom(chatRoomId: number) {
        if (this.socket) {
            this.socket.emit('join_room', { chatRoomId });
        }
    }

    // 채팅방 퇴장
    leaveRoom(chatRoomId: number) {
        if (this.socket) {
            this.socket.emit('leave_room', { chatRoomId });
        }
    }

    // 메시지 전송 (고객 → 상담원)
    sendMessage(chatRoomId: number, content: string) {
        if (this.socket) {
            this.socket.emit('user_message', {
                chatRoomId,
                senderType: 'USER',
                content,
                messageType: 'TEXT'
            });
        }
    }

    // 메시지 수신 리스너 (상담원 응답 수신)
    onMessage(callback: (message: Message) => void) {
        if (this.socket) {
            this.socket.on('user_message', (message) => {
                callback(message);
            });
        }
    }

    // 에러 리스너
    onError(callback: (error: string) => void) {
        if (this.socket) {
            this.socket.on('error', callback);
        }
    }

    // Typing indicator 전송
    sendTyping(chatRoomId: number, userType: 'USER' | 'ADMIN' | 'BOT' | 'CLIENT' | 'USER_STOP' | 'CLIENT_STOP' = 'USER') {
        if (this.socket) {
            this.socket.emit('typing', { chatRoomId, userType });
        }
    }

    // Typing indicator 수신
    onTyping(callback: (data: { chatRoomId: number; userType: string }) => void) {
        if (this.socket) {
            this.socket.on('typing', (data) => {
                callback(data);
            });
        }
    }

    offTyping(callback: (data: { chatRoomId: number; userType: string }) => void) {
        if (this.socket) {
            this.socket.off('typing', callback);
        }
    }
}

export const socketService = new SocketService(); 