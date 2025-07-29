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

    useEffect(() => {
        if (selectedSessionId) {
            const setupListeners = () => {
                if (socketService.isConnected()) {
                    socketService.joinRoom(selectedSessionId);
                    socketService.joinAdmin();

                    const handleMessage = (newMessage: Message) => {
                        if (newMessage.chat_room_id === selectedSessionId) {
                            setMessages(prev => {
                                const isDuplicate = prev.some(msg =>
                                    msg._id === newMessage._id ||
                                    msg.id === newMessage.id ||
                                    (msg.content === newMessage.content &&
                                        msg.sender_type === newMessage.sender_type &&
                                        Math.abs(new Date(msg.createdAt || '').getTime() - new Date(newMessage.createdAt || '').getTime()) < 1000)
                                );

                                if (isDuplicate) {
                                    return prev;
                                }

                                return [...prev, newMessage];
                            });
                        }
                    };

                    const handleTyping = (data: { chatRoomId: number; userType: string }) => {
                        if (data.chatRoomId === selectedSessionId) {
                            if (data.userType === 'USER' || data.userType === 'CLIENT') {
                                setIsTyping(true);
                                setTimeout(() => {
                                    setIsTyping(false);
                                }, 3000);
                            } else if (data.userType === 'USER_STOP' || data.userType === 'CLIENT_STOP') {
                                setIsTyping(false);
                            }
                        }
                    };

                    socketService.onMessage(handleMessage);
                    socketService.onTyping(handleTyping);

                    const loadData = async () => {
                        setLoading(true);
                        try {
                            const [roomData, messagesData, macrosData] = await Promise.all([
                                api.getChatRoom(selectedSessionId),
                                api.getMessages(selectedSessionId),
                                api.getMacroTemplates()
                            ]);
                            setChatRoom(roomData);

                            const uniqueMessages = Array.isArray(messagesData) ?
                                messagesData.filter((msg, index, arr) =>
                                    arr.findIndex(m => m._id === msg._id) === index
                                ) : [];

                            setMessages(uniqueMessages);
                            setMacros(macrosData);
                            await api.markMessagesAsRead(selectedSessionId);
                        } catch (error) {
                            console.error('채팅 데이터 로드 실패:', error);
                            setChatRoom(null);
                            setMessages([]);
                            setMacros([]);
                        } finally {
                            setLoading(false);
                        }
                    };
                    loadData();

                    return () => {
                        socketService.offMessage(handleMessage);
                        socketService.offTyping(handleTyping);
                        socketService.leaveRoom(selectedSessionId);
                        socketService.leaveAdmin();
                    };
                } else {
                    setTimeout(setupListeners, 1000);
                }
            };

            setupListeners();
        } else {
            setChatRoom(null);
            setMessages([]);
        }
    }, [selectedSessionId]);

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

    const handleUseMacro = async (macroType: string) => {
        const macro = macros.find(m => m.macro_type === macroType);
        if (macro) {
            handleSendMessage(macro.content, 'MACRO');
            try {
                await api.useMacro(selectedSessionId!, macro.macro_type);
            } catch (error) {
                console.error('매크로 사용 실패:', error);
            }
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!selectedSessionId || !chatRoom) return;

        const originalStatus = chatRoom.status;
        setChatRoom(prev => prev ? { ...prev, status: newStatus as '접수' | '응대' | '종료' | '보류' } : null);

        try {
            await api.updateChatRoomStatus(selectedSessionId, newStatus);
        } catch (error) {
            console.error('상태 변경 실패:', error);
            setChatRoom(prev => prev ? { ...prev, status: originalStatus } : null);
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
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-gray-400 text-lg mb-2">채팅방을 선택해주세요</div>
                    <div className="text-gray-300 text-sm">왼쪽 목록에서 채팅방을 선택하면 대화를 시작할 수 있습니다.</div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <div className="text-gray-500">채팅 데이터를 불러오는 중...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            {chatRoom?.nickname || '사용자'}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {chatRoom?.status === '응대' ? '활성' :
                                chatRoom?.status === '접수' ? '대기중' :
                                    chatRoom?.status === '종료' ? '종료' : '보류'}
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <select
                            value={chatRoom?.status || '접수'}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="접수">대기중</option>
                            <option value="응대">활성</option>
                            <option value="종료">종료</option>
                            <option value="보류">보류</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Macro Buttons */}
            {Array.isArray(macros) && macros.length > 0 && (
                <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200 px-4 py-2">
                    <div className="flex flex-wrap gap-2">
                        {macros.map((macro) => (
                            <MacroButton
                                key={macro.id}
                                macro={macro}
                                onUseMacro={handleUseMacro}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Messages */}
            <main className="flex-1 overflow-y-auto px-4 py-2">
                {Array.isArray(messages) && messages.map((message, index) => (
                    <ChatMessage
                        key={message._id || message.id || `msg-${index}-${message.createdAt || Date.now()}-${Math.random().toString(36).substr(2, 5)}`}
                        message={message}
                    />
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex items-center space-x-2 p-3">
                        <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-500">상대방이 입력중...</span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </main>

            {/* Input Area */}
            <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-3">
                <div className="flex space-x-2">
                    <textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="메시지를 입력하세요..."
                        className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={1}
                        maxLength={500}
                    />
                    <button
                        onClick={() => handleSendMessage(inputMessage)}
                        disabled={!inputMessage.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        전송
                    </button>
                </div>
            </div>
        </div>
    );
} 
