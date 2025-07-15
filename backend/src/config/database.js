const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'realtime_webchat',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('데이터베이스가 정상적으로 연결되었습니다.');
        connection.release();
    } catch (error) {
        console.error('데이터베이스 연결 실패:', error.message);
        process.exit(1);
    }
};

module.exports = {
    pool,
    testConnection,
    dbConfig
}; 