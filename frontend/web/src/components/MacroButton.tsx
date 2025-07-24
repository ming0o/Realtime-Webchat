'use client';

import { useState } from 'react';
import { MacroTemplate } from '@/types';

interface MacroButtonProps {
    macro: MacroTemplate;
    onUseMacro: (macroType: string) => void;
    disabled?: boolean;
}

export default function MacroButton({ macro, onUseMacro, disabled = false }: MacroButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async () => {
        if (disabled || isLoading) return;

        setIsLoading(true);
        try {
            await onUseMacro(macro.macro_type);
        } catch (error) {
            console.error('매크로 사용 실패:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled || isLoading}
            className={`
                px-3 py-2 text-sm font-medium rounded-lg transition-colors
                ${disabled || isLoading
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
                }
            `}
        >
            {isLoading ? '전송중...' : macro.name}
        </button>
    );
} 