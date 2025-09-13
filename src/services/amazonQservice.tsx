import { QBusinessClient, ChatSyncCommand, ChatSyncCommandInput } from '@aws-sdk/client-qbusiness';
import { TourismData, RegionInfo } from '../types/tourism';
import { AnalysisResult } from '../types/analysis';

export class AmazonQService {
    private client: QBusinessClient;
    private applicationId: string;

    constructor() {
        this.client = new QBusinessClient({
            region: process.env.REACT_APP_AWS_REGION!,
            credentials: {
                accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY!,
            }
        });

        this.applicationId = process.env.REACT_APP_AMAZON_Q_APPLICATION_ID!;
    }

    async analyzeTourismData(regionData: TourismData[], regionInfo: RegionInfo): Promise<AnalysisResult> {
        try {
            // データを分析用のプロンプトに整形
            const dataAnalysis = this.prepareDataForAnalysis(regionData);

            const prompt = `
以下の旅行者数データを分析して、増加・減少の原因を推測してください：

地域: ${regionInfo.PlaceName || regionInfo.Label}
データ: ${JSON.stringify(dataAnalysis, null, 2)}

以下の観点から分析してください：
1. 旅行者数の傾向（増加・減少・安定）
2. 季節性の影響
3. 考えられる増加・減少の要因
4. 今後の予測
5. 改善提案

分析結果を日本語で、わかりやすく説明してください。
      `;

            const input: ChatSyncCommandInput = {
                applicationId: this.applicationId,
                userMessage: prompt,
                userId: 'tourism-analyst',
                chatMode: 'RETRIEVAL_MODE'
            };

            const command = new ChatSyncCommand(input);
            const response = await this.client.send(command);

            return {
                analysis: response.systemMessage || 'データ分析を完了しました。',
                sourceAttributions: response.sourceAttributions || [],
                conversationId: response.conversationId
            };
        } catch (error) {
            console.error('Amazon Q分析エラー:', error);
            return {
                analysis: 'データ分析中にエラーが発生しました。',
                error: error instanceof Error ? error.message : '不明なエラー'
            };
        }
    }

    private prepareDataForAnalysis(regionData: TourismData[]): Partial<TourismData>[] {
        return regionData.map(item => ({
            period: item.period,
            visitors: item.visitors,
            region: item.region,
            category: item.category || '一般',
            previousPeriod: item.previousPeriod,
            changeRate: item.changeRate
        }));
    }

    async askFollowUpQuestion(question: string, conversationId: string): Promise<string> {
        try {
            const input: ChatSyncCommandInput = {
                applicationId: this.applicationId,
                userMessage: question,
                userId: 'tourism-analyst',
                conversationId: conversationId,
                chatMode: 'RETRIEVAL_MODE'
            };

            const command = new ChatSyncCommand(input);
            const response = await this.client.send(command);

            return response.systemMessage || 'エラーが発生しました。';
        } catch (error) {
            console.error('フォローアップ質問エラー:', error);
            return 'エラーが発生しました。';
        }
    }
}
