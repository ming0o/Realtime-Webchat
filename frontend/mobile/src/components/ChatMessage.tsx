import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../types';
import QuickReplyButton from './QuickReplyButton';

interface ChatMessageProps {
    message: Message;
    onQuickReply?: (reply: string) => void;
}

export default function ChatMessage({ message, onQuickReply }: ChatMessageProps) {
    const isUser = message.sender_type === 'USER';
    const isBot = message.sender_type === 'BOT';
    const isAdmin = message.sender_type === 'ADMIN';
    const isSystem = message.sender_type === 'SYSTEM';

    // 시간 포맷 함수 (Invalid Date 방지, createdAt이 없으면 현재 시간 사용)
    const getMessageTime = () => {
        let dateStr = message.createdAt;
        if (!dateStr) {
            // fallback: 메시지에 createdAt이 없으면 현재 시간 사용
            dateStr = new Date().toISOString();
        }
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // 안내 메시지(상담원 연결 등)도 잘 보이도록
    const getSenderLabel = () => {
        if (isBot) return '챗봇';
        if (isAdmin) return '상담원';
        if (isSystem) return '시스템';
        return '';
    };

    return (
        <View style={[
            styles.container,
            isUser ? styles.userContainer : isSystem ? styles.systemContainer : styles.otherContainer
        ]}>
            <View style={[
                styles.messageBubble,
                isUser ? styles.userBubble :
                    isBot ? styles.botBubble :
                        isAdmin ? styles.adminBubble :
                            isSystem ? styles.systemBubble : styles.botBubble
            ]}>
                {getSenderLabel() !== '' && (
                    <Text style={styles.botLabel}>{getSenderLabel()}</Text>
                )}
                <Text style={[
                    styles.messageText,
                    isUser ? styles.userText :
                        isSystem ? styles.systemText : styles.otherText
                ]}>
                    {message.content}
                </Text>
                <Text style={styles.timestamp}>
                    {getMessageTime()}
                </Text>
            </View>

            {/* QuickReply 버튼들 렌더링 */}
            {isBot && message.quick_replies && message.quick_replies.length > 0 && onQuickReply && (
                <View style={styles.quickReplyContainer}>
                    {message.quick_replies.map((reply, index) => (
                        <QuickReplyButton
                            key={index}
                            text={reply}
                            onPress={() => onQuickReply(reply)}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
        paddingHorizontal: 16,
    },
    userContainer: {
        alignItems: 'flex-end',
    },
    otherContainer: {
        alignItems: 'flex-start',
    },
    systemContainer: {
        alignItems: 'center', // 시스템 메시지는 가운데 정렬
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
    },
    userBubble: {
        backgroundColor: '#007AFF',
    },
    botBubble: {
        backgroundColor: '#ffffff',
    },
    adminBubble: {
        backgroundColor: '#34C759',
    },
    systemBubble: {
        backgroundColor: '#E0E0E0', // 시스템 메시지에 대한 배경색
    },
    messageText: {
        fontSize: 16,
        lineHeight: 20,
    },
    userText: {
        color: '#FFFFFF',
    },
    otherText: {
        color: '#000000',
    },
    systemText: {
        color: '#8E8E93', // 시스템 메시지 텍스트 색상
    },
    timestamp: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 4,
    },
    botLabel: {
        fontSize: 12,
        color: '#8E8E93',
        marginBottom: 4,
        fontWeight: '500',
    },
    quickReplyContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
        justifyContent: 'flex-start',
    },
}); 