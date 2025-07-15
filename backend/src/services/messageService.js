const { pool } = require('../config/database');

class MessageService {
    // 채팅방 목록 조회
    async getAllChatRooms() {
        try {
            const [rows] = await pool.execute(`
                SELECT cr.*, u.nickname, u.social_type,
                    (SELECT COUNT(*) FROM messages WHERE chat_room_id = cr.id) as message_count
                FROM chat_rooms cr
                LEFT JOIN users u ON cr.user_id = u.id
                ORDER BY cr.created_at DESC
            `);
            return rows;
        } catch (error) {
            console.error('Error getting chat rooms:', error);
            throw error;
        }
    }

    async getAllData() {
        try {
            const [users] = await pool.execute('SELECT * FROM users ORDER BY created_at DESC');
            const [chatRooms] = await pool.execute('SELECT * FROM chat_rooms ORDER BY created_at DESC');
            const [messages] = await pool.execute('SELECT * FROM messages ORDER BY created_at DESC');

            return {
                users,
                chatRooms,
                messages,
                summary: {
                    totalUsers: users.length,
                    totalChatRooms: chatRooms.length,
                    totalMessages: messages.length
                }
            };
        } catch (error) {
            throw error;
        }
    }

    // 메시지 생성
    async createMessage(messageData) {
        try {
            const { chat_room_id, sender_type, content, message_type = 'TEXT' } = messageData;

            const [result] = await pool.execute(
                'INSERT INTO messages (chat_room_id, sender_type, content, message_type) VALUES (?, ?, ?, ?)',
                [chat_room_id, sender_type, content, message_type]
            );

            // 생성된 메시지 조회
            const [rows] = await pool.execute(
                'SELECT * FROM messages WHERE id = ?',
                [result.insertId]
            );

            return rows[0];
        } catch (error) {
            console.error('Error creating message:', error);
            throw error;
        }
    }

    // 특정 채팅방의 메시지 조회
    async getMessagesByRoomId(roomId) {
        try {
            const [rows] = await pool.execute(`
                SELECT * FROM messages
                WHERE chat_room_id = ?
                ORDER BY created_at ASC
            `, [roomId]);
            return rows;
        } catch (error) {
            console.error('Error getting messages by room ID:', error);
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
            console.error('삭제 오류:', error);
            throw error;
        }
    }
}

module.exports = new MessageService();
