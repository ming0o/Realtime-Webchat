const { Server } = require("socket.io");
const chatRoomService = require("./services/chatRoomService");
const messageService = require("./services/messageServiceMongo");

function setupSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: process.env.SOCKET_CORS_ORIGIN || "*",
        },
    });

    io.on("connection", (socket) => {
        socket.on("join_room", ({ chatRoomId }) => {
            socket.join(`room_${chatRoomId}`);
        });

        socket.on("leave_room", ({ chatRoomId }) => {
            socket.leave(`room_${chatRoomId}`);
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
                    _id: message._id,
                    id: message._id,
                    chat_room_id: chatRoomId,
                    sender_type: senderType || "USER",
                    content,
                    message_type: messageType || "TEXT",
                    read: false,
                    createdAt: message.createdAt || new Date().toISOString(),
                    updatedAt: message.updatedAt || new Date().toISOString(),
                    chatRoom,
                };

                io.to(`room_${chatRoomId}`).emit("user_message", messageData);
            } catch (err) {
                socket.emit("error", "메시지 전송 실패");
            }
        });

        // 관리자 전용 이벤트
        socket.on("admin_join", () => {
            socket.join("admin_room");
        });

        socket.on("admin_leave", () => {
            socket.leave("admin_room");
        });

        // Typing indicator 이벤트
        socket.on("typing", ({ chatRoomId, userType }) => {
            // 유효한 userType인지 확인
            const validUserTypes = ['USER', 'ADMIN', 'BOT', 'CLIENT', 'USER_STOP', 'CLIENT_STOP'];
            if (!validUserTypes.includes(userType)) {
                return;
            }
            // 같은 방에 있는 다른 사람들에게만 broadcast (자신 제외)
            socket.to(`room_${chatRoomId}`).emit("typing", { chatRoomId, userType });
        });
    });

    // 전역 함수로 소켓 이벤트 발생 함수들 추가
    io.emitNewChatRoom = (chatRoom) => {
        io.to("admin_room").emit("new_chat_room", chatRoom);
    };

    io.emitChatRoomStatusChange = (roomId, status) => {
        io.to("admin_room").emit("chat_room_status_change", { roomId, status });
    };

    return io;
}

module.exports = { setupSocket };