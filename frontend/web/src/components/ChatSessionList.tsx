'use client';

import { useState, useEffect } from 'react';
import { ChatRoom } from '@/types';
import { api } from '@/services/api';

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

        // 30초마다 채팅방 목록 새로고침
        const interval = setInterval(loadChatRooms, 30000);
        return () => clearInterval(interval);
    }, []);

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

    const filteredChatRooms = chatRooms.filter(room =>
        room.nickname?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        room.last_message?.toLowerCase().includes(searchKeyword.toLowerCase())
    );

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
        <div className="h-full flex flex-col">
            {/* 헤더 */}
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">채팅 목록</h2>

                {/* 검색 */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="고객명 또는 메시지로 검색..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* 채팅방 목록 */}
            <div className="flex-1 overflow-y-auto">
                {filteredChatRooms.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                        {searchKeyword ? '검색 결과가 없습니다.' : '채팅방이 없습니다.'}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {filteredChatRooms.map((room) => (
                            <div
                                key={room.id}
                                onClick={() => onSelectSession(room)}
                                className={`
                                    p-4 cursor-pointer transition-colors hover:bg-gray-50
                                    ${selectedSessionId === room.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''}
                                `}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-gray-900 truncate">
                                                {room.nickname || '익명'}
                                            </span>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(room.status || '접수')}`}>
                                                {room.status || '접수'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 truncate">
                                            {room.last_message || '메시지가 없습니다.'}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {room.unread_count && room.unread_count > 0 && (
                                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                                                {room.unread_count}
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-400">
                                            {new Date(room.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 새로고침 버튼 */}
            <div className="p-4 border-t border-gray-200">
                <button
                    onClick={loadChatRooms}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? '새로고침 중...' : '새로고침'}
                </button>
            </div>
        </div>
    );
} 