import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface QuickReplyButtonProps {
    text: string;
    onPress: () => void;
}

export default function QuickReplyButton({ text, onPress }: QuickReplyButtonProps) {
    return (
        <TouchableOpacity style={styles.button} onPress={onPress}>
            <Text style={styles.buttonText}>{text}</Text>
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
