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

    // 프로필 이미지 또는 아이콘 렌더링
    const renderProfile = () => {
        if (isUser) return null; // 사용자 메시지는 프로필 없음

        return (
            <View style={[
                styles.profileContainer,
                isBot ? styles.botProfile : styles.adminProfile
            ]}>
                {isBot ? (
                    <View style={styles.botIcon}>
                        <Text style={styles.botIconText}>🤖</Text>
                    </View>
                ) : isAdmin ? (
                    <View style={styles.adminIcon}>
                        <Text style={styles.adminIconText}>👤</Text>
                    </View>
                ) : null}
            </View>
        );
    };

    return (
        <View style={[
            styles.container,
            isUser ? styles.userContainer : isSystem ? styles.systemContainer : styles.otherContainer
        ]}>
            {/* 프로필 이미지 (봇/상담원만) */}
            {!isUser && !isSystem && renderProfile()}

            <View style={styles.messageContentContainer}>
                <View style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble :
                        isBot ? styles.botBubble :
                            isAdmin ? styles.adminBubble :
                                isSystem ? styles.systemBubble : styles.botBubble
                ]}>
                    {getSenderLabel() !== '' && (
                        <Text style={[
                            styles.senderLabel,
                            isBot ? styles.botLabel : styles.adminLabel
                        ]}>
                            {getSenderLabel()}
                        </Text>
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

                {/* QuickReply 버튼들 렌더링 - 메시지 말풍선 밑에 위치 */}
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    messageContentContainer: {
        flex: 1,
        flexDirection: 'column',
    },
    userContainer: {
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
    },
    otherContainer: {
        justifyContent: 'flex-start',
    },
    systemContainer: {
        justifyContent: 'center', // 시스템 메시지는 가운데 정렬
        flexDirection: 'column',
    },
    profileContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    botProfile: {
        backgroundColor: '#E3F2FD',
    },
    adminProfile: {
        backgroundColor: '#E8F5E8',
    },
    botIcon: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    adminIcon: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    botIconText: {
        fontSize: 16,
    },
    adminIconText: {
        fontSize: 16,
    },
    messageBubble: {
        maxWidth: '75%',
        padding: 12,
        borderRadius: 16,
        flex: 1,
    },
    userBubble: {
        backgroundColor: '#007AFF',
        marginLeft: 'auto',
    },
    botBubble: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    adminBubble: {
        backgroundColor: '#34C759',
    },
    systemBubble: {
        backgroundColor: '#E0E0E0', // 시스템 메시지에 대한 배경색
        maxWidth: '90%',
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
    senderLabel: {
        fontSize: 12,
        marginBottom: 4,
        fontWeight: '600',
    },
    botLabel: {
        color: '#1976D2',
    },
    adminLabel: {
        color: '#2E7D32',
    },
    quickReplyContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
        justifyContent: 'flex-start',
    },
}); 