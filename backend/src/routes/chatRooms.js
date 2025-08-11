const express = require("express");
const router = express.Router();
const chatRoomService = require("../services/chatRoomService");
const messageService = require("../services/messageServiceMongo");
const aiService = require("../services/aiService");

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
        const roomId = req.params.roomId;
        const messages = await messageService.getMessagesByRoomId(roomId);
        res.json(messages);
    } catch (error) {
        console.error('chatRooms.js - 메시지 조회 실패:', error);
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
            global.io.to(`room_${req.params.roomId}`).emit('user_message', messageData);
        }

        res.json({ success: true, connectionMessage: message });
    } catch (error) {
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
        res.status(500).json({ error: "채팅방 상태 업데이트 실패" });
    }
});

/**
 * @swagger
 * /api/chat-rooms/bulk-status:
 *   patch:
 *     summary: 채팅방 일괄 상태 업데이트
 *     description: 여러 채팅방의 상태를 일괄적으로 업데이트합니다.
 *     tags: [ChatRooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomIds
 *               - status
 *             properties:
 *               roomIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: 업데이트할 채팅방 ID 목록
 *               status:
 *                 type: string
 *                 enum: [접수, 응대, 종료, 보류]
 *                 description: 변경할 상태
 *     responses:
 *       200:
 *         description: 일괄 상태 업데이트 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 처리 성공 여부
 *                 updatedCount:
 *                   type: integer
 *                   description: 업데이트된 채팅방 수
 *       400:
 *         description: 잘못된 요청
 *       500:
 *         description: 서버 오류
 */
// 채팅방 일괄 상태 업데이트
router.patch("/bulk-status", async (req, res) => {
    try {
        const { roomIds, status } = req.body;

        if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0) {
            return res.status(400).json({ error: "roomIds는 필수이며 배열이어야 합니다." });
        }

        if (!status) {
            return res.status(400).json({ error: "status는 필수입니다." });
        }

        const updatedCount = await chatRoomService.updateBulkChatRoomStatus(roomIds, status);

        // 상태 변경 시 관리자에게 알림
        if (global.io) {
            roomIds.forEach(roomId => {
                global.io.emitChatRoomStatusChange(roomId, status);
            });
        }

        res.json({
            success: true,
            updatedCount,
            message: `${updatedCount}개의 채팅방 상태가 변경되었습니다.`
        });
    } catch (error) {
        console.error('일괄 상태 업데이트 실패:', error);
        res.status(500).json({ error: "채팅방 일괄 상태 업데이트 실패" });
    }
});

/**
 * @swagger
 * /api/chat-rooms/bot-response:
 *   post:
 *     summary: 챗봇 응답 요청
 *     description: 사용자 메시지에 대한 챗봇 응답을 생성합니다.
 *     tags: [ChatRooms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userMessage
 *             properties:
 *               userMessage:
 *                 type: string
 *                 description: 사용자 메시지
 *     responses:
 *       200:
 *         description: 챗봇 응답 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 챗봇 응답 메시지
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: 추천 응답 옵션들
 *       500:
 *         description: 서버 오류
 */
// 챗봇 응답 요청
router.post("/bot-response", async (req, res) => {
    try {
        const { userMessage } = req.body;

        // 빈 메시지이거나 초기 메시지인 경우 기본 응답
        if (!userMessage || userMessage.trim() === '') {
            return res.json({
                message: '안녕하세요! 안내 챗봇입니다. 무엇을 도와드릴까요?',
                suggestions: ['버그 신고', '전화번호 안내', '상담원 연결']
            });
        }

        // 사용자 메시지에 따른 응답
        if (userMessage.includes('버그') || userMessage.includes('오류')) {
            return res.json({
                message: '버그 신고는 아래 양식을 통해 남겨주세요. 이메일: support@yourapp.com',
                suggestions: ['처음으로']
            });
        }

        if (userMessage.includes('전화번호') || userMessage.includes('연락처')) {
            return res.json({
                message: '고객센터 전화번호는 1588-1234입니다. 평일 오전 9시~오후 6시까지 운영됩니다.',
                suggestions: ['처음으로']
            });
        }

        if (userMessage.includes('상담원') || userMessage.includes('연결')) {
            return res.json({
                message: '산업안전 보건법에 따른 고객응대 근로자 보호 조치가 시행되고 있습니다. 폭언 및 욕설 시 상담 진행이 어렵습니다. 상담원을 연결해 드리겠습니다. 잠시만 기다려 주세요. 업무시간은 평일 오전 9시~오후 6시입니다. 감사합니다.',
                suggestions: []
            });
        }

        // 기본 응답
        return res.json({
            message: '안녕하세요. 안내 챗봇입니다. 도움이 필요하신가요?',
            suggestions: ['버그 신고', '전화번호 안내', '상담원 연결']
        });

    } catch (error) {
        res.status(500).json({ error: "챗봇 응답 생성 실패" });
    }
});

/**
 * @swagger
 * /api/chat-rooms/{roomId}/analyze:
 *   post:
 *     summary: AI 대화 분석 및 답변 추천
 *     description: 채팅방의 대화 내용을 분석하여 상담사에게 적절한 답변을 추천합니다.
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
 *             properties:
 *               context:
 *                 type: string
 *                 description: 추가 컨텍스트 정보 (선택사항)
 *     responses:
 *       200:
 *         description: AI 분석 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 analysis:
 *                   type: object
 *                   properties:
 *                     sentiment:
 *                       type: string
 *                       description: 고객 감정 상태
 *                     urgency:
 *                       type: string
 *                       description: 긴급도 레벨
 *                     category:
 *                       type: string
 *                       description: 문의 카테고리
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [macro, custom, transfer]
 *                       content:
 *                         type: string
 *                       confidence:
 *                         type: number
 *                       reason:
 *                         type: string
 *       500:
 *         description: 서버 오류
 */
// AI 대화 분석 및 답변 추천
router.post("/:roomId/analyze", async (req, res) => {
    try {
        const { roomId } = req.params;
        const { context } = req.body;

        // 1. 채팅방의 최근 메시지들 조회 (최근 10개)
        const messages = await messageService.getMessagesByRoomId(roomId);
        const recentMessages = messages.slice(-10);

        // 2. 대화 내용을 AI 분석용 텍스트로 변환
        const conversationText = recentMessages
            .map(msg => `${msg.sender_type}: ${msg.content}`)
            .join('\n');

        // 3. AI 분석 서비스 호출
        const analysisResult = await aiService.analyzeConversation(conversationText, context);

        // 4. 분석 결과를 바탕으로 답변 추천 생성
        const recommendations = await aiService.generateRecommendations(analysisResult, roomId);

        res.json({
            analysis: analysisResult,
            recommendations
        });

    } catch (error) {
        console.error('AI 분석 실패:', error);
        res.status(500).json({ error: "AI 분석에 실패했습니다." });
    }
});



module.exports = router;
