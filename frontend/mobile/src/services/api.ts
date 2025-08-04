const API_BASE_URL = 'http://localhost:8080';

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

    // 챗봇 응답 요청 (시뮬레이션)
    async getBotResponse(userMessage: string): Promise<{ message: string; suggestions?: string[] }> {
        // 실제로는 AI 서비스나 챗봇 API를 호출
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 지연

        // 사용자 메시지에 따른 응답
        if (userMessage.includes('버그') || userMessage.includes('오류')) {
            return {
                message: '버그 신고는 아래 양식을 통해 남겨주세요. 이메일: support@yourapp.com',
                suggestions: ['처음으로']
            };
        }

        if (userMessage.includes('전화번호') || userMessage.includes('연락처')) {
            return {
                message: '고객센터 전화번호는 1588-1234입니다. 평일 오전 9시~오후 6시까지 운영됩니다.',
                suggestions: ['처음으로']
            };
        }

        if (userMessage.includes('상담원') || userMessage.includes('연결')) {
            return {
                message: '산업안전 보건법에 따른 고객응대 근로자 보호 조치가 시행되고 있습니다. 폭언 및 욕설 시 상담 진행이 어렵습니다. 상담원을 연결해 드리겠습니다. 잠시만 기다려 주세요. 업무시간은 평일 오전 9시~오후 6시입니다. 감사합니다.',
                suggestions: []
            };
        }

        // 기본 응답
        return {
            message: '안녕하세요. 안내 챗봇입니다. 도움이 필요하신가요?',
            suggestions: ['버그 신고', '전화번호 안내', '상담원 연결']
        };
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