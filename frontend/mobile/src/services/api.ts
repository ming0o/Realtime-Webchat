import { getApiUrl, API_CONFIG } from '../config/constants';

const API_BASE_URL = getApiUrl();

export const api = {
    // 사용자 생성 (게스트 로그인)
    async createGuestUser(nickname: string) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    socialType: 'GUEST',
                    nickname,
                    socialId: null,
                    token: null
                }),
            });

            if (!response.ok) throw new Error('사용자 생성에 실패했습니다.');
            return response.json();
        } catch (error) {
            throw error;
        }
    },

    // 채팅방 생성
    async createChatRoom(userId: number) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/chat-rooms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
            });

            if (!response.ok) throw new Error('채팅방 생성에 실패했습니다.');
            return response.json();
        } catch (error) {
            throw error;
        }
    },

    // 메시지 목록 조회
    async getMessages(chatRoomId: number) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/messages/${chatRoomId}`);
            if (!response.ok) throw new Error('메시지를 가져오는데 실패했습니다.');
            return response.json();
        } catch (error) {
            throw error;
        }
    },

    // 챗봇 응답 요청
    async getBotResponse(userMessage: string): Promise<{ message: string; suggestions?: string[] }> {
        try {
            // 타임아웃 설정
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

            const response = await fetch(`${API_BASE_URL}/api/chat-rooms/bot-response`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userMessage }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('챗봇 응답 요청에 실패했습니다.');

            const data = await response.json();
            return data;
        } catch (error: any) {
            console.error('챗봇 응답 실패:', error);
            if (error.name === 'AbortError') {
                console.error('API 요청 타임아웃');
            }
            // 에러 발생 시 기본 응답 반환
            return {
                message: '안녕하세요! 안내 챗봇입니다. 무엇을 도와드릴까요?',
                suggestions: ['버그 신고', '전화번호 안내', '상담원 연결']
            };
        }
    },

    // 상담원 연결 요청
    async requestAgentConnection(chatRoomId: number) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/chat-rooms/${chatRoomId}/connect-agent`, {
                method: 'POST',
            });
            if (!response.ok) throw new Error('상담원 연결 요청에 실패했습니다.');
            return response.json();
        } catch (error) {
            throw error;
        }
    },


};