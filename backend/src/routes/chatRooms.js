const express = require("express");
const router = express.Router();
const chatRoomService = require("../services/chatRoomService");
const messageService = require("../services/messageServiceMongo");

/**
 * @swagger
 * /api/chat-rooms:
 *   get:
 *     summary: 채팅방 목록 조회
 *     description: 모든 채팅방 목록을 조회합니다.
 *     tags: [ChatRooms]
 *     responses:
 *       200:
 *         description: 채팅방 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ChatRoom'
 *       500:
 *         description: 서버 오류
 */
/**
 * @swagger
 * /api/chat-rooms:
 *   post:
 *     summary: 채팅방 생성
 *     description: 새로운 채팅방을 생성합니다.
 *     tags: [ChatRooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: 사용자 ID
 *     responses:
 *       201:
 *         description: 채팅방 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatRoom'
 *       500:
 *         description: 서버 오류
 */
// 채팅방 생성
router.post("/", async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: "userId는 필수입니다." });
        }

        const chatRoom = await chatRoomService.createChatRoom(userId);

        // 새 채팅방 생성 시 관리자에게 알림
        if (global.io) {
            global.io.emitNewChatRoom(chatRoom);
        }

        res.status(201).json(chatRoom);
    } catch (error) {
        console.error('채팅방 생성 실패:', error);
        res.status(500).json({ error: "채팅방 생성 실패" });
    }
});

// 채팅방 목록 조회
router.get("/", async (req, res) => {
    try {
        const chatRooms = await chatRoomService.getAllChatRoomsWithDetails();
        res.json(chatRooms);
    } catch (error) {
        res.status(500).json({ error: "채팅방 목록 조회 실패" });
    }
});

/**
 * @swagger
 * /api/chat-rooms/{roomId}:
 *   get:
 *     summary: 채팅방 상세 조회
 *     description: 특정 채팅방의 상세 정보를 조회합니다.
 *     tags: [ChatRooms]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 채팅방 ID
 *     responses:
 *       200:
 *         description: 채팅방 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatRoom'
 *       404:
 *         description: 채팅방을 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
// 채팅방 상세 조회
router.get("/:roomId", async (req, res) => {
    try {
        const chatRoom = await chatRoomService.getChatRoomById(req.params.roomId);
        if (!chatRoom) return res.status(404).json({ error: "채팅방 없음" });
        res.json(chatRoom);
    } catch (error) {
        res.status(500).json({ error: "채팅방 조회 실패" });
    }
});

/**
 * @swagger
 * /api/chat-rooms/{roomId}/messages:
 *   get:
 *     summary: 채팅방 메시지 조회
 *     description: 특정 채팅방의 모든 메시지를 조회합니다.
 *     tags: [ChatRooms]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 채팅방 ID
 *     responses:
 *       200:
 *         description: 메시지 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       500:
 *         description: 서버 오류
 */
// 특정 채팅방의 메시지 조회
router.get("/:roomId/messages", async (req, res) => {
    try {
        const messages = await messageService.getMessagesByRoomId(req.params.roomId);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: "메시지 조회 실패" });
    }
});

/**
 * @swagger
 * /api/chat-rooms/{roomId}/messages:
 *   post:
 *     summary: 메시지 생성
 *     description: 특정 채팅방에 새 메시지를 생성합니다.
 *     tags: [ChatRooms]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 채팅방 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sender_type
 *               - content
 *             properties:
 *               sender_type:
 *                 type: string
 *                 enum: [USER, ADMIN, BOT]
 *                 description: 발신자 타입
 *               content:
 *                 type: string
 *                 description: 메시지 내용
 *               message_type:
 *                 type: string
 *                 enum: [TEXT, IMAGE, FILE]
 *                 default: TEXT
 *                 description: 메시지 타입
 *     responses:
 *       201:
 *         description: 메시지 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       500:
 *         description: 서버 오류
 */
// 메시지 생성
router.post("/:roomId/messages", async (req, res) => {
    try {
        const { sender_type, content, message_type = "TEXT" } = req.body;
        const message = await messageService.createMessage({
            chat_room_id: req.params.roomId,
            sender_type,
            content,
            message_type,
        });
        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ error: "메시지 생성 실패" });
    }
});

/**
 * @swagger
 * /api/chat-rooms/{roomId}/messages/read:
 *   patch:
 *     summary: 메시지 읽음 처리
 *     description: 특정 채팅방의 모든 메시지를 읽음 처리합니다.
 *     tags: [ChatRooms]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 채팅방 ID
 *     responses:
 *       200:
 *         description: 읽음 처리 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 처리 성공 여부
 *       500:
 *         description: 서버 오류
 */
// 읽음 처리
router.patch("/:roomId/messages/read", async (req, res) => {
    try {
        await messageService.markAllMessagesAsRead(req.params.roomId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "읽음 처리 실패" });
    }
});

/**
 * @swagger
 * /api/chat-rooms/{roomId}/connect-agent:
 *   post:
 *     summary: 상담원 연결 요청
 *     description: 상담원 연결을 요청하고 봇 메시지를 생성합니다.
 *     tags: [ChatRooms]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 채팅방 ID
 *     responses:
 *       200:
 *         description: 상담원 연결 요청 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 요청 성공 여부
 *                 connectionMessage:
 *                   $ref: '#/components/schemas/Message'
 *       500:
 *         description: 서버 오류
 */
// 상담원 연결 요청
router.post("/:roomId/connect-agent", async (req, res) => {
    try {
        const message = await messageService.createMessage({
            chat_room_id: req.params.roomId,
            sender_type: "BOT",
            content: "상담원이 연결되었습니다. 잠시만 기다려 주세요.",
            message_type: "TEXT",
        });

        // 소켓으로 메시지 broadcast
        if (global.io) {
            const messageData = {
                _id: message._id,
                id: message._id,
                chat_room_id: req.params.roomId,
                sender_type: "BOT",
                content: "상담원이 연결되었습니다. 잠시만 기다려 주세요.",
                message_type: "TEXT",
                read: false,
                createdAt: message.createdAt || new Date().toISOString(),
                updatedAt: message.updatedAt || new Date().toISOString(),
            };
            console.log(`상담원 연결 메시지 broadcast: room_${req.params.roomId}`, messageData);
            global.io.to(`room_${req.params.roomId}`).emit('user_message', messageData);
        }

        res.json({ success: true, connectionMessage: message });
    } catch (error) {
        console.error('상담원 연결 실패:', error);
        res.status(500).json({ error: "상담원 연결 실패" });
    }
});

/**
 * @swagger
 * /api/chat-rooms/{roomId}/status:
 *   patch:
 *     summary: 채팅방 상태 업데이트
 *     description: 채팅방의 상태를 업데이트합니다.
 *     tags: [ChatRooms]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 채팅방 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [접수, 응대, 종료, 보류]
 *                 description: 채팅방 상태
 *     responses:
 *       200:
 *         description: 상태 업데이트 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatRoom'
 *       500:
 *         description: 서버 오류
 */
// 채팅방 상태 업데이트
router.patch("/:roomId/status", async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ error: "status는 필수입니다." });
        }

        const updatedChatRoom = await chatRoomService.updateChatRoomStatus(req.params.roomId, status);
        if (!updatedChatRoom) {
            return res.status(404).json({ error: "채팅방을 찾을 수 없습니다." });
        }

        // 상태 변경 시 관리자에게 알림
        if (global.io) {
            global.io.emitChatRoomStatusChange(req.params.roomId, status);
        }

        res.json(updatedChatRoom);
    } catch (error) {
        console.error('채팅방 상태 업데이트 실패:', error);
        res.status(500).json({ error: "채팅방 상태 업데이트 실패" });
    }
});

module.exports = router;
