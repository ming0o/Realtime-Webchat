const http = require("http");
const dotenv = require("dotenv");
const app = require("./app");
const { testConnection } = require("./config/database");
const { initDatabase } = require("./config/init-database");
const { connectMongoDB, } = require("./config/mongodb");
const { setupSocket } = require("./socket");

dotenv.config();

const PORT = process.env.PORT || 8080;
const server = http.createServer(app);
const io = setupSocket(server); // socket.io 연결 설정 및 인스턴스 반환

// 전역으로 소켓 인스턴스 사용 가능하도록 설정
global.io = io;

async function startServer() {
    try {
        await testConnection();
        await initDatabase();
        await connectMongoDB();

        server.listen(PORT, () => {
            console.log(`서버가 http://localhost:${PORT} 에서 실행중입니다.`);
        });
    } catch (err) {
        console.error("DB 연결 또는 서버 시작 실패:", err);
        process.exit(1);
    }
}

startServer();
