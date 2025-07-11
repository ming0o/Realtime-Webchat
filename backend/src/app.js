const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const dotenv = require("dotenv");

// Database imports
const { testConnection } = require("./config/database");
const { initDatabase } = require("./config/init-database");
const userService = require("./services/userService");
const chatRoomService = require("./services/chatRoomService");
const messageService = require("./services/messageService");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.SOCKET_CORS_ORIGIN || "*",
    },
});

// ✅ 기본 페이지 핸들러
app.get("/", (req, res) => {
    res.send("서버가 정상 작동하고 있습니다!");
});

// API Routes - Users
app.post("/api/users", async (req, res) => {
    try {
        const { socialType, nickname, socialId, token } = req.body;
        const userId = await userService.createUser(socialType, nickname, socialId, token);

        // Create chat room for new user
        const chatRoomId = await chatRoomService.createChatRoom(userId);

        res.json({
            userId,
            chatRoomId,
            message: "사용자가 성공적으로 생성되었습니다."
        });
    } catch (error) {
        res.status(500).json({ error: "사용자 생성에 실패했습니다." });
    }
});

app.get("/api/users/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await userService.getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "사용자 정보를 가져오는데 실패했습니다." });
    }
});

// API Routes - Chat Rooms
app.get("/api/chat-rooms", async (req, res) => {
    try {
        const chatRooms = await chatRoomService.getAllChatRooms();
        res.json(chatRooms);
    } catch (error) {
        res.status(500).json({ error: "채팅방 목록을 가져오는데 실패했습니다." });
    }
});

app.get("/api/chat-rooms/:roomId", async (req, res) => {
    try {
        const { roomId } = req.params;
        const chatRoom = await chatRoomService.getChatRoomById(roomId);
        if (!chatRoom) {
            return res.status(404).json({ error: "채팅방을 찾을 수 없습니다." });
        }
        res.json(chatRoom);
    } catch (error) {
        res.status(500).json({ error: "채팅방 정보를 가져오는데 실패했습니다." });
    }
});

// API Routes - Messages
app.get("/api/messages/:chatRoomId", async (req, res) => {
    try {
        const { chatRoomId } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        const messages = await messageService.getMessages(chatRoomId, parseInt(limit), parseInt(offset));
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: "메시지를 가져오는데 실패했습니다." });
    }
});

app.post("/api/messages/:chatRoomId/read", async (req, res) => {
    try {
        const { chatRoomId } = req.params;
        await messageService.markAllMessagesAsRead(chatRoomId);
        res.json({ message: "메시지가 읽음으로 표시되었습니다." });
    } catch (error) {
        res.status(500).json({ error: "메시지 상태 업데이트에 실패했습니다." });
    }
});

io.on("connection", (socket) => {
    console.log("새 클라이언트 접속:", socket.id);

    socket.on("user_message", async (data) => {
        try {
            const { chatRoomId, senderType, content, messageType } = data;

            // Save message to database
            const messageId = await messageService.saveMessage(
                chatRoomId,
                senderType || 'USER',
                content,
                messageType || 'TEXT'
            );

            // Get chat room info
            const chatRoom = await chatRoomService.getChatRoomById(chatRoomId);

            // Emit message with chat room info
            const messageData = {
                id: messageId,
                chatRoomId,
                senderType: senderType || 'USER',
                content,
                messageType: messageType || 'TEXT',
                read: false,
                timestamp: new Date(),
                chatRoom
            };

            io.emit("user_message", messageData);
        } catch (error) {
            console.error("메시지 저장 오류:", error);
            socket.emit("error", "메시지 전송에 실패했습니다.");
        }
    });

    socket.on("join_room", async (data) => {
        try {
            const { chatRoomId } = data;
            socket.join(`room_${chatRoomId}`);
            console.log(`클라이언트 ${socket.id}가 채팅방 ${chatRoomId}에 참여했습니다.`);
        } catch (error) {
            console.error("채팅방 참여 오류:", error);
        }
    });

    socket.on("leave_room", (data) => {
        try {
            const { chatRoomId } = data;
            socket.leave(`room_${chatRoomId}`);
            console.log(`클라이언트 ${socket.id}가 채팅방 ${chatRoomId}에서 나갔습니다.`);
        } catch (error) {
            console.error("채팅방 나가기 오류:", error);
        }
    });
});

const PORT = process.env.PORT || 3000;

// Initialize database and start server
async function startServer() {
    try {
        await testConnection();
        await initDatabase();

        server.listen(PORT, () => {
            console.log(`✅ 서버가 http://localhost:${PORT} 에서 실행중입니다.`);
        });
    } catch (error) {
        console.error("❌ 서버 시작 실패:", error);
        process.exit(1);
    }
}

startServer();
