'use client';

import { useState, useEffect, useMemo } from 'react';
import { Message, ChatRoom } from '@/types';
import { api } from '@/services/api';
import { socketService } from '@/services/socket';

interface ChatSessionListProps {
    onSelectSession: (session: ChatRoom) => void;
    selectedSessionId?: number;
}

export default function ChatSessionList({ onSelectSession, selectedSessionId }: ChatSessionListProps) {
    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchKeyword, setSearchKeyword] = useState('');

    useEffect(() => {
        loadChatRooms();

        // 10초마다 채팅방 목록 새로고침 (fallback)
        const interval = setInterval(loadChatRooms, 10000);

        // 소켓 이벤트로 실시간 갱신
        const handleNewChatRoom = (newChatRoom: ChatRoom) => {
            setChatRooms(prev => [newChatRoom, ...prev]);
        };
        const handleUserMessage = (message: Message) => {
            // 메시지가 도착한 채팅방의 last_message, unread_count 등 갱신
            setChatRooms(prev => prev.map(room =>
                room.id === message.chat_room_id
                    ? {
                        ...room,
                        last_message: message.content,
                        // 현재 활성화된 채팅방이면 unread_count를 증가시키지 않음
                        unread_count: selectedSessionId === message.chat_room_id
                            ? room.unread_count || 0
                            : (room.unread_count || 0) + 1
                    }
                    : room
            ));
        };
        socketService.onNewChatRoom(handleNewChatRoom);
        socketService.onMessage(handleUserMessage);

        return () => {
            clearInterval(interval);
            socketService.offNewChatRoom(handleNewChatRoom);
            socketService.offMessage(handleUserMessage);
        };
    }, []);

    const filteredChatRooms = useMemo(
        () => Array.isArray(chatRooms) ? chatRooms.filter(room =>
            room.nickname?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            room.last_message?.toLowerCase().includes(searchKeyword.toLowerCase())
        ) : [],
        [chatRooms, searchKeyword]
    );

    const loadChatRooms = async () => {
        try {
            setLoading(true);
            const data = await api.getChatRooms();
            setChatRooms(data);
            setError(null);
        } catch (err) {
            setError('채팅방 목록을 불러오는데 실패했습니다.');
            console.error('채팅방 목록 로드 실패:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case '접수': return 'bg-yellow-100 text-yellow-800';
            case '응대': return 'bg-blue-100 text-blue-800';
            case '종료': return 'bg-gray-100 text-gray-800';
            case '보류': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading && chatRooms.length === 0) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-gray-500">로딩 중...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-red-500 text-center">
                    <div>{error}</div>
                    <button
                        onClick={loadChatRooms}
                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white">
            {/* 검색 영역 */}
            <div className="p-4 border-b border-gray-200">
                <input
                    type="text"
                    placeholder="고객명 또는 메시지로 검색..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* 채팅방 목록 */}
            <div className="flex-1 overflow-y-auto">
                {filteredChatRooms.map((room) => (
                    <div
                        key={room.id}
                        onClick={() => onSelectSession(room)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selectedSessionId === room.id ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(room.status || '접수')}`}>
                                    {room.status || '접수'}
                                </span>
                                <span className="font-medium text-gray-900">{room.nickname || '익명'}</span>
                            </div>
                            {(() => {
                                const unreadCount = room.unread_count || 0;
                                return unreadCount > 0 ? (
                                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                        {unreadCount}
                                    </span>
                                ) : null;
                            })()}
                        </div>
                        <div className="text-sm text-gray-600 truncate">{room.last_message || '메시지가 없습니다'}</div>
                    </div>
                ))}
            </div>

            {/* 새로고침 버튼 */}
            <div className="p-4 border-t border-gray-200">
                <button
                    onClick={loadChatRooms}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                    새로고침
                </button>
            </div>
        </div>
    );
} 