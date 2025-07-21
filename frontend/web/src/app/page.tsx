'use client';

import { useState } from 'react';
import ChatSessionList from '@/components/ChatSessionList';
import ChatArea from '@/components/ChatArea';
import { ChatSession } from '@/types';

export default function Home() {
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);

  const handleSelectSession = (session: ChatSession) => {
    setSelectedSession(session);
  };

  const handleSendMessage = (message: string) => {
    console.log('메시지 전송:', message);
    // 여기서 실제 메시지 처리 로직을 구현할 수 있습니다
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 헤더 */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-black text-white px-4 py-3">
        <h1 className="text-xl font-bold">SUPPORT</h1>
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
          <ChatArea
            selectedSessionId={selectedSession?.id}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>
    </div>
  );
}
