'use client';

import { useState } from 'react';
import { AIAnalysisResult, AIRecommendation } from '@/types';
import { api } from '@/services/api';
import { Brain, MessageCircle, Zap, ArrowRight } from 'lucide-react';

interface AIRecommendationsProps {
    chatRoomId: number;
    onUseRecommendation: (recommendation: AIRecommendation) => void;
}

export default function AIRecommendations({ chatRoomId, onUseRecommendation }: AIRecommendationsProps) {
    const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const analyzeConversation = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await api.analyzeConversation(chatRoomId);
            setAnalysisResult(result);
        } catch (err) {
            setError('AI 분석에 실패했습니다.');
            console.error('AI 분석 실패:', err);
        } finally {
            setLoading(false);
        }
    };

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case 'positive': return 'text-green-600 bg-green-50';
            case 'negative': return 'text-red-600 bg-red-50';
            case 'neutral': return 'text-gray-600 bg-gray-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getUrgencyColor = (urgency: string) => {
        switch (urgency) {
            case 'critical': return 'text-red-600 bg-red-50';
            case 'high': return 'text-orange-600 bg-orange-50';
            case 'medium': return 'text-yellow-600 bg-yellow-50';
            case 'low': return 'text-green-600 bg-green-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getRecommendationIcon = (type: string) => {
        switch (type) {
            case 'macro': return <MessageCircle className="w-4 h-4" />;
            case 'custom': return <Brain className="w-4 h-4" />;
            case 'transfer': return <ArrowRight className="w-4 h-4" />;
            default: return <Zap className="w-4 h-4" />;
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    AI 답변 추천
                </h3>
                <button
                    onClick={analyzeConversation}
                    disabled={loading}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? '분석 중...' : '분석하기'}
                </button>
            </div>

            {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                    {error}
                </div>
            )}

            {analysisResult && (
                <div className="space-y-4">
                    {/* 분석 결과 */}
                    <div className="bg-gray-50 rounded-lg p-3">
                        <h4 className="font-medium text-gray-900 mb-2">대화 분석</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-600">감정:</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(analysisResult.analysis.sentiment)}`}>
                                    {analysisResult.analysis.sentiment === 'positive' ? '긍정적' :
                                        analysisResult.analysis.sentiment === 'negative' ? '부정적' : '중립적'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-600">긴급도:</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(analysisResult.analysis.urgency)}`}>
                                    {analysisResult.analysis.urgency === 'critical' ? '긴급' :
                                        analysisResult.analysis.urgency === 'high' ? '높음' :
                                            analysisResult.analysis.urgency === 'medium' ? '보통' : '낮음'}
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{analysisResult.analysis.summary}</p>
                    </div>

                    {/* 추천 답변들 */}
                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">추천 답변</h4>
                        <div className="space-y-2">
                            {analysisResult.recommendations.map((recommendation, index) => (
                                <div
                                    key={index}
                                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => onUseRecommendation(recommendation)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2 mb-2">
                                            {getRecommendationIcon(recommendation.type)}
                                            <span className="text-sm font-medium text-gray-900">
                                                {recommendation.type === 'macro' ? '매크로' :
                                                    recommendation.type === 'custom' ? 'AI 답변' : '이관'}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                신뢰도: {Math.round(recommendation.confidence * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-700 mb-2">{recommendation.content}</p>
                                    <p className="text-xs text-gray-500">{recommendation.reason}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
