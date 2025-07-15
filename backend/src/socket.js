const { Server } = require("socket.io");
const chatRoomService = require("./services/chatRoomService");
const messageService = require("./services/messageService");

function setupSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: process.env.SOCKET_CORS_ORIGIN || "*",
        },
    });

    io.on("connection", (socket) => {
        console.log("새 클라이언트 접속:", socket.id);

        socket.on("join_room", ({ chatRoomId }) => {
            socket.join(`room_${chatRoomId}`);
            console.log(`클라이언트 ${socket.id}가 채팅방 ${chatRoomId}에 참여함`);
        });

        socket.on("leave_room", ({ chatRoomId }) => {
            socket.leave(`room_${chatRoomId}`);
            console.log(`클라이언트 ${socket.id}가 채팅방 ${chatRoomId}에서 나감`);
        });

        socket.on("user_message", async ({ chatRoomId, senderType, content, messageType }) => {
            try {
                const chatRoom = await chatRoomService.getChatRoomById(chatRoomId);
                if (!chatRoom) {
                    socket.emit("error", `채팅방 ${chatRoomId}를 찾을 수 없습니다.`);
                    return;
                }

                const message = await messageService.createMessage({
                    chat_room_id: chatRoomId,
                    sender_type: senderType || "USER",
                    content,
                    message_type: messageType || "TEXT",
                });

                const messageData = {
                    id: message.id,
                    chatRoomId,
                    senderType: senderType || "USER",
                    content,
                    messageType: messageType || "TEXT",
                    read: false,
                    timestamp: new Date(),
                    chatRoom,
                };

                io.to(`room_${chatRoomId}`).emit("user_message", messageData);
                console.log(`메시지 전송 성공: ID ${message.id}`);
            } catch (err) {
                console.error("메시지 전송 오류:", err);
                socket.emit("error", "메시지 전송 실패");
            }
        });
    });
}

module.exports = { setupSocket };
