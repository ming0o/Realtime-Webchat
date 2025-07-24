'use client';

import { useState, useEffect, useRef } from 'react';
import { Message, ChatRoom, MacroTemplate } from '@/types';
import { api } from '@/services/api';
import { socketService } from '@/services/socket';
import ChatMessage from './ChatMessage';
import MacroButton from './MacroButton';

interface ChatAreaProps {
    selectedSessionId?: number;
}

export default function ChatArea({ selectedSessionId }: ChatAreaProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
    const [macros, setMacros] = useState<MacroTemplate[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // 소켓 연결
        socketService.connect();
        setIsConnected(socketService.isConnected());

        // 소켓 이벤트 리스너
        socketService.onMessage((message: Message) => {
            setMessages(prev => Array.isArray(prev) ? [...prev, message] : [message]);
        });

        socketService.onError((error: string) => {
            console.error('Socket error:', error);
        });

        return () => {
            socketService.disconnect();
        };
    }, []);

    useEffect(() => {
        if (selectedSessionId) {
            loadChatRoom();
            loadMessages();
            loadMacros();

            // 이전 채팅방에서 나가기
            socketService.leaveRoom(selectedSessionId);
            // 새 채팅방 입장
            socketService.joinRoom(selectedSessionId);
        } else {
            setMessages([]);
            setChatRoom(null);
        }
    }, [selectedSessionId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadChatRoom = async () => {
        if (!selectedSessionId) return;

        try {
            const data = await api.getChatRoom(selectedSessionId);
            setChatRoom(data);
        } catch (error) {
            console.error('채팅방 정보 로드 실패:', error);
        }
    };

    const loadMessages = async () => {
        if (!selectedSessionId) return;

        try {
            setLoading(true);
            const data = await api.getMessages(selectedSessionId);
            setMessages(Array.isArray(data) ? data : []);

            // 메시지 읽음 처리
            await api.markMessagesAsRead(selectedSessionId);
        } catch (error) {
            setMessages([]); // 에러 시에도 빈 배열로
            console.error('메시지 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMacros = async () => {
        try {
            const data = await api.getMacroTemplates();
            setMacros(data);
        } catch (error) {
            console.error('매크로 템플릿 로드 실패:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || !selectedSessionId) return;

        try {
            const message = inputMessage.trim();
            setInputMessage('');

            // 소켓으로 메시지 전송
            socketService.sendMessage(selectedSessionId, message, 'ADMIN');

            // 로컬 메시지 추가 (즉시 표시)
            const newMessage: Message = {
                chat_room_id: selectedSessionId,
                sender_type: 'ADMIN',
                content: message,
                message_type: 'TEXT',
                read: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            setMessages(prev => [...prev, newMessage]);
        } catch (error) {
            console.error('메시지 전송 실패:', error);
        }
    };

    const handleUseMacro = async (macroType: string) => {
        if (!selectedSessionId) return;

        try {
            await api.useMacro(selectedSessionId, macroType);
            // 매크로 사용 후 메시지 목록 새로고침
            loadMessages();
        } catch (error) {
            console.error('매크로 사용 실패:', error);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!selectedSessionId || !chatRoom) return;

        try {
            await api.updateChatRoomStatus(selectedSessionId, newStatus);
            setChatRoom(prev => prev ? { ...prev, status: newStatus as '접수' | '응대' | '종료' | '보류' } : null);
        } catch (error) {
            console.error('상태 변경 실패:', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!selectedSessionId) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-500">
                    <div className="text-2xl mb-2">💬</div>
                    <p>채팅방을 선택해주세요</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-white">
            {/* 채팅방 헤더 */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div>
                            <h3 className="font-semibold text-gray-900">
                                {chatRoom?.nickname || '익명'}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {chatRoom?.social_type === 'GUEST' ? '게스트' : '카카오'} •
                                {new Date(chatRoom?.created_at || '').toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={chatRoom?.status || '접수'}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="접수">접수</option>
                            <option value="응대">응대</option>
                            <option value="종료">종료</option>
                            <option value="보류">보류</option>
                        </select>

                        <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-xs text-gray-500">
                                {isConnected ? '연결됨' : '연결 끊김'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 매크로 버튼 */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
                <div className="flex gap-2">
                    {macros.map((macro) => (
                        <MacroButton
                            key={macro.id}
                            macro={macro}
                            onUseMacro={handleUseMacro}
                            disabled={!selectedSessionId}
                        />
                    ))}
                </div>
            </div>

            {/* 메시지 영역 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-gray-500">메시지를 불러오는 중...</div>
                    </div>
                ) : !Array.isArray(messages) || messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">
                            <div className="text-2xl mb-2">💬</div>
                            <p>아직 메시지가 없습니다</p>
                        </div>
                    </div>
                ) : (
                    messages.map((message, index) => (
                        <ChatMessage
                            key={message._id || message.id || index}
                            message={message}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* 입력 영역 */}
            <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                    <textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="메시지를 입력하세요..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim()}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed self-end"
                    >
                        전송
                    </button>
                </div>
            </div>
        </div>
    );
} 