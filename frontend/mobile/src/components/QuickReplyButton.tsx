import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface QuickReplyButtonProps {
    text: string;
    onPress: () => void;
}

export default function QuickReplyButton({ text, onPress }: QuickReplyButtonProps) {
    const { colors } = useTheme();

    return (
        <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={onPress}
        >
            <Text style={[styles.buttonText, { color: colors.buttonText }]}>{text}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        marginHorizontal: 4,
        marginVertical: 2,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },
});
