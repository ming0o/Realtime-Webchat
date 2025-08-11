const { pool } = require('../config/database');
const messageService = require('./messageServiceMongo');

class MacroService {
    // 매크로 템플릿 조회 (특정 타입)
    async getMacroTemplate(macroType, senderType = 'ADMIN') {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM macro_templates WHERE macro_type = ? AND sender_type = ? AND is_active = TRUE',
                [macroType, senderType]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // 모든 매크로 템플릿 조회 (상담원용)
    async getAllMacroTemplates(senderType = 'ADMIN') {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM macro_templates WHERE sender_type = ? AND is_active = TRUE ORDER BY category, name',
                [senderType]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // 카테고리별 매크로 템플릿 조회
    async getMacroTemplatesByCategory(category, senderType = 'ADMIN') {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM macro_templates WHERE category = ? AND sender_type = ? AND is_active = TRUE ORDER BY name',
                [category, senderType]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // 봇 매크로 템플릿 조회
    async getBotMacroTemplates() {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM macro_templates WHERE sender_type = "BOT" AND is_active = TRUE ORDER BY category, name'
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // 매크로 사용 및 메시지 생성
    async useMacro(chatRoomId, macroType, usedBy = 'ADMIN') {
        try {
            // 매크로 템플릿 조회
            const template = await this.getMacroTemplate(macroType, usedBy);
            if (!template) {
                throw new Error(`매크로 타입 '${macroType}'을 찾을 수 없습니다.`);
            }

            // 상담사가 매크로를 사용할 때는 sender_type을 ADMIN으로 설정
            const senderType = usedBy === 'ADMIN' ? 'ADMIN' : template.sender_type;

            // MongoDB에 메시지 생성
            const message = await messageService.createMessage({
                chat_room_id: chatRoomId,
                sender_type: senderType,
                content: template.content,
                message_type: 'TEXT'
            });

            return {
                message,
                macroType,
                template: {
                    name: template.name,
                    description: template.description,
                    sender_type: senderType
                }
            };
        } catch (error) {
            throw error;
        }
    }

    // 새 매크로 템플릿 생성
    async createMacroTemplate(macroData) {
        try {
            const { macro_type, name, description, content, sender_type = 'ADMIN', category = 'general' } = macroData;

            const [result] = await pool.execute(
                'INSERT INTO macro_templates (macro_type, name, description, content, sender_type, category) VALUES (?, ?, ?, ?, ?, ?)',
                [macro_type, name, description, content, sender_type, category]
            );

            return { id: result.insertId, ...macroData };
        } catch (error) {
            throw error;
        }
    }

    // 매크로 템플릿 수정
    async updateMacroTemplate(id, macroData) {
        try {
            const { name, description, content, category, is_active } = macroData;

            const [result] = await pool.execute(
                'UPDATE macro_templates SET name = ?, description = ?, content = ?, category = ?, is_active = ? WHERE id = ?',
                [name, description, content, category, is_active, id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // 매크로 템플릿 삭제
    async deleteMacroTemplate(id) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM macro_templates WHERE id = ?',
                [id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new MacroService(); 