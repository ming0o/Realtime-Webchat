export interface User {
    id: number;
    social_type: 'KAKAO' | 'GUEST';
    social_id?: string;
    nickname: string;
    token?: string;
    created_at: string;
}

export interface ChatRoom {
    id: number;
    user_id: number;
    created_at: string;
    nickname?: string;
    social_type?: string;
    status?: '접수' | '응대' | '종료' | '보류';
    last_message?: string;
    unread_count?: number;
}

export interface Message {
    _id?: string;
    id?: number;
    chat_room_id: number;
    sender_type: 'USER' | 'ADMIN' | 'BOT';
    content: string;
    message_type: 'TEXT' | 'IMAGE' | 'FILE';
    read: boolean;
    created_at?: string;
    createdAt?: string;
    updatedAt?: string;
    chatRoom?: ChatRoom;
}

export interface ChatSession {
    id: number;
    title: string;
    author: string;
    status: '접수' | '응대' | '종료' | '보류';
    lastMessage?: string;
    createdAt: string;
    unreadCount?: number;
    user?: User;
}

export interface SearchFilter {
    type: 'content' | 'author';
    keyword: string;
}

export interface MacroTemplate {
    id: number;
    macro_type: 'off-hours' | 'lunch-time' | 'holiday';
    name: string;
    description: string;
    content: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ChatRoomWithUser extends ChatRoom {
    user: User;
    messages: Message[];
    unread_count: number;
} 