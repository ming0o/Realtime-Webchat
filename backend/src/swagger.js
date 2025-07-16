const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Realtime Chat API",
            version: "1.0.0",
            description: "실시간 채팅 서비스용 API 명세서",
            contact: {
                name: "API Support",
                email: "support@example.com"
            }
        },
        servers: [
            {
                url: "http://localhost:8080",
                description: "Development server"
            }
        ],
        components: {
            schemas: {
                User: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        social_type: { type: "string", enum: ["KAKAO", "GUEST"] },
                        nickname: { type: "string" },
                        social_id: { type: "string" },
                        token: { type: "string" },
                        created_at: { type: "string", format: "date-time" }
                    }
                },
                ChatRoom: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        user_id: { type: "integer" },
                        status: { type: "string", enum: ["ACTIVE", "CLOSED"] },
                        created_at: { type: "string", format: "date-time" }
                    }
                },
                Message: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        chat_room_id: { type: "integer" },
                        sender_type: { type: "string", enum: ["USER", "ADMIN", "BOT"] },
                        content: { type: "string" },
                        message_type: { type: "string", enum: ["TEXT", "IMAGE", "FILE"] },
                        read: { type: "boolean" },
                        created_at: { type: "string", format: "date-time" }
                    }
                },
                Macro: {
                    type: "object",
                    properties: {
                        macroType: { type: "string", enum: ["off-hours", "lunch-time", "holiday"] },
                        message: { type: "string" },
                        timestamp: { type: "string", format: "date-time" }
                    }
                },
                MacroTemplate: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        macro_type: { type: "string", enum: ["off-hours", "lunch-time", "holiday"] },
                        name: { type: "string" },
                        description: { type: "string" },
                        content: { type: "string" },
                        is_active: { type: "boolean" },
                        created_at: { type: "string", format: "date-time" },
                        updated_at: { type: "string", format: "date-time" }
                    }
                }
            }
        }
    },
    apis: ["./src/routes/*.js", "./src/app.js"],
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: "Realtime Chat API Documentation"
    }));
}

module.exports = setupSwagger;
