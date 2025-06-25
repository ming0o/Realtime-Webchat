const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

// ✅ 기본 페이지 핸들러
app.get("/", (req, res) => {
    res.send("서버가 정상 작동하고 있습니다!");
});

io.on("connection", (socket) => {
    console.log("새 클라이언트 접속:", socket.id);

    socket.on("user_message", (data) => {
        console.log(data);
        io.emit("user_message", data);
    });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행중입니다.` );
});
