'use client';

import { MacroTemplate } from '@/types';

interface MacroButtonProps {
    macro: MacroTemplate;
    onUseMacro: (macroType: string) => void;
}

export default function MacroButton({ macro, onUseMacro }: MacroButtonProps) {
    const getMacroColor = (macroType: string) => {
        switch (macroType) {
            case 'off-hours':
                return 'from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700';
            case 'lunch-time':
                return 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700';
            case 'holiday':
                return 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700';
            default:
                return 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700';
        }
    };

    const getMacroIcon = (macroType: string) => {
        switch (macroType) {
            case 'off-hours':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'lunch-time':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                );
            case 'holiday':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                );
        }
    };

    return (
        <button
            onClick={() => onUseMacro(macro.macro_type)}
            className={`inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r ${getMacroColor(macro.macro_type)} text-white rounded-xl font-medium text-sm transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            title={macro.description}
        >
            <div className="flex items-center justify-center">
                {getMacroIcon(macro.macro_type)}
            </div>
            <span>{macro.name}</span>
        </button>
    );
} 