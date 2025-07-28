import { useState, useEffect, useRef, useCallback } from 'react';
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
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const selectedSessionIdRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        selectedSessionIdRef.current = selectedSessionId;
    }, [selectedSessionId]);



    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const loadChatData = useCallback(async (sessionId: number) => {
        setLoading(true);
        try {
            const [roomData, messagesData, macrosData] = await Promise.all([
                api.getChatRoom(sessionId),
                api.getMessages(sessionId),
                api.getMacroTemplates()
            ]);
            setChatRoom(roomData);
            setMessages(Array.isArray(messagesData) ? messagesData : []);
            setMacros(macrosData);
            await api.markMessagesAsRead(sessionId);
        } catch (error) {
            console.error('채팅 데이터 로드 실패:', error);
            setChatRoom(null);
            setMessages([]);
            setMacros([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedSessionId) {
            console.log('🔥 채팅방 변경으로 소켓 리스너 재등록:', selectedSessionId);

            socketService.joinRoom(selectedSessionId);

            // 채팅방별로 새로운 메시지 리스너 등록
            const handleMessage = (newMessage: Message) => {
                console.log('🔥 ChatArea 메시지 수신:', newMessage);
                console.log('🔥 현재 채팅방:', selectedSessionId);
                console.log('🔥 메시지 채팅방:', newMessage.chat_room_id);

                if (newMessage.chat_room_id === selectedSessionId) {
                    console.log('🔥 메시지 추가!');
                    setMessages(prev => [...prev, newMessage]);
                } else {
                    console.log('🔥 다른 채팅방 메시지 무시');
                }
            };

            const handleTyping = (data: { chatRoomId: number; userType: string }) => {
                console.log('🔥 타이핑 이벤트 수신:', data);
                if (data.chatRoomId === selectedSessionId && data.userType === 'USER') {
                    console.log('🔥 타이핑 인디케이터 활성화');
                    setIsTyping(true);
                    setTimeout(() => setIsTyping(false), 3000);
                }
            };

            socketService.onMessage(handleMessage);
            socketService.onTyping(handleTyping);

            loadChatData(selectedSessionId);

            return () => {
                console.log('🔥 소켓 리스너 해제:', selectedSessionId);
                socketService.offMessage(handleMessage);
                socketService.offTyping(handleTyping);
                socketService.leaveRoom(selectedSessionId);
            };
        } else {
            setChatRoom(null);
            setMessages([]);
        }
    }, [selectedSessionId, loadChatData]);


    const handleSendMessage = (content: string, type: 'TEXT' | 'MACRO' = 'TEXT') => {
        if (!content.trim() || !selectedSessionId) return;

        const senderType = type === 'MACRO' ? 'BOT' : 'ADMIN';

        socketService.sendMessage(selectedSessionId, content, senderType);

        if (senderType === 'ADMIN') {
            const newMessage: Message = {
                chat_room_id: selectedSessionId,
                sender_type: 'ADMIN',
                content: content,
                message_type: 'TEXT',
                read: true,
                createdAt: new Date().toISOString(),
            };
            setMessages(prev => [...prev, newMessage]);
            setInputMessage('');
        }
    };

    const handleUseMacro = async (macro: MacroTemplate) => {
        if (!selectedSessionId) return;
        handleSendMessage(macro.content, 'MACRO');
        try {
            await api.useMacro(selectedSessionId, macro.macro_type);
        } catch (error) {
            console.error('매크로 사용 실패:', error);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!selectedSessionId || !chatRoom) return;
        try {
            const updatedChatRoom = await api.updateChatRoomStatus(selectedSessionId, newStatus);
            setChatRoom(updatedChatRoom);
        } catch (error) {
            console.error('상태 변경 실패:', error);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(inputMessage);
        }
    };

    if (!selectedSessionId) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50 h-full">
                <div className="text-center text-gray-500">
                    <div className="text-2xl mb-2">💬</div>
                    <p>채팅방을 선택해주세요</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* 채팅방 헤더 */}
            <header className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900">{chatRoom?.nickname || '익명'}</h3>
                        <p className="text-sm text-gray-500">
                            {chatRoom?.social_type === 'GUEST' ? '게스트' : '카카오'} • {chatRoom?.created_at ? new Date(chatRoom.created_at).toLocaleString() : ''}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={chatRoom?.status || '접수'}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-md"
                        >
                            <option value="접수">접수</option>
                            <option value="응대">응대</option>
                            <option value="종료">종료</option>
                            <option value="보류">보류</option>
                        </select>
                        <div className={`w-2 h-2 rounded-full ${socketService.isConnected() ? 'bg-green-500' : 'bg-red-500'}`} />
                    </div>
                </div>
            </header>

            {/* 매크로 버튼 */}
            <div className="flex-shrink-0 p-3 border-b border-gray-200 bg-gray-50">
                <div className="flex gap-2">
                    {Array.isArray(macros) && macros.map(macro => (
                        <MacroButton
                            key={macro.id}
                            macro={macro}
                            onUseMacro={() => handleUseMacro(macro)}
                            disabled={!selectedSessionId}
                        />
                    ))}
                </div>
            </div>

            {/* 메시지 영역 */}
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-gray-500">로딩 중...</div>
                ) : (
                    Array.isArray(messages) && messages.map((message, index) => (
                        <ChatMessage
                            key={`msg-${message._id || message.id || index}`}
                            message={message}
                        />
                    ))
                )}
                {isTyping && (
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                        </div>
                        <span>상대방이 입력중...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>

            {/* 입력 영역 */}
            <footer className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
                <div className="flex gap-2">
                    <textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="메시지를 입력하세요..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none"
                        rows={3}
                    />
                    <button
                        onClick={() => handleSendMessage(inputMessage)}
                        disabled={!inputMessage.trim()}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
                    >
                        전송
                    </button>
                </div>
            </footer>
        </div>
    );
} 
