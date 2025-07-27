import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Message, ChatMode } from '../types';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import ChatMessage from '../components/ChatMessage';
import QuickReplyButton from '../components/QuickReplyButton';

// API 호출 함수들을 분리
const chatApi = {
    // 메시지 로드
    loadMessages: async (chatRoomId: number) => {
        try {
            const response = await api.getMessages(chatRoomId);
            return response;
        } catch (error) {
            console.error('메시지 로드 실패:', error);
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
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chatMode, setChatMode] = useState<ChatMode>('bot');
    const flatListRef = useRef<FlatList>(null);
    const [isConnected, setIsConnected] = useState(false);

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
        };

        if (chatRoomId && messages.length === 0) {
            initializeChat();
        }
    }, [chatRoomId, messages.length]);

    useEffect(() => {
        if (chatRoomId) {
            const socket = socketService.connect();
            socketService.joinRoom(chatRoomId);

            const handleConnect = () => {
                console.log('소켓 연결됨');
                setIsConnected(true);
            };
            const handleDisconnect = () => {
                console.log('소켓 끊김');
                setIsConnected(false);
            };

            socket.on('connect', handleConnect);
            socket.on('disconnect', handleDisconnect);
            setIsConnected(socket.connected);

            socketService.onMessage((newMessage: Message) => {
                if (!newMessage.createdAt && (newMessage as any).created_at) {
                    newMessage.createdAt = (newMessage as any).created_at;
                }
                setMessages(prev => [...prev, newMessage]);
            });

            loadMessages();

            return () => {
                socket.off('connect', handleConnect);
                socket.off('disconnect', handleDisconnect);
                socketService.leaveRoom(chatRoomId);
                socketService.disconnect();
            };
        }
    }, [chatRoomId, loadMessages]);

    useEffect(() => {
        console.log('isConnected 상태:', isConnected);
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
        <View>
            <ChatMessage message={item} />
            {item.quick_replies && item.quick_replies.length > 0 && (
                <View style={styles.quickReplyContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {item.quick_replies.map((reply, index) => (
                            <QuickReplyButton
                                key={index}
                                text={reply}
                                onPress={() => handleQuickReply(reply)}
                            />
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* 헤더 */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>
                    {chatMode === 'bot' ? '챗봇 상담' :
                        chatMode === 'connecting' ? '상담원 연결 중...' : '실시간 상담'}
                </Text>
            </View>

            {/* 메시지 목록 */}
            <FlatList
                ref={flatListRef}
                data={messages.filter(Boolean)}
                renderItem={renderMessage}
                keyExtractor={(item, index) => (item && item.id !== undefined ? item.id.toString() : `msg-${index}`)}
                style={styles.messageList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                onLayout={() => flatListRef.current?.scrollToEnd()}
            />

            {/* 입력 영역 */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.textInput}
                    value={inputText}
                    onChangeText={(text) => {
                        setInputText(text);
                        // 상담원 모드일 때만 typing 이벤트 전송
                        if (chatMode === 'agent' && chatRoomId) {
                            socketService.sendTyping(chatRoomId, 'USER');
                        }
                    }}
                    placeholder={chatMode === 'agent' ? "상담원에게 메시지를 입력하세요..." : "메시지를 입력하세요..."}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
                    onPress={sendMessage}
                    disabled={!inputText.trim() || isLoading}
                >
                    <Text style={styles.sendButtonText}>
                        {isLoading ? '전송 중...' : '전송'}
                    </Text>
                </TouchableOpacity>
            </View>
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
}); 