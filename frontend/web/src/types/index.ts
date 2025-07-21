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
}

export interface Message {
    id: number;
    chat_room_id: number;
    sender_type: 'USER' | 'ADMIN';
    content: string;
    message_type: 'TEXT' | 'IMAGE';
    read: boolean;
    created_at: string;
    chatRoom?: ChatRoom;
}

export interface ChatSession {
    id: number;
    title: string;
    author: string;
    status: '접수' | '응대' | '종료' | '보류';
    lastMessage?: string;
    createdAt: string;
}

export interface SearchFilter {
    type: 'content' | 'author';
    keyword: string;
} 