import { io, Socket } from 'socket.io-client';
import { Message, ChatRoom } from '@/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

class SocketService {
    private socket: Socket | null = null;

    connect() {
        if (!this.socket || !this.socket.connected) {
            if (this.socket) {
                this.socket.disconnect();
            }
            this.socket = io(SOCKET_URL, {
                autoConnect: true,
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5,
                timeout: 5000,
                forceNew: true
            });
            this.socket.on('connect', () => {
                console.log('Socket connected:', this.socket?.id);
            });
            this.socket.on('disconnect', (reason) => {
                console.log('Socket disconnected:', reason);
            });
            this.socket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
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

    joinRoom(chatRoomId: number) {
        if (this.socket) {
            this.socket.emit('join_room', { chatRoomId });
        }
    }

    leaveRoom(chatRoomId: number) {
        if (this.socket) {
            this.socket.emit('leave_room', { chatRoomId });
        }
    }

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

    joinAdmin() {
        if (this.socket) {
            this.socket.emit('admin_join');
        }
    }

    leaveAdmin() {
        if (this.socket) {
            this.socket.emit('admin_leave');
        }
    }

    onMessage(callback: (message: Message) => void) {
        if (this.socket) {
            this.socket.on('user_message', (message) => {
                callback(message);
            });
        }
    }

    offMessage(callback: (message: Message) => void) {
        if (this.socket) {
            this.socket.off('user_message', callback);
        }
    }

    onNewChatRoom(callback: (chatRoom: ChatRoom) => void) {
        if (this.socket) {
            this.socket.on('new_chat_room', callback);
        }
    }

    offNewChatRoom(callback: (chatRoom: ChatRoom) => void) {
        if (this.socket) {
            this.socket.off('new_chat_room', callback);
        }
    }

    onChatRoomStatusChange(callback: (data: { roomId: number; status: string }) => void) {
        if (this.socket) {
            this.socket.on('chat_room_status_change', callback);
        }
    }

    offChatRoomStatusChange(callback: (data: { roomId: number; status: string }) => void) {
        if (this.socket) {
            this.socket.off('chat_room_status_change', callback);
        }
    }

    onError(callback: (error: string) => void) {
        if (this.socket) {
            this.socket.on('error', callback);
        }
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    // Typing indicator 관련 메서드들
    sendTyping(chatRoomId: number, userType: 'USER' | 'ADMIN' | 'BOT' | 'CLIENT' | 'USER_STOP' | 'CLIENT_STOP' = 'ADMIN') {
        if (this.socket) {
            this.socket.emit('typing', { chatRoomId, userType });
        }
    }

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
