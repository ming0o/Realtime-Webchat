const { pool } = require('../config/database');

class MessageService {
    async saveMessage(chatRoomId, senderType, content, messageType = 'TEXT') {
        try {
            const [result] = await pool.execute(
                'INSERT INTO messages (chat_room_id, sender_type, content, message_type) VALUES (?, ?, ?, ?)',
                [chatRoomId, senderType, content, messageType]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error saving message:', error);
            throw error;
        }
    }

    async getMessages(chatRoomId, limit = 50, offset = 0) {
        try {
            const [rows] = await pool.execute(`
        SELECT m.*, cr.user_id, u.nickname, u.social_type 
        FROM messages m 
        JOIN chat_rooms cr ON m.chat_room_id = cr.id 
        JOIN users u ON cr.user_id = u.id 
        WHERE m.chat_room_id = ? 
        ORDER BY m.created_at ASC 
        LIMIT ? OFFSET ?
      `, [chatRoomId, limit, offset]);

            return rows;
        } catch (error) {
            console.error('Error getting messages:', error);
            throw error;
        }
    }

    async markMessageAsRead(messageId) {
        try {
            await pool.execute(
                'UPDATE messages SET read = TRUE WHERE id = ?',
                [messageId]
            );
            return true;
        } catch (error) {
            console.error('Error marking message as read:', error);
            throw error;
        }
    }

    async markAllMessagesAsRead(chatRoomId) {
        try {
            await pool.execute(
                'UPDATE messages SET read = TRUE WHERE chat_room_id = ?',
                [chatRoomId]
            );
            return true;
        } catch (error) {
            console.error('Error marking all messages as read:', error);
            throw error;
        }
    }

    async getUnreadMessageCount(chatRoomId) {
        try {
            const [rows] = await pool.execute(
                'SELECT COUNT(*) as count FROM messages WHERE chat_room_id = ? AND read = FALSE',
                [chatRoomId]
            );
            return rows[0].count;
        } catch (error) {
            console.error('Error getting unread message count:', error);
            throw error;
        }
    }

    async deleteMessage(messageId) {
        try {
            await pool.execute('DELETE FROM messages WHERE id = ?', [messageId]);
            return true;
        } catch (error) {
            console.error('Error deleting message:', error);
            throw error;
        }
    }
}

module.exports = new MessageService();
