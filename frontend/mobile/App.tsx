import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import ChatScreen from './src/screens/ChatScreen';
import { api } from './src/services/api';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';

interface StartScreenProps {
  nickname: string;
  setNickname: (nickname: string) => void;
  isLoading: boolean;
  onStartChat: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({
  nickname,
  setNickname,
  isLoading,
  onStartChat
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.primary }]}>실시간 상담</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>궁금한 점을 물어보세요</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.textInput, {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              color: colors.inputText
            }]}
            value={nickname}
            onChangeText={setNickname}
            placeholder="닉네임을 입력하세요"
            placeholderTextColor={colors.textTertiary}
            maxLength={20}
          />
          <TouchableOpacity
            style={[
              styles.startButton,
              { backgroundColor: colors.buttonPrimary },
              (!nickname.trim() || isLoading) && { backgroundColor: colors.buttonSecondary }
            ]}
            onPress={onStartChat}
            disabled={!nickname.trim() || isLoading}
          >
            <Text style={[styles.startButtonText, { color: colors.buttonText }]}>
              {isLoading ? '시작 중...' : '채팅 시작'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function App() {
  const [nickname, setNickname] = useState('');
  const [chatRoomId, setChatRoomId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startChat = async () => {
    if (!nickname.trim()) {
      Alert.alert('오류', '닉네임을 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      // 게스트 사용자 생성 (채팅방도 함께 생성됨)
      const response = await api.createGuestUser(nickname.trim());
      const newChatRoomId = response.chatRoomId.id;

      // 채팅 화면으로 이동
      setChatRoomId(newChatRoomId);
    } catch (error) {
      console.error('채팅 시작 실패:', error);
      Alert.alert('오류', '채팅을 시작할 수 없습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  if (chatRoomId) {
    return (
      <ThemeProvider>
        <ChatScreen chatRoomId={chatRoomId} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <StartScreen
        nickname={nickname}
        setNickname={setNickname}
        isLoading={isLoading}
        onStartChat={startChat}
      />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 40,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 300,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});


