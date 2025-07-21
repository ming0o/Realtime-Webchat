'use client';

import { useState } from 'react';
import { Send, Plus } from 'lucide-react';

interface ChatInputProps {
    onSendMessage: (message: string) => void;
    disabled?: boolean;
}

const messageTemplates = [
    '상담원 인사',
    '상담 종료',
    '환불 안내',
    '대기 안내'
];

export default function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
    const [message, setMessage] = useState('');

    const handleSendMessage = () => {
        if (message.trim() && !disabled) {
            onSendMessage(message.trim());
            setMessage('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleTemplateClick = (template: string) => {
        onSendMessage(template);
    };

    return (
        <div className="border-t bg-white">
            {/* 템플릿 버튼들 */}
            <div className="p-3 border-b bg-gray-50">
                <div className="flex flex-wrap gap-2">
                    {messageTemplates.map((template, index) => (
                        <button
                            key={index}
                            onClick={() => handleTemplateClick(template)}
                            disabled={disabled}
                            className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {template}
                        </button>
                    ))}
                    <button
                        disabled={disabled}
                        className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                        <Plus className="w-3 h-3" />
                        추가
                    </button>
                </div>
            </div>

            {/* 메시지 입력 */}
            <div className="p-4">
                <div className="flex items-end space-x-2">
                    <div className="flex-1">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="텍스트를 입력하세요"
                            disabled={disabled}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                            rows={3}
                        />
                    </div>
                    <button
                        onClick={handleSendMessage}
                        disabled={!message.trim() || disabled}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        전송
                    </button>
                </div>
            </div>
        </div>
    );
} 