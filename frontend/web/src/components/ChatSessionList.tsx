'use client';

import { useState } from 'react';
import { ChatSession, SearchFilter } from '@/types';
import { Search } from 'lucide-react';

interface ChatSessionListProps {
    onSelectSession: (session: ChatSession) => void;
    selectedSessionId?: number;
}

const mockSessions: ChatSession[] = [
    {
        id: 1,
        title: '[단순 문의] 뭐 먹을지 물어봤는데 추천이 맘에 안들어요.',
        author: 'MQEONZE',
        status: '접수',
        lastMessage: '오늘 점심 메뉴를 알고 싶어요.',
        createdAt: '2024-01-15T10:30:00Z'
    },
    {
        id: 2,
        title: '[오류 발견] 어떻게 되지 않아요 전 분명 명령어를 입력했는데 봇이 먹통이에요.',
        author: 'MQEONZE',
        status: '접수',
        lastMessage: '봇이 응답하지 않아요.',
        createdAt: '2024-01-15T09:15:00Z'
    }
];

const statusColors = {
    '접수': 'bg-red-100 text-red-800',
    '응대': 'bg-blue-100 text-blue-800',
    '종료': 'bg-gray-100 text-gray-800',
    '보류': 'bg-yellow-100 text-yellow-800'
};

export default function ChatSessionList({ onSelectSession, selectedSessionId }: ChatSessionListProps) {
    const [sessions] = useState<ChatSession[]>(mockSessions);
    const [searchFilter, setSearchFilter] = useState<SearchFilter>({ type: 'content', keyword: '' });
    const [sortBy, setSortBy] = useState('recent');

    const filteredSessions = sessions.filter(session => {
        if (!searchFilter.keyword) return true;

        if (searchFilter.type === 'content') {
            return session.title.toLowerCase().includes(searchFilter.keyword.toLowerCase()) ||
                session.lastMessage?.toLowerCase().includes(searchFilter.keyword.toLowerCase());
        } else {
            return session.author.toLowerCase().includes(searchFilter.keyword.toLowerCase());
        }
    });

    const sortedSessions = [...filteredSessions].sort((a, b) => {
        if (sortBy === 'recent') {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
    });

    const statusCounts = {
        '접수': sessions.filter(s => s.status === '접수').length,
        '응대': sessions.filter(s => s.status === '응대').length,
        '종료': sessions.filter(s => s.status === '종료').length,
        '보류': sessions.filter(s => s.status === '보류').length,
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* 헤더 */}
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">채팅 상담</h2>

                {/* 상태 통계 */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                    {Object.entries(statusCounts).map(([status, count]) => (
                        <div key={status} className="text-center">
                            <div className={`text-sm font-medium ${statusColors[status as keyof typeof statusColors]}`}>
                                {status}
                            </div>
                            <div className="text-lg font-bold text-gray-900">{count}</div>
                        </div>
                    ))}
                </div>

                {/* 검색 필터 */}
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <select
                            value={searchFilter.type}
                            onChange={(e) => setSearchFilter(prev => ({ ...prev, type: e.target.value as 'content' | 'author' }))}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                            <option value="content">상담 내용</option>
                            <option value="author">작성자</option>
                        </select>
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="검색어를 입력하세요"
                                value={searchFilter.keyword}
                                onChange={(e) => setSearchFilter(prev => ({ ...prev, keyword: e.target.value }))}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                        </div>
                    </div>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                        <option value="recent">최근 대화 순</option>
                    </select>
                </div>
            </div>

            {/* 세션 목록 */}
            <div className="flex-1 overflow-y-auto">
                {sortedSessions.map((session) => (
                    <div
                        key={session.id}
                        onClick={() => onSelectSession(session)}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedSessionId === session.id ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                                {session.title}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${statusColors[session.status]}`}>
                                {session.status}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{session.author}</span>
                            <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                        </div>
                        {session.lastMessage && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                                {session.lastMessage}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
} 