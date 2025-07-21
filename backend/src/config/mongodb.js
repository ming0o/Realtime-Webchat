const mongoose = require('mongoose');
require('dotenv').config();

const mongoConfig = {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/realtime_webchat',
    options: {}
};

const connectMongoDB = async () => {
    try {
        await mongoose.connect(mongoConfig.uri, mongoConfig.options);
        console.log('MongoDB가 정상적으로 연결되었습니다.');
    } catch (error) {
        console.error('MongoDB 연결 실패:', error.message);
        process.exit(1);
    }
};

const testMongoConnection = async () => {
    try {
        const connection = mongoose.connection;
        if (connection.readyState === 1) {
            console.log('MongoDB 연결 상태: 정상');
        } else {
            console.log('MongoDB 연결 상태: 비정상');
        }
    } catch (error) {
        console.error('MongoDB 연결 테스트 실패:', error.message);
        throw error;
    }
};

module.exports = {
    connectMongoDB,
    testMongoConnection,
    mongoose
}; 