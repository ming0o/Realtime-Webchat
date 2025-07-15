const express = require("express");
const router = express.Router();
const messageService = require("../services/messageService");

/**
 * @swagger
 * /api/messages/{chatRoomId}:
 *   get:
 *     summary: 채팅방 메시지 목록 조회
 *     description: 특정 채팅방의 모든 메시지를 조회합니다.
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: chatRoomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 채팅방 ID
 *     responses:
 *       200:
 *         description: 메시지 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       500:
 *         description: 서버 오류
 */
// 특정 채팅방의 메시지 목록 조회
router.get("/:chatRoomId", async (req, res) => {
    try {
        const { chatRoomId } = req.params;
        const messages = await messageService.getMessagesByRoomId(chatRoomId);

        res.json(messages);
    } catch (error) {
        console.error("메시지 조회 실패:", error);
        res.status(500).json({ error: "메시지 목록 조회 실패" });
    }
});

/**
 * @swagger
 * /api/messages/{messageId}:
 *   delete:
 *     summary: 메시지 삭제
 *     description: 특정 메시지를 삭제합니다.
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 메시지 ID
 *     responses:
 *       200:
 *         description: 메시지 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 삭제 성공 여부
 *       500:
 *         description: 서버 오류
 */
// 단일 메시지 삭제
router.delete("/:messageId", async (req, res) => {
    try {
        await messageService.deleteMessage(req.params.messageId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "메시지 삭제 실패" });
    }
});

module.exports = router;
