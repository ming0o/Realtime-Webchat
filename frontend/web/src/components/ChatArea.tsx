import { useState, useEffect, useRef } from 'react';
import { Message, ChatRoom, MacroTemplate } from '@/types';
import { api } from '@/services/api';
import { socketService } from '@/services/socket';
import ChatMessage from './ChatMessage';
import { Plus, X } from 'lucide-react';

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
    const [showMacros, setShowMacros] = useState(false);
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

    const toggleMacros = () => {
        console.log('매크로 토글 클릭됨');
        console.log('현재 showMacros:', showMacros);
        console.log('매크로 데이터:', macros);
        setShowMacros(!showMacros);
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case '접수': return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white';
            case '응대': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
            case '종료': return 'bg-gradient-to-r from-slate-400 to-slate-500 text-white';
            case '보류': return 'bg-gradient-to-r from-orange-400 to-orange-500 text-white';
            default: return 'bg-gradient-to-r from-slate-400 to-slate-500 text-white';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case '접수': return '대기중';
            case '응대': return '활성';
            case '종료': return '종료';
            case '보류': return '보류';
            default: return '대기중';
        }
    };

    if (!selectedSessionId) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">채팅방을 선택해주세요</h3>
                    <p className="text-slate-600">왼쪽 목록에서 채팅방을 선택하면 대화를 시작할 수 있습니다.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                    <div className="text-slate-600 font-medium">채팅 데이터를 불러오는 중...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-slate-50">
            {/* Header */}
            <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 py-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">
                                {chatRoom?.nickname?.charAt(0) || 'U'}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                {chatRoom?.nickname || '사용자'}
                            </h2>
                            <div className="flex items-center space-x-2 mt-1">
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(chatRoom?.status || '접수')} shadow-md`}>
                                    {getStatusText(chatRoom?.status || '접수')}
                                </span>
                                <span className="text-sm text-slate-500">
                                    {chatRoom?.social_type === 'KAKAO' ? '카카오톡' : '게스트'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <select
                            value={chatRoom?.status || '접수'}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm hover:shadow-md transition-all duration-200"
                        >
                            <option value="접수">대기중</option>
                            <option value="응대">활성</option>
                            <option value="종료">종료</option>
                            <option value="보류">보류</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <main className="flex-1 overflow-y-auto px-6 py-4 bg-gradient-to-b from-white to-slate-50">
                <div className="max-w-4xl mx-auto space-y-4">
                    {Array.isArray(messages) && messages.map((message, index) => (
                        <ChatMessage
                            key={message._id || message.id || `msg-${index}-${message.createdAt || Date.now()}-${Math.random().toString(36).substr(2, 5)}`}
                            message={message}
                        />
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                        <div className="flex items-center space-x-3 p-4 bg-white rounded-2xl shadow-sm border border-slate-200 max-w-xs">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-sm text-slate-600 font-medium">상대방이 입력중...</span>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </main>

            {/* Input Area */}
            <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-t border-slate-200 px-6 py-4 shadow-lg">
                <div className="max-w-4xl mx-auto">
                    <div className="flex space-x-3">
                        <div className="relative">
                            <button
                                onClick={toggleMacros}
                                className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center flex-shrink-0"
                                title={showMacros ? '매크로 숨기기' : '매크로 보기'}
                            >
                                {showMacros ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                            </button>

                            {/* Macro Dropdown */}
                            {showMacros && (
                                <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-xl border border-slate-200 p-4 min-w-80 max-h-96 overflow-y-auto z-50">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-semibold text-slate-800">상담원 매크로</h3>
                                        <button
                                            onClick={toggleMacros}
                                            className="text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {Array.isArray(macros) && macros.length > 0 ? (
                                        <div className="space-y-4">
                                            {(() => {
                                                // 카테고리별로 매크로 그룹화
                                                const groupedMacros: { [key: string]: MacroTemplate[] } = macros.reduce((acc, macro) => {
                                                    const category = macro.category || 'general';
                                                    if (!acc[category]) {
                                                        acc[category] = [];
                                                    }
                                                    acc[category].push(macro);
                                                    return acc;
                                                }, {} as { [key: string]: MacroTemplate[] });

                                                // 카테고리 순서 정의
                                                const categoryOrder = ['greeting', 'general', 'solution', 'transfer', 'closing'];

                                                const categoryNames: { [key: string]: string } = {
                                                    'greeting': '인사말',
                                                    'general': '일반',
                                                    'solution': '해결책',
                                                    'transfer': '이관',
                                                    'closing': '마무리'
                                                };

                                                return categoryOrder.map(category => {
                                                    const categoryMacros = groupedMacros[category];
                                                    if (!categoryMacros) return null;

                                                    return (
                                                        <div key={category} className="space-y-2">
                                                            <h4 className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                                                                {categoryNames[category] || category}
                                                            </h4>
                                                            <div className="space-y-1">
                                                                {categoryMacros.map((macro: MacroTemplate) => (
                                                                    <button
                                                                        key={macro.id}
                                                                        onClick={() => {
                                                                            handleUseMacro(macro.macro_type);
                                                                            setShowMacros(false);
                                                                        }}
                                                                        className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors duration-200 border border-transparent hover:border-slate-200"
                                                                    >
                                                                        <div className="font-medium text-slate-800 text-sm">{macro.name}</div>
                                                                        <div className="text-xs text-slate-600 mt-1 line-clamp-2">{macro.description}</div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="text-center text-slate-500 py-4 text-sm">
                                            사용 가능한 매크로가 없습니다.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 relative">
                            <textarea
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="메시지를 입력하세요..."
                                className="w-full resize-none border border-slate-300 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm hover:shadow-md transition-all duration-200"
                                rows={1}
                                maxLength={500}
                            />
                            <div className="absolute bottom-2 right-3 text-xs text-slate-400">
                                {inputMessage.length}/500
                            </div>
                        </div>
                        <button
                            onClick={() => handleSendMessage(inputMessage)}
                            disabled={!inputMessage.trim()}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg font-medium flex-shrink-0"
                        >
                            전송
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 
