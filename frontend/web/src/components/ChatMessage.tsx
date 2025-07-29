'use client';

import { Message } from '@/types';

interface ChatMessageProps {
    message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
    const isOwnMessage = message.sender_type === 'ADMIN';
    const isBotMessage = message.sender_type === 'BOT';

    const getMessageTime = () => {
        const date = message.createdAt || message.created_at;
        if (!date) return '';
        return new Date(date).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getSenderName = () => {
        switch (message.sender_type) {
            case 'USER': return '고객';
            case 'ADMIN': return '상담원';
            case 'BOT': return '시스템';
            default: return '알 수 없음';
        }
    };

    const getMessageStyle = () => {
        if (isBotMessage) {
            return 'bg-gray-100 text-gray-700 border border-gray-200';
        }
        return isOwnMessage
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-900';
    };

    return (
        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${getMessageStyle()}`}>
                {isBotMessage && (
                    <div className="text-xs text-gray-500 mb-1 font-medium">
                        {getSenderName()}
                    </div>
                )}
                <div className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                </div>
                <div className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                    {getMessageTime()}
                </div>
            </div>
        </div>
    );
} 