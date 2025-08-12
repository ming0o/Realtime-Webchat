'use client';

import { Message } from '@/types';

interface ChatMessageProps {
    message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
    const isAdmin = message.sender_type === 'ADMIN';
    const isBot = message.sender_type === 'BOT';

    const getSenderInfo = () => {
        if (isAdmin) return { name: '상담원', color: 'from-blue-500 to-indigo-600', bgColor: 'bg-gradient-to-r from-blue-50 to-indigo-50', textColor: 'text-blue-900' };
        if (isBot) return { name: '봇', color: 'from-purple-500 to-purple-600', bgColor: 'bg-gradient-to-r from-purple-50 to-purple-100', textColor: 'text-purple-900' };
        return { name: '고객', color: 'from-slate-500 to-slate-600', bgColor: 'bg-gradient-to-r from-slate-50 to-slate-100', textColor: 'text-slate-900' };
    };

    const senderInfo = getSenderInfo();

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    return (
        <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`max-w-xs lg:max-w-md ${isAdmin ? 'order-2' : 'order-1'}`}>
                {/* Sender Info */}
                <div className={`flex items-center space-x-2 mb-2 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${senderInfo.color} flex items-center justify-center shadow-md`}>
                        <span className="text-white text-xs font-bold">
                            {senderInfo.name.charAt(0)}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className={`text-xs font-semibold ${senderInfo.textColor}`}>
                            {senderInfo.name}
                        </span>
                        <span className="text-xs text-slate-500">
                            {formatTime(message.createdAt || message.created_at || '')}
                        </span>
                    </div>
                </div>

                {/* Message Bubble */}
                <div className={`relative ${isAdmin ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block px-4 py-3 rounded-2xl shadow-md transition-all duration-200 hover:shadow-lg max-w-xs lg:max-w-md ${isAdmin
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-md'
                        : `${senderInfo.bgColor} ${senderInfo.textColor} rounded-bl-md border border-slate-200`
                        }`}>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-hidden">
                            <div className="line-clamp-6">
                                {message.content}
                            </div>
                        </div>
                    </div>

                    {/* Message Status */}
                    {isAdmin && (
                        <div className="flex items-center justify-end mt-1 space-x-1">
                            <span className="text-xs text-slate-500">
                                {message.read ? '읽음' : '전송됨'}
                            </span>
                            {message.read && (
                                <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 