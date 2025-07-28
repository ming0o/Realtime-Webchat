'use client';

import { useState, useEffect } from 'react';
import ChatSessionList from '@/components/ChatSessionList';
import ChatArea from '@/components/ChatArea';
import { ChatRoom } from '@/types';
import { socketService } from '@/services/socket';

export default function Home() {
  const [selectedSession, setSelectedSession] = useState<ChatRoom | null>(null);

  useEffect(() => {
    socketService.connect();
    socketService.joinAdmin();

    const handleNewChatRoom = (newChatRoom: ChatRoom) => {
      console.log('새 채팅방 생성:', newChatRoom);
    };
    socketService.onNewChatRoom(handleNewChatRoom);

    const handleStatusChange = ({ roomId, status }: { roomId: number; status: string }) => {
      if (selectedSession?.id === roomId) {
        setSelectedSession(prev => prev ? { ...prev, status: status as ChatRoom['status'] } : null);
      }
    };
    socketService.onChatRoomStatusChange(handleStatusChange);

    return () => {
      socketService.offNewChatRoom(handleNewChatRoom);
      socketService.offChatRoomStatusChange(handleStatusChange);
      socketService.leaveAdmin();
      socketService.disconnect();
    };
  }, [selectedSession?.id]);

  const handleSelectSession = (session: ChatRoom) => {
    setSelectedSession(session);
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* 헤더 */}
      <header className="flex-shrink-0 bg-black text-white px-4 py-3 z-10">
        <h1 className="text-xl font-bold">SUPPORT 관리자</h1>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="flex flex-1 overflow-hidden">
        {/* 왼쪽 패널 - 채팅 세션 목록 */}
        <aside className="w-80 border-r border-gray-200 bg-white flex flex-col">
          <ChatSessionList
            onSelectSession={handleSelectSession}
            selectedSessionId={selectedSession?.id}
          />
        </aside>

        {/* 오른쪽 패널 - 채팅 영역 */}
        <section className="flex-1 flex flex-col">
          <ChatArea selectedSessionId={selectedSession?.id} />
        </section>
      </main>
    </div>
  );
}
