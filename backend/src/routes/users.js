const express = require("express");
const router = express.Router();
const userService = require("../services/userService");
const chatRoomService = require("../services/chatRoomService");

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: 사용자 생성
 *     description: 새로운 사용자를 생성하고 채팅방을 함께 생성합니다.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - socialType
 *               - nickname
 *             properties:
 *               socialType:
 *                 type: string
 *                 enum: [KAKAO, GUEST]
 *                 description: 소셜 로그인 타입
 *               nickname:
 *                 type: string
 *                 description: 사용자 닉네임
 *               socialId:
 *                 type: string
 *                 description: 소셜 ID (선택사항)
 *               token:
 *                 type: string
 *                 description: 인증 토큰 (선택사항)
 *     responses:
 *       200:
 *         description: 사용자 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: integer
 *                   description: 생성된 사용자 ID
 *                 chatRoomId:
 *                   type: integer
 *                   description: 생성된 채팅방 ID
 *                 message:
 *                   type: string
 *                   description: 성공 메시지
 *       500:
 *         description: 서버 오류
 */
router.post("/", async (req, res) => {
    try {
        const { socialType, nickname, socialId, token } = req.body;
        const userId = await userService.createUser(socialType, nickname, socialId, token);
        const chatRoomId = await chatRoomService.createChatRoom(userId);
        res.json({ userId, chatRoomId, message: "사용자 생성 성공" });
    } catch (err) {
        res.status(500).json({ error: "사용자 생성 실패" });
    }
});

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: 사용자 정보 조회
 *     description: 특정 사용자의 정보를 조회합니다.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 사용자 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: 사용자를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await userService.getUserById(userId);
        if (!user) return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "정보 불러오기 실패" });
    }
});

module.exports = router;
