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
            console.log('🔥 채팅방 변경으로 소켓 리스너 재등록:', selectedSessionId);

            // 소켓 연결 강제 재시도
            const socket = socketService.connect();
            console.log('🔥 소켓 연결 상태 확인:', socket?.connected);

            // 소켓이 연결될 때까지 잠시 대기 후 리스너 등록
            const setupListeners = () => {
                if (socketService.isConnected()) {
                    console.log('🔥 소켓이 연결됨. 리스너 등록 시작');

                    socketService.joinRoom(selectedSessionId);
                    socketService.joinAdmin(); // 관리자 룸에도 입장

                    // 채팅방별로 새로운 메시지 리스너 등록
                    const handleMessage = (newMessage: Message) => {
                        console.log('🔥🔥🔥 ChatArea 메시지 수신됨!', newMessage);
                        console.log('🔥 현재 selectedSessionId:', selectedSessionId);
                        console.log('🔥 메시지 chat_room_id:', newMessage.chat_room_id);
                        console.log('🔥 메시지 sender_type:', newMessage.sender_type);
                        console.log('🔥 메시지 content:', newMessage.content);

                        if (newMessage.chat_room_id === selectedSessionId) {
                            console.log('🔥🔥🔥 메시지 추가 시도!');
                            setMessages(prev => {
                                console.log('🔥 이전 메시지 개수:', prev.length);

                                // 중복 메시지 체크
                                const isDuplicate = prev.some(msg =>
                                    msg._id === newMessage._id ||
                                    msg.id === newMessage.id ||
                                    (msg.content === newMessage.content &&
                                        msg.sender_type === newMessage.sender_type &&
                                        Math.abs(new Date(msg.createdAt || '').getTime() - new Date(newMessage.createdAt || '').getTime()) < 1000)
                                );

                                if (isDuplicate) {
                                    console.log('🔥 중복 메시지 감지! 추가하지 않음');
                                    return prev;
                                }

                                const newMessages = [...prev, newMessage];
                                console.log('🔥 새로운 메시지 개수:', newMessages.length);
                                return newMessages;
                            });
                        } else {
                            console.log('🔥 다른 채팅방 메시지 무시');
                        }
                    };

                    const handleTyping = (data: { chatRoomId: number; userType: string }) => {
                        console.log('🔥🔥🔥🔥🔥 타이핑 이벤트 수신됨!', data);
                        console.log('🔥 현재 selectedSessionId:', selectedSessionId);
                        console.log('🔥 이벤트 chatRoomId:', data.chatRoomId);
                        console.log('🔥 이벤트 userType:', data.userType);
                        console.log('🔥 타입 비교 결과:', data.userType === 'CLIENT' || data.userType === 'USER');
                        console.log('🔥 채팅방 비교 결과:', data.chatRoomId === selectedSessionId);
                        console.log('🔥 소켓 연결 상태:', socketService.isConnected());

                        if (data.chatRoomId === selectedSessionId) {
                            console.log('🔥 채팅방 일치! 타이핑 처리 시작');
                            if (data.userType === 'USER' || data.userType === 'CLIENT') {
                                console.log('��🔥🔥🔥🔥 타이핑 인디케이터 활성화 시도!');
                                setIsTyping(true);
                                console.log('🔥 isTyping 상태를 true로 설정했습니다');
                                setTimeout(() => {
                                    console.log('🔥 타이핑 인디케이터 자동 중단 (3초)');
                                    setIsTyping(false);
                                }, 3000);
                            } else if (data.userType === 'USER_STOP' || data.userType === 'CLIENT_STOP') {
                                console.log('🔥 타이핑 인디케이터 중단');
                                setIsTyping(false);
                            }
                        } else {
                            console.log('🔥 채팅방 불일치 - 타이핑 이벤트 무시');
                        }
                    };

                    socketService.onMessage(handleMessage);
                    socketService.onTyping(handleTyping);
                    console.log('🔥🔥🔥 타이핑 이벤트 리스너 등록 완료!');
                    console.log('🔥🔥🔥 메시지 이벤트 리스너 등록 완료!');
                    console.log('🔥 현재 채팅방 ID:', selectedSessionId);
                    console.log('🔥 소켓 연결 상태:', socketService.isConnected());
                    console.log('🔥 소켓 ID:', socket?.id);

                    // loadChatData를 직접 호출
                    const loadData = async () => {
                        setLoading(true);
                        try {
                            const [roomData, messagesData, macrosData] = await Promise.all([
                                api.getChatRoom(selectedSessionId),
                                api.getMessages(selectedSessionId),
                                api.getMacroTemplates()
                            ]);
                            setChatRoom(roomData);

                            // 메시지 중복 제거
                            const uniqueMessages = Array.isArray(messagesData) ?
                                messagesData.filter((msg, index, arr) =>
                                    arr.findIndex(m =>
                                        m._id === msg._id ||
                                        m.id === msg.id ||
                                        (m.content === msg.content &&
                                            m.sender_type === msg.sender_type &&
                                            Math.abs(new Date(m.createdAt || '').getTime() - new Date(msg.createdAt || '').getTime()) < 1000)
                                    ) === index
                                ) : [];

                            console.log('🔥 로드된 메시지 개수:', uniqueMessages.length);
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
                        console.log('🔥 소켓 리스너 해제:', selectedSessionId);
                        socketService.offMessage(handleMessage);
                        socketService.offTyping(handleTyping);
                        socketService.leaveRoom(selectedSessionId);
                        socketService.leaveAdmin(); // 관리자 룸에서도 퇴장
                    };
                } else {
                    console.log('🔥 소켓이 아직 연결되지 않음. 1초 후 재시도...');
                    setTimeout(setupListeners, 1000);
                }
            };

            setupListeners();
        } else {
            setChatRoom(null);
            setMessages([]);
        }
    }, [selectedSessionId]); // loadChatData 의존성 제거


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
                    Array.isArray(messages) && messages.map((message, index) => {
                        // 더 안전한 key 생성 - 메시지 고유 식별자 우선 사용
                        const messageKey = message._id ||
                            message.id ||
                            `msg-${index}-${message.createdAt || Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                        return (
                            <ChatMessage
                                key={messageKey}
                                message={message}
                            />
                        );
                    })
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
