import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

interface ThemeColors {
    // 배경색
    background: string;
    surface: string;
    surfaceSecondary: string;

    // 텍스트 색상
    text: string;
    textSecondary: string;
    textTertiary: string;

    // 주요 색상
    primary: string;
    primaryLight: string;
    secondary: string;

    // 상태 색상
    success: string;
    warning: string;
    error: string;

    // 구분선
    border: string;
    borderLight: string;

    // 입력 필드
    inputBackground: string;
    inputBorder: string;
    inputText: string;

    // 버튼
    buttonPrimary: string;
    buttonSecondary: string;
    buttonText: string;

    // 메시지 버블
    messageBubbleUser: string;
    messageBubbleBot: string;
    messageBubbleAdmin: string;
    messageTextUser: string;
    messageTextBot: string;
    messageTextAdmin: string;
}

interface ThemeContextType {
    isDarkMode: boolean;
    toggleTheme: () => void;
    colors: ThemeColors;
}

const lightColors: ThemeColors = {
    background: '#F2F2F7',
    surface: '#FFFFFF',
    surfaceSecondary: '#F8F9FA',

    text: '#000000',
    textSecondary: '#6C757D',
    textTertiary: '#ADB5BD',

    primary: '#007AFF',
    primaryLight: '#E3F2FD',
    secondary: '#6C757D',

    success: '#28A745',
    warning: '#FFC107',
    error: '#DC3545',

    border: '#E5E5EA',
    borderLight: '#F0F0F0',

    inputBackground: '#FFFFFF',
    inputBorder: '#E5E5EA',
    inputText: '#000000',

    buttonPrimary: '#007AFF',
    buttonSecondary: '#6C757D',
    buttonText: '#FFFFFF',

    messageBubbleUser: '#007AFF',
    messageBubbleBot: '#E8F5E8',
    messageBubbleAdmin: '#E3F2FD',
    messageTextUser: '#FFFFFF',
    messageTextBot: '#000000',
    messageTextAdmin: '#000000',
};

const darkColors: ThemeColors = {
    background: '#1A1A1A',
    surface: '#2C2C2E',
    surfaceSecondary: '#3A3A3C',

    text: '#FFFFFF',
    textSecondary: '#ADB5BD',
    textTertiary: '#6C757D',

    primary: '#0A84FF',
    primaryLight: '#1C1C1E',
    secondary: '#ADB5BD',

    success: '#30D158',
    warning: '#FFD60A',
    error: '#FF453A',

    border: '#38383A',
    borderLight: '#48484A',

    inputBackground: '#2C2C2E',
    inputBorder: '#38383A',
    inputText: '#FFFFFF',

    buttonPrimary: '#0A84FF',
    buttonSecondary: '#48484A',
    buttonText: '#FFFFFF',

    messageBubbleUser: '#0A84FF',
    messageBubbleBot: '#2C2C2E',
    messageBubbleAdmin: '#1C1C1E',
    messageTextUser: '#FFFFFF',
    messageTextBot: '#FFFFFF',
    messageTextAdmin: '#FFFFFF',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

    // 시스템 테마 변경 감지
    useEffect(() => {
        setIsDarkMode(systemColorScheme === 'dark');
    }, [systemColorScheme]);

    const toggleTheme = () => {
        setIsDarkMode(prev => !prev);
    };

    const colors = isDarkMode ? darkColors : lightColors;

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
