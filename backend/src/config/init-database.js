const { pool } = require('./database');

const initDatabase = async () => {
    try {
        const connection = await pool.getConnection();

        await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        social_type ENUM('KAKAO', 'GUEST') NOT NULL,
        social_id VARCHAR(255) NULL,
        nickname VARCHAR(100) NOT NULL,
        token VARCHAR(500) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        await connection.execute(`
        CREATE TABLE IF NOT EXISTS chat_rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

        await connection.execute(`
        CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chat_room_id INT NOT NULL,
        sender_type ENUM('USER', 'ADMIN') NOT NULL,
        content TEXT NOT NULL,
        message_type ENUM('TEXT', 'IMAGE') DEFAULT 'TEXT',
        \`read\` BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE
      )
    `);

        connection.release();
        console.log('데이터베이스가 정상적으로 초기화되었습니다.');
    } catch (error) {
        console.error('데이터베이스 초기화 실패:', error.message);
        throw error;
    }
};

module.exports = { initDatabase }; 