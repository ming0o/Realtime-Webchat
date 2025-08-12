const { pool } = require('../config/database');
const messageService = require('./messageServiceMongo');

class ChatRoomService {
    async createChatRoom(userId) {
        try {
            const [result] = await pool.execute(
                'INSERT INTO chat_rooms (user_id) VALUES (?)',
                [userId]
            );

            // 생성된 채팅방 정보 조회
            const [rows] = await pool.execute(`
                SELECT cr.*, u.nickname, u.social_type 
                FROM chat_rooms cr 
                JOIN users u ON cr.user_id = u.id 
                WHERE cr.id = ?
            `, [result.insertId]);

            return rows[0];
        } catch (error) {
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
            throw error;
        }
    }

    async getAllChatRoomsWithDetails() {
        try {
            const [rows] = await pool.execute(`
                SELECT cr.*, u.nickname, u.social_type 
                FROM chat_rooms cr 
                JOIN users u ON cr.user_id = u.id 
                ORDER BY cr.created_at DESC
            `);

            // 각 채팅방에 대한 메시지 정보와 읽지 않은 메시지 수 추가
            const chatRoomsWithDetails = await Promise.all(
                rows.map(async (chatRoom) => {
                    try {
                        const messages = await messageService.getMessagesByRoomId(chatRoom.id);
                        const unreadCount = messages.filter(msg => !msg.read && msg.sender_type === 'USER').length;
                        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

                        return {
                            ...chatRoom,
                            unread_count: unreadCount,
                            last_message: lastMessage ? lastMessage.content : null,
                            status: chatRoom.status || '접수'
                        };
                    } catch (error) {
                        return {
                            ...chatRoom,
                            unread_count: 0,
                            last_message: null,
                            status: chatRoom.status || '접수'
                        };
                    }
                })
            );

            return chatRoomsWithDetails;
        } catch (error) {
            throw error;
        }
    }

    async updateChatRoomStatus(roomId, status) {
        try {
            const [result] = await pool.execute(
                'UPDATE chat_rooms SET status = ? WHERE id = ?',
                [status, roomId]
            );

            if (result.affectedRows === 0) {
                return null;
            }

            // 업데이트된 채팅방 정보 조회
            return await this.getChatRoomById(roomId);
        } catch (error) {
            throw error;
        }
    }

    async updateBulkChatRoomStatus(roomIds, status) {
        try {
            if (!Array.isArray(roomIds) || roomIds.length === 0) {
                throw new Error('roomIds는 필수이며 배열이어야 합니다.');
            }

            // IN 절을 사용하여 일괄 업데이트
            const placeholders = roomIds.map(() => '?').join(',');
            const [result] = await pool.execute(
                `UPDATE chat_rooms SET status = ? WHERE id IN (${placeholders})`,
                [status, ...roomIds]
            );

            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }

    async deleteChatRoom(roomId) {
        try {
            await pool.execute('DELETE FROM chat_rooms WHERE id = ?', [roomId]);
            return true;
        } catch (error) {
            throw error;
        }
    }

    async deleteBulkChatRooms(roomIds) {
        try {
            if (!Array.isArray(roomIds) || roomIds.length === 0) {
                throw new Error('roomIds는 필수이며 배열이어야 합니다.');
            }

            // IN 절을 사용하여 일괄 삭제
            const placeholders = roomIds.map(() => '?').join(',');
            const [result] = await pool.execute(
                `DELETE FROM chat_rooms WHERE id IN (${placeholders})`,
                roomIds
            );

            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new ChatRoomService(); 