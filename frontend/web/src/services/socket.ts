import { io, Socket } from 'socket.io-client';
import { Message, ChatRoom } from '@/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

class SocketService {
    private socket: Socket | null = null;

    connect() {
        if (!this.socket) {
            this.socket = io(SOCKET_URL);

            this.socket.on('connect', () => {
                console.log('Socket connected:', this.socket?.id);
            });

            this.socket.on('disconnect', () => {
                console.log('Socket disconnected');
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

    // 메시지 전송
    sendMessage(chatRoomId: number, content: string, senderType: 'USER' | 'ADMIN' | 'BOT' = 'ADMIN') {
        if (this.socket) {
            this.socket.emit('user_message', {
                chatRoomId,
                senderType,
                content,
                messageType: 'TEXT'
            });
        }
    }

    // 관리자 접속
    joinAdmin() {
        if (this.socket) {
            this.socket.emit('admin_join');
        }
    }

    // 관리자 퇴장
    leaveAdmin() {
        if (this.socket) {
            this.socket.emit('admin_leave');
        }
    }

    // 메시지 수신 리스너
    onMessage(callback: (message: Message) => void) {
        if (this.socket) {
            this.socket.on('user_message', callback);
        }
    }

    // 새 채팅방 생성 리스너
    onNewChatRoom(callback: (chatRoom: ChatRoom) => void) {
        if (this.socket) {
            this.socket.on('new_chat_room', callback);
        }
    }

    // 채팅방 상태 변경 리스너
    onChatRoomStatusChange(callback: (data: { roomId: number; status: string }) => void) {
        if (this.socket) {
            this.socket.on('chat_room_status_change', callback);
        }
    }

    // 에러 리스너
    onError(callback: (error: string) => void) {
        if (this.socket) {
            this.socket.on('error', callback);
        }
    }

    // 연결 상태 확인
    isConnected(): boolean {
        return this.socket?.connected || false;
    }
}

export const socketService = new SocketService(); 