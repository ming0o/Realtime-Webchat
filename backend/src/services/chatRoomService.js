const { pool } = require('../config/database');

class ChatRoomService {
    async createChatRoom(userId) {
        try {
            const [result] = await pool.execute(
                'INSERT INTO chat_rooms (user_id) VALUES (?)',
                [userId]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error creating chat room:', error);
            throw error;
        }
    }

    async getChatRoomById(roomId) {
        try {
            const [rows] = await pool.execute(`
        SELECT cr.*, u.nickname, u.social_type 
        FROM chat_rooms cr 
        JOIN users u ON cr.user_id = u.id 
        WHERE cr.id = ?
      `, [roomId]);
            return rows[0];
        } catch (error) {
            console.error('Error getting chat room by ID:', error);
            throw error;
        }
    }

    async getChatRoomByUserId(userId) {
        try {
            const [rows] = await pool.execute(`
        SELECT cr.*, u.nickname, u.social_type 
        FROM chat_rooms cr 
        JOIN users u ON cr.user_id = u.id 
        WHERE cr.user_id = ?
      `, [userId]);
            return rows[0];
        } catch (error) {
            console.error('Error getting chat room by user ID:', error);
            throw error;
        }
    }

    async getAllChatRooms() {
        try {
            const [rows] = await pool.execute(`
        SELECT cr.*, u.nickname, u.social_type 
        FROM chat_rooms cr 
        JOIN users u ON cr.user_id = u.id 
        ORDER BY cr.created_at DESC
      `);
            return rows;
        } catch (error) {
            console.error('Error getting all chat rooms:', error);
            throw error;
        }
    }

    async deleteChatRoom(roomId) {
        try {
            await pool.execute('DELETE FROM chat_rooms WHERE id = ?', [roomId]);
            return true;
        } catch (error) {
            console.error('Error deleting chat room:', error);
            throw error;
        }
    }
}

module.exports = new ChatRoomService(); 