const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = {
    // 채팅방 목록 조회
    async getChatRooms() {
        const response = await fetch(`${API_BASE_URL}/api/chat-rooms`);
        if (!response.ok) throw new Error('채팅방 목록을 가져오는데 실패했습니다.');
        return response.json();
    },

    // 특정 채팅방 조회
    async getChatRoom(roomId: number) {
        const response = await fetch(`${API_BASE_URL}/api/chat-rooms/${roomId}`);
        if (!response.ok) throw new Error('채팅방 정보를 가져오는데 실패했습니다.');
        return response.json();
    },

    // 메시지 목록 조회
    async getMessages(chatRoomId: number, limit = 50, offset = 0) {
        const response = await fetch(
            `${API_BASE_URL}/api/messages/${chatRoomId}?limit=${limit}&offset=${offset}`
        );
        if (!response.ok) throw new Error('메시지를 가져오는데 실패했습니다.');
        return response.json();
    },

    // 메시지 읽음 표시
    async markMessagesAsRead(chatRoomId: number) {
        const response = await fetch(`${API_BASE_URL}/api/messages/${chatRoomId}/read`, {
            method: 'POST',
        });
        if (!response.ok) throw new Error('메시지 상태 업데이트에 실패했습니다.');
        return response.json();
    },

    // 사용자 생성
    async createUser(socialType: 'KAKAO' | 'GUEST', nickname: string, socialId?: string, token?: string) {
        const response = await fetch(`${API_BASE_URL}/api/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ socialType, nickname, socialId, token }),
        });
        if (!response.ok) throw new Error('사용자 생성에 실패했습니다.');
        return response.json();
    },
}; 