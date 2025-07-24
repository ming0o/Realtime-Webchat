'use client';

import { useState, useEffect } from 'react';
import ChatSessionList from '@/components/ChatSessionList';
import ChatArea from '@/components/ChatArea';
import { ChatRoom } from '@/types';
import { socketService } from '@/services/socket';

export default function Home() {
  const [selectedSession, setSelectedSession] = useState<ChatRoom | null>(null);

  useEffect(() => {
    // 관리자 소켓 연결
    socketService.connect();
    socketService.joinAdmin();

    // 새 채팅방 생성 리스너
    socketService.onNewChatRoom((newChatRoom: ChatRoom) => {
      // 새 채팅방이 생성되면 목록을 새로고침하도록 ChatSessionList에 알림
      console.log('새 채팅방 생성:', newChatRoom);
    });

    // 채팅방 상태 변경 리스너
    socketService.onChatRoomStatusChange(({ roomId, status }) => {
      // 현재 선택된 채팅방의 상태가 변경된 경우
      if (selectedSession?.id === roomId) {
        setSelectedSession(prev => prev ? { ...prev, status: status as '접수' | '응대' | '종료' | '보류' } : null);
      }
    });

    return () => {
      socketService.leaveAdmin();
      socketService.disconnect();
    };
  }, [selectedSession?.id]);

  const handleSelectSession = (session: ChatRoom) => {
    setSelectedSession(session);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 헤더 */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-black text-white px-4 py-3">
        <h1 className="text-xl font-bold">SUPPORT 관리자</h1>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex flex-1 mt-16">
        {/* 왼쪽 패널 - 채팅 세션 목록 */}
        <div className="w-80 border-r border-gray-200 bg-white">
          <ChatSessionList
            onSelectSession={handleSelectSession}
            selectedSessionId={selectedSession?.id}
          />
        </div>

        {/* 오른쪽 패널 - 채팅 영역 */}
        <div className="flex-1">
          <ChatArea selectedSessionId={selectedSession?.id} />
        </div>
      </div>
    </div>
  );
}
