const Message = require('../models/Message');

class MessageServiceMongo {
    // 채팅방별 메시지 조회
    async getMessagesByRoomId(chatRoomId) {
        try {
            const messages = await Message.find({ chat_room_id: chatRoomId })
                .sort({ createdAt: 1 })
                .lean();
            return messages;
        } catch (error) {
            console.error('Error getting messages by room ID:', error);
            throw error;
        }
    }

    // 메시지 생성
    async createMessage(messageData) {
        try {
            const { chat_room_id, sender_type, content, message_type = 'TEXT' } = messageData;

            const message = new Message({
                chat_room_id,
                sender_type,
                content,
                message_type
            });

            const savedMessage = await message.save();
            return savedMessage.toJSON();
        } catch (error) {
            console.error('Error creating message:', error);
            throw error;
        }
    }

    // 메시지 읽음 처리
    async markAllMessagesAsRead(chatRoomId) {
        try {
            await Message.updateMany(
                { chat_room_id: chatRoomId, read: false },
                { read: true }
            );
            return true;
        } catch (error) {
            console.error('Error marking messages as read:', error);
            throw error;
        }
    }

    // 특정 메시지 조회
    async getMessageById(messageId) {
        try {
            const message = await Message.findById(messageId).lean();
            return message;
        } catch (error) {
            console.error('Error getting message by ID:', error);
            throw error;
        }
    }

    // 채팅방별 메시지 개수 조회
    async getMessageCountByRoomId(chatRoomId) {
        try {
            const count = await Message.countDocuments({ chat_room_id: chatRoomId });
            return count;
        } catch (error) {
            console.error('Error getting message count:', error);
            throw error;
        }
    }

    // 최근 메시지 조회
    async getRecentMessages(limit = 50) {
        try {
            const messages = await Message.find()
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean();
            return messages;
        } catch (error) {
            console.error('Error getting recent messages:', error);
            throw error;
        }
    }

    // 메시지 삭제 (관리자용)
    async deleteMessage(messageId) {
        try {
            const result = await Message.findByIdAndDelete(messageId);
            return result;
        } catch (error) {
            console.error('Error deleting message:', error);
            throw error;
        }
    }
}

module.exports = new MessageServiceMongo(); 