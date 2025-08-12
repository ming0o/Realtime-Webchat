import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
} from 'react-native';
import { Message, ChatMode } from '../types';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import ChatMessage from '../components/ChatMessage';
import { useTheme } from '../contexts/ThemeContext';

// API 호출 함수들을 분리
const chatApi = {
    // 메시지 로드
    loadMessages: async (chatRoomId: number) => {
        try {
            const response = await api.getMessages(chatRoomId);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // 챗봇 응답 요청
    getBotResponse: async (userMessage: string) => {
        try {
            const response = await api.getBotResponse(userMessage);
            return response;
        } catch (error) {
            console.error('챗봇 응답 실패:', error);
            throw error;
        }
    },

    // 상담원 연결 요청
    requestAgentConnection: async (chatRoomId: number) => {
        try {
            const response = await api.requestAgentConnection(chatRoomId);
            return response;
        } catch (error) {
            console.error('상담원 연결 실패:', error);
            throw error;
        }
    },


};

interface ChatScreenProps {
    chatRoomId?: number;
    _userId?: number;
}

export default function ChatScreen({ chatRoomId, _userId }: ChatScreenProps) {
    const { colors, isDarkMode, toggleTheme } = useTheme();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chatMode, setChatMode] = useState<ChatMode>('bot');
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    const loadMessages = useCallback(async () => {
        if (!chatRoomId) return;

        try {
            const response = await chatApi.loadMessages(chatRoomId);
            setMessages(response);
        } catch (error) {
            console.error('메시지 로드 실패:', error);
        }
    }, [chatRoomId]);

    // 초기 챗봇 메시지 로드
    useEffect(() => {
        const initializeChat = async () => {
            if (!chatRoomId) return;

            try {
                const botResponse = await chatApi.getBotResponse('');

                const initialMessage: Message = {
                    id: Date.now(),
                    chat_room_id: chatRoomId,
                    sender_type: 'BOT',
                    content: botResponse.message,
                    message_type: 'QUICK_REPLY',
                    read: false,
                    createdAt: new Date().toISOString(),
                    quick_replies: botResponse.suggestions,
                };
                setMessages([initialMessage]);
            } catch (error) {
                console.error('초기 메시지 로드 실패:', error);
                // 에러 발생 시 기본 메시지 표시
                const fallbackMessage: Message = {
                    id: Date.now(),
                    chat_room_id: chatRoomId,
                    sender_type: 'BOT',
                    content: '안녕하세요! 안내 챗봇입니다. 무엇을 도와드릴까요?',
                    message_type: 'QUICK_REPLY',
                    read: false,
                    createdAt: new Date().toISOString(),
                    quick_replies: ['버그 신고', '전화번호 안내', '상담원 연결'],
                };
                setMessages([fallbackMessage]);
            }
            setIsInitialized(true);
        };

        if (chatRoomId && !isInitialized) {
            initializeChat();
        }
    }, [chatRoomId, isInitialized]);

    useEffect(() => {
        if (chatRoomId) {
            const socket = socketService.connect();
            socketService.joinRoom(chatRoomId);

            const handleConnect = () => {
                setIsConnected(true);
            };
            const handleDisconnect = () => {
                setIsConnected(false);
            };

            socket.on('connect', handleConnect);
            socket.on('disconnect', handleDisconnect);
            setIsConnected(socket.connected);

            socketService.onMessage((newMessage: Message) => {
                if (!newMessage.createdAt && (newMessage as any).created_at) {
                    newMessage.createdAt = (newMessage as any).created_at;
                }
                setMessages(prev => {
                    // 중복 메시지 체크 (BOT 메시지는 내용만으로 체크)
                    const isDuplicate = prev.some(msg => {
                        // BOT 메시지인 경우 내용만으로 중복 체크 (상담원 연결 메시지 등)
                        if (newMessage.sender_type === 'BOT' || msg.sender_type === 'BOT') {
                            return msg.content === newMessage.content &&
                                Math.abs(new Date(msg.createdAt || '').getTime() - new Date(newMessage.createdAt || '').getTime()) < 1000;
                        }

                        // 일반 메시지는 기존 로직
                        return msg.id === newMessage.id ||
                            (msg.content === newMessage.content &&
                                msg.sender_type === newMessage.sender_type &&
                                Math.abs(new Date(msg.createdAt || '').getTime() - new Date(newMessage.createdAt || '').getTime()) < 1000);
                    });

                    if (isDuplicate) {
                        return prev;
                    }

                    return [...prev, newMessage];
                });
            });

            // 타이핑 이벤트 리스너 추가
            socketService.onTyping((data: { chatRoomId: number; userType: string }) => {
                if (data.chatRoomId === chatRoomId) {
                    if (data.userType === 'USER' || data.userType === 'ADMIN') {
                        setIsTyping(true);
                        setTimeout(() => {
                            setIsTyping(false);
                        }, 3000);
                    } else if (data.userType === 'USER_STOP' || data.userType === 'ADMIN_STOP') {
                        setIsTyping(false);
                    }
                }
            });

            // 새로운 채팅방의 경우 기존 메시지가 없으므로 loadMessages 호출하지 않음
            // loadMessages();

            return () => {
                socket.off('connect', handleConnect);
                socket.off('disconnect', handleDisconnect);
                socketService.leaveRoom(chatRoomId);
                socketService.disconnect();
            };
        }
    }, [chatRoomId, loadMessages]);

    useEffect(() => {
        // Connection status changed
    }, [isConnected]);



    const handleQuickReply = async (reply: string) => {
        if (!chatRoomId || isLoading) return;

        // 사용자 선택 메시지 추가
        const userMessage: Message = {
            id: Date.now(),
            chat_room_id: chatRoomId,
            sender_type: 'USER',
            content: reply,
            message_type: 'TEXT',
            read: false,
            createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            // 챗봇 응답
            const botResponse = await chatApi.getBotResponse(reply);

            const botMessage: Message = {
                id: Date.now() + 1,
                chat_room_id: chatRoomId,
                sender_type: 'BOT',
                content: botResponse.message,
                message_type: 'QUICK_REPLY',
                read: false,
                createdAt: new Date().toISOString(),
                quick_replies: botResponse.suggestions,
            };

            setMessages(prev => [...prev, botMessage]);

            // 상담원 연결 요청
            if (reply === '상담원 연결') {
                setChatMode('connecting');
                await chatApi.requestAgentConnection(chatRoomId);
                setChatMode('agent');
            }
        } catch (error) {
            console.error('응답 처리 실패:', error);
            Alert.alert('오류', '응답 처리에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };



    const sendMessage = async () => {
        if (!inputText.trim() || !chatRoomId || isLoading) return;

        setInputText('');
        setIsLoading(true);

        // 메시지 전송 시 타이핑 중단
        if (chatMode === 'agent') {
            // 타이핑 중단 이벤트 전송 (서버에서 타이핑 상태를 false로 설정)
            socketService.sendTyping(chatRoomId, 'CLIENT_STOP');
        }

        try {
            if (chatMode === 'agent') {
                // 상담원에게 메시지 전송 (setMessages 직접 호출 X)
                socketService.sendMessage(chatRoomId, inputText.trim());
            } else {
                // 챗봇 응답
                const userMessage: Message = {
                    id: Date.now(),
                    chat_room_id: chatRoomId,
                    sender_type: 'USER',
                    content: inputText.trim(),
                    message_type: 'TEXT',
                    read: false,
                    createdAt: new Date().toISOString(),
                };
                setMessages(prev => [...prev, userMessage]);

                const botResponse = await chatApi.getBotResponse(inputText.trim());

                const botMessage: Message = {
                    id: Date.now() + 1,
                    chat_room_id: chatRoomId,
                    sender_type: 'BOT',
                    content: botResponse.message,
                    message_type: 'QUICK_REPLY',
                    read: false,
                    createdAt: new Date().toISOString(),
                    quick_replies: botResponse.suggestions,
                };

                setMessages(prev => [...prev, botMessage]);
            }
        } catch (error) {
            console.error('메시지 전송 실패:', error);
            Alert.alert('오류', '메시지 전송에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => (
        <ChatMessage
            message={item}
            onQuickReply={handleQuickReply}
        />
    );

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* 헤더 */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <View style={styles.headerContent}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        {chatMode === 'bot' ? '챗봇 상담' :
                            chatMode === 'connecting' ? '상담원 연결 중...' : '실시간 상담'}
                    </Text>
                </View>
            </View>

            {/* 메시지 목록 */}
            <FlatList
                ref={flatListRef}
                data={messages.filter(Boolean)}
                renderItem={renderMessage}
                keyExtractor={(item, index) => (item && item.id !== undefined ? item.id.toString() : `msg-${index}`)}
                style={[styles.messageList, { backgroundColor: colors.background }]}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                onLayout={() => flatListRef.current?.scrollToEnd()}
            />

            {/* 타이핑 인디케이터 */}
            {isTyping && (
                <View style={[styles.typingIndicator, { backgroundColor: colors.surfaceSecondary, borderBottomColor: colors.border }]}>
                    <View style={styles.typingDots}>
                        <View style={[styles.dot, styles.dot1, { backgroundColor: colors.primary }]} />
                        <View style={[styles.dot, styles.dot2, { backgroundColor: colors.primary }]} />
                        <View style={[styles.dot, styles.dot3, { backgroundColor: colors.primary }]} />
                    </View>
                    <Text style={[styles.typingText, { color: colors.textSecondary }]}>상담사가 입력중...</Text>
                </View>
            )}

            {/* 입력 영역 */}
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                <TextInput
                    style={[styles.textInput, {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.inputBorder,
                        color: colors.inputText
                    }]}
                    value={inputText}
                    onChangeText={(text) => {
                        setInputText(text);
                        // 상담원 모드일 때만 typing 이벤트 전송
                        if (chatMode === 'agent' && chatRoomId) {
                            socketService.sendTyping(chatRoomId, 'CLIENT');
                        }
                    }}
                    placeholder={chatMode === 'agent' ? "상담원에게 메시지를 입력하세요..." : "메시지를 입력하세요..."}
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        { backgroundColor: colors.buttonPrimary },
                        (!inputText.trim() || isLoading) && { backgroundColor: colors.buttonSecondary }
                    ]}
                    onPress={sendMessage}
                    disabled={!inputText.trim() || isLoading}
                >
                    <Text style={[styles.sendButtonText, { color: colors.buttonText }]}>
                        {isLoading ? '전송 중...' : '전송'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* 전환 버튼 - 좌측 하단 */}
            <TouchableOpacity
                style={[styles.switchButton, { backgroundColor: colors.buttonSecondary }]}
                onPress={toggleTheme}
            >
                <Text style={[styles.switchButtonText, { color: colors.text }]}>
                    {isDarkMode ? '☀️' : '🌙'}
                </Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    header: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    messageList: {
        flex: 1,
    },
    quickReplyContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },

    inputContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 60,
    },
    textInput: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        fontSize: 16,
        backgroundColor: '#FFFFFF',
    },
    sendButton: {
        backgroundColor: '#007AFF',
        height: 40,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#C7C7CC',
    },
    sendButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#E0E0E0',
        borderBottomWidth: 1,
        borderBottomColor: '#D1D1D6',
    },
    typingDots: {
        flexDirection: 'row',
        marginRight: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#007AFF',
    },
    dot1: {
        marginRight: 4,
    },
    dot2: {
        marginRight: 4,
    },
    dot3: {
        marginRight: 0,
    },
    typingText: {
        fontSize: 14,
        color: '#333333',
    },
    switchButton: {
        position: 'absolute',
        bottom: 80,
        left: 20,
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    switchButtonText: {
        fontSize: 20,
    },
}); 