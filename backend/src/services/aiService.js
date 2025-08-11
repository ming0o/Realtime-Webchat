const { GoogleGenerativeAI } = require('@google/generative-ai');
const messageService = require('./messageServiceMongo');
const macroService = require('./macroService');

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class AIService {
    constructor() {
        // 시뮬레이션 모드 확인
        this.isSimulationMode = !process.env.GEMINI_API_KEY ||
            process.env.GEMINI_API_KEY === 'your_gemini_api_key_here' ||
            process.env.GEMINI_API_KEY === '';

        if (this.isSimulationMode) {
            console.warn('Gemini API 키가 설정되지 않았습니다. 시뮬레이션 모드로 실행됩니다.');
        }
    }

    async analyzeConversation(conversationText, context = '') {
        if (this.isSimulationMode) {
            return this.simulateAnalysis(conversationText);
        }

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `
                다음 고객 서비스 대화를 분석해주세요. 순수한 JSON 형식으로만 응답해주세요. 마크다운 코드 블록이나 다른 텍스트는 포함하지 마세요.

                대화 내용:
                ${conversationText}

                ${context ? `추가 컨텍스트: ${context}` : ''}

                다음 형식으로 분석해주세요:
                {
                    "sentiment": "positive|negative|neutral",
                    "urgency": "low|medium|high|critical", 
                    "category": "technical|billing|complaint|inquiry|general",
                    "keywords": ["키워드1", "키워드2", "키워드3"],
                    "summary": "대화 내용 요약 (2-3문장)"
                }

                JSON만 응답해주세요. 설명이나 다른 텍스트는 포함하지 마세요.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // JSON 파싱 (마크다운 코드 블록 제거)
            const cleanText = text.replace(/```json\s*|\s*```/g, '').trim();
            const analysis = JSON.parse(cleanText);
            return analysis;
        } catch (error) {
            console.error('Gemini API 호출 실패:', error);
            return this.simulateAnalysis(conversationText);
        }
    }

    async generateRecommendations(analysis, chatRoomId) {
        if (this.isSimulationMode) {
            return this.simulateRecommendations(analysis);
        }

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            // 기존 매크로 가져오기
            const macros = await macroService.getAllMacroTemplates();
            const macroList = macros.map(m => `- ${m.name}: ${m.content}`).join('\n');

            const prompt = `
                다음 고객 서비스 대화 분석 결과를 바탕으로 상담원에게 답변을 추천해주세요. 순수한 JSON 형식으로만 응답해주세요.

                분석 결과:
                - 감정: ${analysis.sentiment}
                - 긴급도: ${analysis.urgency}
                - 카테고리: ${analysis.category}
                - 요약: ${analysis.summary}

                사용 가능한 매크로:
                ${macroList}

                다음 형식으로 3개의 추천을 제공해주세요:
                [
                    {
                        "type": "macro|custom|transfer",
                        "content": "추천 답변 내용",
                        "confidence": 0.85,
                        "reason": "추천 이유"
                    }
                ]

                type 설명:
                - macro: 기존 매크로 사용
                - custom: AI가 생성한 맞춤형 답변
                - transfer: 전문 상담원 이관

                JSON 배열만 응답해주세요. 설명이나 다른 텍스트는 포함하지 마세요.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // JSON 파싱 (마크다운 코드 블록 제거)
            const cleanText = text.replace(/```json\s*|\s*```/g, '').trim();
            const recommendations = JSON.parse(cleanText);
            return recommendations;
        } catch (error) {
            console.error('Gemini API 호출 실패:', error);
            return this.simulateRecommendations(analysis);
        }
    }

    async generateCustomResponse(conversationText, context = '') {
        if (this.isSimulationMode) {
            return this.simulateCustomResponse(conversationText);
        }

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `
                다음 고객 서비스 대화를 바탕으로 상담원이 사용할 수 있는 친절하고 전문적인 답변을 생성해주세요.

                대화 내용:
                ${conversationText}

                ${context ? `추가 컨텍스트: ${context}` : ''}

                요구사항:
                - 친절하고 전문적인 톤
                - 구체적이고 실용적인 답변
                - 2-3문장으로 간결하게
                - 한국어로 응답
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Gemini API 호출 실패:', error);
            return this.simulateCustomResponse(conversationText);
        }
    }

    // 시뮬레이션 메서드들 (API 키가 없을 때 사용)
    simulateAnalysis(conversationText) {
        // 대화 내용에 따른 간단한 분석
        const text = conversationText.toLowerCase();

        let sentiment = 'neutral';
        let urgency = 'medium';
        let category = 'general';
        let keywords = [];
        let summary = '고객이 문의사항을 제기했습니다.';

        // 감정 분석
        if (text.includes('화나') || text.includes('짜증') || text.includes('불만')) {
            sentiment = 'negative';
        } else if (text.includes('감사') || text.includes('좋') || text.includes('만족')) {
            sentiment = 'positive';
        }

        // 긴급도 분석
        if (text.includes('급') || text.includes('바로') || text.includes('지금')) {
            urgency = 'high';
        } else if (text.includes('나중') || text.includes('천천')) {
            urgency = 'low';
        }

        // 카테고리 분석
        if (text.includes('결제') || text.includes('금액') || text.includes('비용')) {
            category = 'billing';
        } else if (text.includes('오류') || text.includes('문제') || text.includes('안됨')) {
            category = 'technical';
        } else if (text.includes('불만') || text.includes('항의')) {
            category = 'complaint';
        }

        // 키워드 추출
        const words = text.split(' ').filter(word => word.length > 2);
        keywords = words.slice(0, 3);

        return {
            sentiment,
            urgency,
            category,
            keywords,
            summary
        };
    }

    simulateRecommendations(analysis) {
        const recommendations = [
            {
                type: 'macro',
                content: '안녕하세요! 문의해주셔서 감사합니다. 어떤 도움이 필요하신지 말씀해 주세요.',
                confidence: 0.8,
                reason: '일반적인 인사 매크로'
            },
            {
                type: 'custom',
                content: `고객님의 ${analysis.category} 관련 문의를 확인했습니다. 빠르게 해결해드리도록 하겠습니다.`,
                confidence: 0.7,
                reason: '카테고리별 맞춤 답변'
            },
            {
                type: 'transfer',
                content: '전문 상담원에게 연결해드리겠습니다.',
                confidence: 0.6,
                reason: '복잡한 문의로 판단'
            }
        ];

        return recommendations;
    }

    simulateCustomResponse(conversationText) {
        return '고객님의 문의사항을 확인했습니다. 빠르게 해결해드리도록 하겠습니다. 추가로 궁금한 점이 있으시면 언제든 말씀해 주세요.';
    }
}

module.exports = new AIService();
