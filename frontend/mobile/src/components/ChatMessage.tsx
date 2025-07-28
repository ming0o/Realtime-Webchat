import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../types';

interface ChatMessageProps {
    message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.sender_type === 'USER';
    const isBot = message.sender_type === 'BOT';
    const isAdmin = message.sender_type === 'ADMIN';

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
        return '';
    };

    return (
        <View style={[
            styles.container,
            isUser ? styles.userContainer : styles.otherContainer
        ]}>
            <View style={[
                styles.messageBubble,
                isUser ? styles.userBubble : isBot ? styles.botBubble : styles.adminBubble
            ]}>
                {getSenderLabel() !== '' && (
                    <Text style={styles.botLabel}>{getSenderLabel()}</Text>
                )}
                <Text style={[
                    styles.messageText,
                    isUser ? styles.userText : styles.otherText
                ]}>
                    {message.content}
                </Text>
                <Text style={styles.timestamp}>
                    {getMessageTime()}
                </Text>
            </View>
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
}); 