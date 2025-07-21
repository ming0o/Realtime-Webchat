export interface User {
    id: number;
    social_type: 'KAKAO' | 'GUEST';
    social_id?: string;
    nickname: string;
    token?: string;
    created_at: string;
}

export interface Message {
    id: number;
    chat_room_id: number;
    sender_type: 'USER' | 'ADMIN' | 'BOT';
    content: string;
    message_type: 'TEXT' | 'IMAGE' | 'QUICK_REPLY';
    read: boolean;
    created_at: string;
    quick_replies?: string[];
}

export interface ChatSession {
    id: number;
    user_id: number;
    status: 'active' | 'waiting' | 'closed';
    created_at: string;
}

export interface BotResponse {
    message: string;
    suggestions?: string[];
    type: 'text' | 'quick_reply';
}

export type ChatMode = 'bot' | 'agent' | 'connecting';

export interface QuickReply {
    text: string;
    action: 'bug_report' | 'phone_info' | 'connect_agent' | 'back_to_start';
} 