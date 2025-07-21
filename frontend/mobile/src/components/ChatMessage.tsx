import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../types';

interface ChatMessageProps {
    message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.sender_type === 'USER';
    const isBot = message.sender_type === 'BOT';

    return (
        <View style={[
            styles.container,
            isUser ? styles.userContainer : styles.otherContainer
        ]}>
            <View style={[
                styles.messageBubble,
                isUser ? styles.userBubble : isBot ? styles.botBubble : styles.adminBubble
            ]}>
                {isBot && (
                    <Text style={styles.botLabel}>챗봇</Text>
                )}
                <Text style={[
                    styles.messageText,
                    isUser ? styles.userText : styles.otherText
                ]}>
                    {message.content}
                </Text>
                <Text style={styles.timestamp}>
                    {new Date(message.created_at).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
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