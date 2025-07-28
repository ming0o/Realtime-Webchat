import { io, Socket } from 'socket.io-client';
import { Message } from '../types';

const SOCKET_URL = 'http://localhost:8080';

class SocketService {
    private socket: Socket | null = null;

    connect() {
        if (!this.socket) {
            this.socket = io(SOCKET_URL);

            this.socket.on('connect', () => {
                console.log('Mobile Socket connected:', this.socket?.id);
            });

            this.socket.on('disconnect', () => {
                console.log('Mobile Socket disconnected');
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
            console.log('🔥 모바일 소켓: 메시지 전송 시도', { chatRoomId, content });
            this.socket.emit('user_message', {
                chatRoomId,
                senderType: 'USER',
                content,
                messageType: 'TEXT'
            });
            console.log('🔥 모바일 소켓: 메시지 전송 완료');
        }
    }

    // 메시지 수신 리스너 (상담원 응답 수신)
    onMessage(callback: (message: Message) => void) {
        if (this.socket) {
            console.log('🔥 모바일 소켓: 메시지 리스너 등록');
            this.socket.on('user_message', (message) => {
                console.log('🔥 모바일 소켓: 메시지 이벤트 수신', message);
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
            console.log('🔥 모바일 소켓: 타이핑 이벤트 전송 시도', { chatRoomId, userType });
            this.socket.emit('typing', { chatRoomId, userType });
            console.log('🔥 모바일 소켓: 타이핑 이벤트 전송 완료');
        }
    }

    // Typing indicator 수신
    onTyping(callback: (data: { chatRoomId: number; userType: string }) => void) {
        if (this.socket) {
            console.log('🔥 모바일 소켓: 타이핑 리스너 등록');
            this.socket.on('typing', (data) => {
                console.log('🔥 모바일 소켓: 타이핑 이벤트 수신', data);
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