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
                    _id: message._id,
                    id: message._id,
                    chat_room_id: chatRoomId,
                    sender_type: senderType || "USER",
                    content,
                    message_type: messageType || "TEXT",
                    read: false,
                    createdAt: message.createdAt,
                    updatedAt: message.updatedAt,
                    chatRoom,
                };

                io.to(`room_${chatRoomId}`).emit("user_message", messageData);
                console.log(`메시지 전송 성공: ID ${message._id}`);
            } catch (err) {
                console.error("메시지 전송 오류:", err);
                socket.emit("error", "메시지 전송 실패");
            }
        });

        // 관리자 전용 이벤트
        socket.on("admin_join", () => {
            socket.join("admin_room");
            console.log(`관리자 ${socket.id} 접속`);
        });

        socket.on("admin_leave", () => {
            socket.leave("admin_room");
            console.log(`관리자 ${socket.id} 퇴장`);
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
