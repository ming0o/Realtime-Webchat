'use client';

import { Message } from '@/types';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
    message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.sender_type === 'USER';

    return (
        <div className={`flex ${isUser ? 'justify-start' : 'justify-end'} mb-4`}>
            <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${isUser ? 'flex-row' : 'flex-row-reverse'}`}>
                {/* 아바타 */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-gray-300' : 'bg-blue-500'
                    }`}>
                    {isUser ? (
                        <User className="w-4 h-4 text-gray-600" />
                    ) : (
                        <Bot className="w-4 h-4 text-white" />
                    )}
                </div>

                {/* 메시지 내용 */}
                <div className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}>
                    <div className={`px-4 py-2 rounded-lg ${isUser
                            ? 'bg-gray-100 text-gray-900'
                            : 'bg-blue-500 text-white'
                        }`}>
                        <p className="text-sm">{message.content}</p>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">
                        {new Date(message.created_at).toLocaleTimeString()}
                    </span>
                </div>
            </div>
        </div>
    );
} 