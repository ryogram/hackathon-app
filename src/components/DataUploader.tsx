import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { TourismData } from '../types/tourism';

interface DataUploaderProps {
    onDataUpload: (data: Omit<TourismData, 'coordinates'>[]) => void;
}

interface CSVRow {
    [key: string]: string;
}

const DataUploader: React.FC<DataUploaderProps> = ({ onDataUpload }) => {
    const [uploading, setUploading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);
        setUploadProgress(0);

        Papa.parse<CSVRow>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    if (results.errors.length > 0) {
                        throw new Error(`CSV解析エラー: ${results.errors[0].message}`);
                    }

                    const processedData: Omit<TourismData, 'coordinates'>[] = results.data
                        .filter(row => row.region || row.prefecture || row.address)
                        .map((row, index) => {
                            const visitors = parseInt(row.visitors) || parseInt(row.tourist_count) || 0;
                            const changeRate = row.change_rate ? parseFloat(row.change_rate) : undefined;

                            return {
                                region: row.region || `${row.prefecture || ''}${row.city || ''}`,
                                address: row.address || `${row.prefecture || ''}${row.city || ''}${row.district || ''}`,
                                visitors,
                                period: row.period || row.date || '不明',
                                category: row.category || '一般',
                                previousPeriod: row.previous_period,
                                changeRate,
                                prefecture: row.prefecture,
                                city: row.city,
                                district: row.district
                            };
                        });

                    if (processedData.length === 0) {
                        throw new Error('有効なデータが見つかりませんでした。CSVファイルの形式を確認してください。');
                    }

                    setUploadProgress(100);
                    onDataUpload(processedData);
                } catch (error) {
                    console.error('CSVデータ処理エラー:', error);
                    setError(error instanceof Error ? error.message : 'CSVファイルの処理中にエラーが発生しました。');
                } finally {
                    setUploading(false);
                }
            },
            error: (error) => {
                console.error('CSV読み込みエラー:', error);
                setError('CSVファイルの読み込みに失敗しました。');
                setUploading(false);
            }
        });
    }, [onDataUpload]);

    return (
        <div className="data-uploader">
            <h3>旅行者数データアップロード</h3>

            <div className="upload-section">
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="file-input"
                />

                {uploading && (
                    <div className="upload-progress">
                        <p>アップロード中...</p>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}
            </div>

            <div className="csv-format-info">
                <h4>CSVファイル形式</h4>
                <p>以下の列を含むCSVファイルをアップロードしてください：</p>
                <table className="format-table">
                    <thead>
                        <tr>
                            <th>列名</th>
                            <th>説明</th>
                            <th>必須</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>region</code></td>
                            <td>地域名</td>
                            <td>○</td>
                        </tr>
                        <tr>
                            <td><code>prefecture</code></td>
                            <td>都道府県</td>
                            <td>△</td>
                        </tr>
                        <tr>
                            <td><code>city</code></td>
                            <td>市区町村</td>
                            <td>△</td>
                        </tr>
                        <tr>
                            <td><code>address</code></td>
                            <td>住所</td>
                            <td>△</td>
                        </tr>
                        <tr>
                            <td><code>visitors</code></td>
                            <td>旅行者数</td>
                            <td>○</td>
                        </tr>
                        <tr>
                            <td><code>period</code></td>
                            <td>期間</td>
                            <td>○</td>
                        </tr>
                        <tr>
                            <td><code>category</code></td>
                            <td>カテゴリ</td>
                            <td>×</td>
                        </tr>
                        <tr>
                            <td><code>change_rate</code></td>
                            <td>前期比変化率(%)</td>
                            <td>×</td>
                        </tr>
                    </tbody>
                </table>

                <div className="sample-data">
                    <h5>サンプルデータ</h5>
                    <pre>
                        {`region,prefecture,city,visitors,period,category,change_rate
東京都渋谷区,東京都,渋谷区,150000,2024-01,観光,5.2
大阪府大阪市,大阪府,大阪市,120000,2024-01,ビジネス,-2.1
京都府京都市,京都府,京都市,200000,2024-01,観光,8.7`}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default DataUploader;
