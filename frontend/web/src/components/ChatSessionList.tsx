'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Message, ChatRoom } from '@/types';
import { api } from '@/services/api';
import { socketService } from '@/services/socket';
import { ChevronRight, Users, Clock, MessageCircle, CheckCircle, Pause, ChevronLeft } from 'lucide-react';

interface ChatSessionListProps {
    onSelectSession: (session: ChatRoom) => void;
    selectedSessionId?: number;
}

export default function ChatSessionList({ onSelectSession, selectedSessionId }: ChatSessionListProps) {
    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedRooms, setSelectedRooms] = useState<Set<number>>(new Set());
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [bulkStatus, setBulkStatus] = useState<string>('접수');
    const [isUpdating, setIsUpdating] = useState(false);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

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
        const handleChatRoomStatusChange = (data: { roomId: number; status: string }) => {
            setChatRooms(prev => prev.map(room =>
                room.id === data.roomId
                    ? { ...room, status: data.status as '접수' | '응대' | '종료' | '보류' }
                    : room
            ));
        };

        socketService.onNewChatRoom(handleNewChatRoom);
        socketService.onMessage(handleUserMessage);
        socketService.onChatRoomStatusChange(handleChatRoomStatusChange);

        return () => {
            clearInterval(interval);
            socketService.offNewChatRoom(handleNewChatRoom);
            socketService.offMessage(handleUserMessage);
            socketService.offChatRoomStatusChange(handleChatRoomStatusChange);
        };
    }, [selectedSessionId]);

    // 스크롤 위치 체크
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            checkScrollPosition();
            const handleScroll = () => checkScrollPosition();
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [chatRooms]);

    const filteredChatRooms = useMemo(
        () => Array.isArray(chatRooms) ? chatRooms.filter(room => {
            // 검색어 필터
            const matchesSearch = room.nickname?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                room.last_message?.toLowerCase().includes(searchKeyword.toLowerCase());

            // 상태 필터
            const matchesStatus = statusFilter === 'all' || room.status === statusFilter;

            return matchesSearch && matchesStatus;
        }) : [],
        [chatRooms, searchKeyword, statusFilter]
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
            case '접수': return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg';
            case '응대': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg';
            case '종료': return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg';
            case '보류': return 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg';
            default: return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case '접수': return <Clock className="w-4 h-4" />;
            case '응대': return <MessageCircle className="w-4 h-4" />;
            case '종료': return <CheckCircle className="w-4 h-4" />;
            case '보류': return <Pause className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const handleRoomSelect = (roomId: number, checked: boolean) => {
        const newSelected = new Set(selectedRooms);
        if (checked) {
            newSelected.add(roomId);
        } else {
            newSelected.delete(roomId);
        }
        setSelectedRooms(newSelected);
        setShowBulkActions(newSelected.size > 0);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allRoomIds = new Set(filteredChatRooms.map(room => room.id));
            setSelectedRooms(allRoomIds);
            setShowBulkActions(true);
        } else {
            setSelectedRooms(new Set());
            setShowBulkActions(false);
        }
    };

    const handleBulkStatusUpdate = async () => {
        if (selectedRooms.size === 0) return;

        setIsUpdating(true);
        try {
            const roomIds = Array.from(selectedRooms);
            const result = await api.updateBulkChatRoomStatus(roomIds, bulkStatus);

            // 로컬 상태 업데이트
            setChatRooms(prev => prev.map(room =>
                selectedRooms.has(room.id)
                    ? { ...room, status: bulkStatus as '접수' | '응대' | '종료' | '보류' }
                    : room
            ));

            // 선택 해제
            setSelectedRooms(new Set());
            setShowBulkActions(false);

            // 성공 메시지 표시
            alert(`${result.updatedCount}개의 채팅방 상태가 변경되었습니다.`);
        } catch (error) {
            console.error('일괄 상태 변경 실패:', error);
            alert('일괄 상태 변경에 실패했습니다.');
        } finally {
            setIsUpdating(false);
        }
    };

    const checkScrollPosition = () => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            setCanScrollLeft(container.scrollLeft > 0);
            setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 1);
        }
    };

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const scrollAmount = Math.min(200, container.scrollLeft);
            if (scrollAmount > 0) {
                container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            }
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const scrollAmount = Math.min(200, container.scrollWidth - container.scrollLeft - container.clientWidth);
            if (scrollAmount > 0) {
                container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    if (loading && chatRooms.length === 0) {
        return (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                    <div className="text-slate-600 font-medium">채팅방 목록을 불러오는 중...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
                <div className="text-center max-w-sm mx-auto p-6">
                    <div className="text-red-500 text-4xl mb-4">⚠️</div>
                    <div className="text-red-700 font-medium mb-4">{error}</div>
                    <button
                        onClick={loadChatRooms}
                        className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
            {/* 검색 영역 */}
            <div className="p-6 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="고객명 또는 메시지로 검색..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200"
                    />
                </div>
            </div>

            {/* 상태별 뱃지 필터 */}
            <div className="px-4 py-2 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
                <div className="flex items-center justify-between h-12">
                    <div className="relative w-full h-10">
                        {canScrollLeft && (
                            <button
                                onClick={scrollLeft}
                                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border border-slate-200"
                            >
                                <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
                            </button>
                        )}
                        <div
                            ref={scrollContainerRef}
                            className="flex space-x-2 overflow-x-auto scrollbar-hide w-72 h-10"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl border-2 transition-all duration-200 transform hover:scale-105 whitespace-nowrap h-10 ${statusFilter === 'all'
                                    ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white border-slate-700 shadow-lg'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:shadow-md'
                                    }`}
                            >
                                <Users className="w-4 h-4" />
                                <span>전체 ({chatRooms.length})</span>
                            </button>
                            <button
                                onClick={() => setStatusFilter('접수')}
                                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl border-2 transition-all duration-200 transform hover:scale-105 whitespace-nowrap h-10 ${statusFilter === '접수'
                                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-yellow-500 shadow-lg'
                                    : 'bg-white text-yellow-700 border-yellow-200 hover:border-yellow-300 hover:shadow-md'
                                    }`}
                            >
                                <Clock className="w-4 h-4" />
                                <span>접수 ({chatRooms.filter(room => room.status === '접수').length})</span>
                            </button>
                            <button
                                onClick={() => setStatusFilter('응대')}
                                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl border-2 transition-all duration-200 transform hover:scale-105 whitespace-nowrap h-10 ${statusFilter === '응대'
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-lg'
                                    : 'bg-white text-blue-700 border-blue-200 hover:border-blue-300 hover:shadow-md'
                                    }`}
                            >
                                <MessageCircle className="w-4 h-4" />
                                <span>응대 ({chatRooms.filter(room => room.status === '응대').length})</span>
                            </button>
                            <button
                                onClick={() => setStatusFilter('종료')}
                                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl border-2 transition-all duration-200 transform hover:scale-105 whitespace-nowrap h-10 ${statusFilter === '종료'
                                    ? 'bg-gradient-to-r from-slate-500 to-slate-600 text-white border-slate-500 shadow-lg'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:shadow-md'
                                    }`}
                            >
                                <CheckCircle className="w-4 h-4" />
                                <span>종료 ({chatRooms.filter(room => room.status === '종료').length})</span>
                            </button>
                            <button
                                onClick={() => setStatusFilter('보류')}
                                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl border-2 transition-all duration-200 transform hover:scale-105 whitespace-nowrap h-10 ${statusFilter === '보류'
                                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-500 shadow-lg'
                                    : 'bg-white text-orange-700 border-orange-200 hover:border-orange-300 hover:shadow-md'
                                    }`}
                            >
                                <Pause className="w-4 h-4" />
                                <span>보류 ({chatRooms.filter(room => room.status === '보류').length})</span>
                            </button>
                        </div>
                        {canScrollRight && (
                            <button
                                onClick={scrollRight}
                                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border border-slate-200"
                            >
                                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {showBulkActions && (
                <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-slate-700">
                            {selectedRooms.size}개 선택됨
                        </span>
                        <button
                            onClick={() => {
                                setSelectedRooms(new Set());
                                setShowBulkActions(false);
                            }}
                            className="text-sm text-slate-500 hover:text-slate-700 transition-colors duration-200"
                        >
                            선택 해제
                        </button>
                    </div>
                    <div className="flex items-center space-x-3">
                        <select
                            value={bulkStatus}
                            onChange={(e) => setBulkStatus(e.target.value)}
                            className="px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                        >
                            <option value="접수">접수</option>
                            <option value="응대">응대</option>
                            <option value="종료">종료</option>
                            <option value="보류">보류</option>
                        </select>
                        <button
                            onClick={handleBulkStatusUpdate}
                            disabled={isUpdating}
                            className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                        >
                            {isUpdating ? '변경 중...' : '일괄 변경'}
                        </button>
                    </div>
                </div>
            )
            }

            {/* 채팅방 목록 헤더 */}
            <div className="px-6 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-100 to-slate-200">
                <div className="flex items-center space-x-3">
                    <input
                        type="checkbox"
                        checked={selectedRooms.size === filteredChatRooms.length && filteredChatRooms.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-sm font-semibold text-slate-700">전체 선택</span>
                </div>
            </div>

            {/* 채팅방 목록 */}
            <div className="flex-1 overflow-y-auto">
                {filteredChatRooms.map((room) => (
                    <div
                        key={room.id}
                        className={`p-4 border-b border-slate-100 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 transition-all duration-200 ${selectedSessionId === room.id
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm'
                            : ''
                            }`}
                    >
                        <div className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                checked={selectedRooms.has(room.id)}
                                onChange={(e) => handleRoomSelect(room.id, e.target.checked)}
                                onClick={(e) => e.stopPropagation()}
                                className="rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                            />
                            <div
                                className="flex-1 cursor-pointer"
                                onClick={() => onSelectSession(room)}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(room.status || '접수')}`}>
                                            <div className="flex items-center space-x-1">
                                                {getStatusIcon(room.status || '접수')}
                                                <span>{room.status || '접수'}</span>
                                            </div>
                                        </span>
                                        <span className="font-semibold text-slate-900">{room.nickname || '익명'}</span>
                                    </div>
                                    {(() => {
                                        const unreadCount = room.unread_count || 0;
                                        return unreadCount > 0 ? (
                                            <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full px-2 py-1 min-w-[24px] text-center shadow-lg">
                                                {unreadCount}
                                            </span>
                                        ) : null;
                                    })()}
                                </div>
                                <div className="text-sm text-slate-600 truncate">{room.last_message || '메시지가 없습니다'}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 새로고침 버튼 */}
            <div className="p-6 border-t border-slate-200 bg-white/80 backdrop-blur-sm">
                <button
                    onClick={loadChatRooms}
                    className="w-full px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-xl hover:from-slate-200 hover:to-slate-300 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md font-medium"
                >
                    새로고침
                </button>
            </div>
        </div>
    );
} 