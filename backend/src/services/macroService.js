const { pool } = require('../config/database');
const messageService = require('./messageServiceMongo');

class MacroService {
    // 매크로 템플릿 조회
    async getMacroTemplate(macroType) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM macro_templates WHERE macro_type = ? AND is_active = TRUE',
                [macroType]
            );
            return rows[0];
        } catch (error) {
            console.error('Error getting macro template:', error);
            throw error;
        }
    }

    // 모든 매크로 템플릿 조회
    async getAllMacroTemplates() {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM macro_templates WHERE is_active = TRUE ORDER BY macro_type'
            );
            return rows;
        } catch (error) {
            console.error('Error getting all macro templates:', error);
            throw error;
        }
    }

    // 매크로 사용 및 메시지 생성
    async useMacro(chatRoomId, macroType, usedBy = 'ADMIN') {
        try {
            // 매크로 템플릿 조회
            const template = await this.getMacroTemplate(macroType);
            if (!template) {
                throw new Error(`매크로 타입 '${macroType}'을 찾을 수 없습니다.`);
            }

            // MongoDB에 메시지 생성
            const message = await messageService.createMessage({
                chat_room_id: chatRoomId,
                sender_type: 'BOT',
                content: template.content,
                message_type: 'TEXT'
            });

            return {
                message,
                macroType,
                template: {
                    name: template.name,
                    description: template.description
                }
            };
        } catch (error) {
            console.error('Error using macro:', error);
            throw error;
        }
    }


}

module.exports = new MacroService(); 