const { pool } = require('../config/database');

class UserService {
    async createUser(socialType, nickname, socialId = null, token = null) {
        try {
            const [result] = await pool.execute(
                'INSERT INTO users (social_type, social_id, nickname, token) VALUES (?, ?, ?, ?)',
                [socialType, socialId, nickname, token]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    async getUserById(userId) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM users WHERE id = ?',
                [userId]
            );
            return rows[0];
        } catch (error) {
            console.error('Error getting user by ID:', error);
            throw error;
        }
    }

    async getUserBySocialId(socialId, socialType) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM users WHERE social_id = ? AND social_type = ?',
                [socialId, socialType]
            );
            return rows[0];
        } catch (error) {
            console.error('Error getting user by social ID:', error);
            throw error;
        }
    }

    async updateUserToken(userId, token) {
        try {
            await pool.execute(
                'UPDATE users SET token = ? WHERE id = ?',
                [token, userId]
            );
            return true;
        } catch (error) {
            console.error('Error updating user token:', error);
            throw error;
        }
    }

    async getAllUsers() {
        try {
            const [rows] = await pool.execute('SELECT * FROM users ORDER BY created_at DESC');
            return rows;
        } catch (error) {
            console.error('Error getting all users:', error);
            throw error;
        }
    }
}

module.exports = new UserService(); 