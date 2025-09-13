import React, { useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TourismData, RegionInfo } from '../types/tourism';
import { AnalysisResult, FollowUpQuestion } from '../types/analysis';
import { AmazonQService } from '../services/amazonQService';

interface AnalysisPanelProps {
    regionData: TourismData[] | null;
    analysis: AnalysisResult | null;
    selectedRegion: RegionInfo | null;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
    regionData,
    analysis,
    selectedRegion
}) => {
    const [followUpQuestion, setFollowUpQuestion] = useState<string>('');
    const [followUpHistory, setFollowUpHistory] = useState<FollowUpQuestion[]>([]);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const amazonQService = new AmazonQService();

    const handleFollowUpSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!followUpQuestion.trim() || !analysis?.conversationId || isSubmitting) return;

        setIsSubmitting(true);

        try {
            const answer = await amazonQService.askFollowUpQuestion(
                followUpQuestion,
                analysis.conversationId
            );

            const newQuestion: FollowUpQuestion = {
                question: followUpQuestion,
                answer,
                timestamp: new Date()
            };

            setFollowUpHistory(prev => [...prev, newQuestion]);
            setFollowUpQuestion('');
        } catch (error) {
            console.error('フォローアップ質問エラー:', error);
        } finally {
            setIsSubmitting(false);
        }
    }, [followUpQuestion, analysis?.conversationId, isSubmitting, amazonQService]);

    // チャートデータの準備
    const chartData = regionData?.map((item, index) => ({
        period: item.period,
        visitors: item.visitors,
        changeRate: item.changeRate || 0
    })) || [];

    if (!selectedRegion) {
        return (
            <div className="analysis-panel">
                <h3>分析結果</h3>
                <p>地図上の地域をクリックして、旅行者数データの分析を開始してください。</p>
            </div>
        );
    }

    return (
        <div className="analysis-panel">
            <h3>分析結果: {selectedRegion.PlaceName || selectedRegion.Label}</h3>

            {regionData && regionData.length > 0 && (
                <div className="data-visualization">
                    <h4>旅行者数推移</h4>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip
                                formatter={(value: number, name: string) => [
                                    name === 'visitors' ? `${value.toLocaleString()}人` : `${value}%`,
                                    name === 'visitors' ? '旅行者数' : '変化率'
                                ]}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="visitors"
                                stroke="#8884d8"
                                strokeWidth={2}
                                name="旅行者数"
                            />
                        </LineChart>
                    </ResponsiveContainer>

                    <div className="data-summary">
                        <h5>データサマリー</h5>
                        <ul>
                            <li>総データ数: {regionData.length}件</li>
                            <li>最大旅行者数: {Math.max(...regionData.map(d => d.visitors)).toLocaleString()}人</li>
                            <li>最小旅行者数: {Math.min(...regionData.map(d => d.visitors)).toLocaleString()}人</li>
                            <li>平均旅行者数: {Math.round(regionData.reduce((sum, d) => sum + d.visitors, 0) / regionData.length).toLocaleString()}人</li>
                        </ul>
                    </div>
                </div>
            )}

            {analysis && (
                <div className="ai-analysis">
                    <h4>AI分析結果</h4>
                    <div className="analysis-content">
                        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                            {analysis.analysis}
                        </pre>
                    </div>

                    {analysis.sourceAttributions && analysis.sourceAttributions.length > 0 && (
                        <div className="sources">
                            <h5>参考資料</h5>
                            <ul>
                                {analysis.sourceAttributions.map((source, index) => (
                                    <li key={index}>
                                        <a href={source.url} target="_blank" rel="noopener noreferrer">
                                            {source.title}
                                        </a>
                                        {source.snippet && <p className="source-snippet">{source.snippet}</p>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {analysis.conversationId && (
                        <div className="follow-up-section">
                            <h5>追加質問</h5>
                            <form onSubmit={handleFollowUpSubmit}>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        value={followUpQuestion}
                                        onChange={(e) => setFollowUpQuestion(e.target.value)}
                                        placeholder="追加で知りたいことを質問してください..."
                                        className="follow-up-input"
                                        disabled={isSubmitting}
                                    />
                                    <button
                                        type="submit"
                                        className="follow-up-button"
                                        disabled={isSubmitting || !followUpQuestion.trim()}
                                    >
                                        {isSubmitting ? '送信中...' : '質問する'}
                                    </button>
                                </div>
                            </form>

                            {followUpHistory.length > 0 && (
                                <div className="follow-up-history">
                                    <h6>質問履歴</h6>
                                    {followUpHistory.map((item, index) => (
                                        <div key={index} className="follow-up-item">
                                            <div className="question">
                                                <strong>Q:</strong> {item.question}
                                            </div>
                                            <div className="answer">
                                                <strong>A:</strong> {item.answer}
                                            </div>
                                            <div className="timestamp">
                                                {item.timestamp.toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {analysis.error && (
                        <div className="error-message">
                            エラー: {analysis.error}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AnalysisPanel;
