'use client';

import { useState, useEffect, useRef } from 'react';
import { Message } from '@/types';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { socketService } from '@/services/socket';

interface ChatAreaProps {
    selectedSessionId?: number;
    onSendMessage: (message: string) => void;
}

const mockMessages: Message[] = [
    {
        id: 1,
        chat_room_id: 1,
        sender_type: 'USER',
        content: '오늘 점심 메뉴를 알고 싶어요.',
        message_type: 'TEXT',
        read: true,
        created_at: '2024-01-15T10:30:00Z'
    },
    {
        id: 2,
        chat_room_id: 1,
        sender_type: 'ADMIN',
        content: '상담원이 연결되었습니다. 무엇을 도와드릴까요?',
        message_type: 'TEXT',
        read: true,
        created_at: '2024-01-15T10:31:00Z'
    },
    {
        id: 3,
        chat_room_id: 1,
        sender_type: 'ADMIN',
        content: '오늘 점심은 햄버거 어떠신가요?',
        message_type: 'TEXT',
        read: true,
        created_at: '2024-01-15T10:32:00Z'
    },
    {
        id: 4,
        chat_room_id: 1,
        sender_type: 'USER',
        content: '괜찮은 것 같아요.',
        message_type: 'TEXT',
        read: false,
        created_at: '2024-01-15T10:33:00Z'
    }
];

export default function ChatArea({ selectedSessionId, onSendMessage }: ChatAreaProps) {
    const [messages, setMessages] = useState<Message[]>(mockMessages);
    const [activeTab, setActiveTab] = useState<'current' | 'my'>('current');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // 소켓 연결
        socketService.connect();

        // 메시지 수신 리스너
        socketService.onMessage((newMessage: Message) => {
            setMessages(prev => [...prev, newMessage]);
        });

        return () => {
            socketService.disconnect();
        };
    }, []);

    useEffect(() => {
        // 새 메시지가 오면 스크롤을 맨 아래로
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (content: string) => {
        if (selectedSessionId) {
            // 소켓으로 메시지 전송
            socketService.sendMessage(selectedSessionId, content);

            // 로컬 상태에 즉시 추가
            const newMessage: Message = {
                id: Date.now(),
                chat_room_id: selectedSessionId,
                sender_type: 'ADMIN',
                content,
                message_type: 'TEXT',
                read: false,
                created_at: new Date().toISOString()
            };

            setMessages(prev => [...prev, newMessage]);
            onSendMessage(content);
        }
    };

    if (!selectedSessionId) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">채팅 상담</h3>
                    <p className="text-gray-500">왼쪽에서 상담 세션을 선택해주세요.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* 탭 헤더 */}
            <div className="border-b">
                <div className="flex">
                    <button
                        onClick={() => setActiveTab('current')}
                        className={`px-4 py-3 text-sm font-medium ${activeTab === 'current'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        현재 상담
                    </button>
                    <button
                        onClick={() => setActiveTab('my')}
                        className={`px-4 py-3 text-sm font-medium ${activeTab === 'my'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        내가 한 상담
                    </button>
                </div>
            </div>

            {/* 메시지 영역 */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <div className="space-y-4">
                    {messages.map((message) => (
                        <ChatMessage key={message.id} message={message} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* 입력 영역 */}
            <ChatInput onSendMessage={handleSendMessage} />
        </div>
    );
} 