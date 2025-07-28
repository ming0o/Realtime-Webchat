const express = require("express");
const router = express.Router();
const macroService = require("../services/macroService");

// 매크로 멘트 조회
router.get("/:macroType", async (req, res) => {
    try {
        const { macroType } = req.params;
        const template = await macroService.getMacroTemplate(macroType);

        if (!template) {
            return res.status(400).json({
                error: "매크로를 찾을 수 없습니다. 사용 가능한 타입: off-hours, lunch-time, holiday"
            });
        }

        res.json({
            macroType: template.macro_type,
            name: template.name,
            description: template.description,
            content: template.content,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({ error: "매크로 조회 실패" });
    }
});

// 모든 매크로 템플릿 조회
router.get("/", async (req, res) => {
    try {
        const templates = await macroService.getAllMacroTemplates();
        res.json({ templates });

    } catch (error) {
        res.status(500).json({ error: "매크로 목록 조회 실패" });
    }
});

// 매크로 사용
router.post("/:macroType/use", async (req, res) => {
    try {
        const { macroType } = req.params;
        const { chatRoomId, usedBy = 'ADMIN' } = req.body;

        if (!chatRoomId) {
            return res.status(400).json({ error: "chatRoomId는 필수입니다." });
        }

        const result = await macroService.useMacro(chatRoomId, macroType, usedBy);
        res.json(result);

    } catch (error) {
        res.status(500).json({ error: error.message || "매크로 사용 실패" });
    }
});



module.exports = router; 