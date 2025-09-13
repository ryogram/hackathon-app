import React, { useState, useEffect, useCallback } from 'react';
import MapComponent from './components/MapComponent';
import DataUploader from './components/DataUploader';
import AnalysisPanel from './components/AnalysisPanel';
import { LocationService } from './services/locationService';
import { AmazonQService } from './services/amazonQService';
import { TourismData, RegionInfo, AnalysisResult } from './types/tourism';
import './App.css';

const App: React.FC = () => {
  const [tourismData, setTourismData] = useState<TourismData[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<RegionInfo | null>(null);
  const [regionData, setRegionData] = useState<TourismData[] | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const locationService = new LocationService();
  const amazonQService = new AmazonQService();

  // CSVデータのアップロード処理
  const handleDataUpload = useCallback(async (csvData: Omit<TourismData, 'coordinates'>[]) => {
    setLoading(true);
    setError(null);

    try {
      // CSVデータをジオコーディング
      const geocodedData = await locationService.geocodeCSVData(csvData);
      setTourismData(geocodedData);
    } catch (error) {
      console.error('データアップロードエラー:', error);
      setError('データのアップロードに失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [locationService]);

  // 地図クリック時の処理
  const handleMapClick = useCallback(async (coordinates: [number, number], regionInfo: RegionInfo) => {
    setLoading(true);
    setError(null);

    try {
      // クリックした地域の旅行者数データを取得
      const data = await getRegionTourismData(coordinates, regionInfo);
      setSelectedRegion(regionInfo);
      setRegionData(data);

      // Amazon Qでデータ分析
      if (data && data.length > 0) {
        const analysisResult = await amazonQService.analyzeTourismData(data, regionInfo);
        setAnalysis(analysisResult);
      } else {
        setAnalysis({
          analysis: 'この地域には旅行者数データが見つかりませんでした。',
          error: 'データなし'
        });
      }
    } catch (error) {
      console.error('地域データ取得エラー:', error);
      setError('地域データの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [amazonQService, tourismData]);

  // 地域の旅行者数データを取得
  const getRegionTourismData = async (
    coordinates: [number, number],
    regionInfo: RegionInfo
  ): Promise<TourismData[]> => {
    // 座標に基づいて該当する旅行者数データを検索
    const nearbyData = tourismData.filter(item => {
      const distance = calculateDistance(
        coordinates[1], coordinates[0],
        item.coordinates[1], item.coordinates[0]
      );
      return distance < 10; // 10km以内のデータを取得
    });

    return nearbyData;
  };

  // 距離計算関数（Haversine formula）
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // 地球の半径（km）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>旅行者数データ分析システム</h1>
        {error && <div className="error-message">{error}</div>}
      </header>

      <div className="app-content">
        <div className="left-panel">
          <DataUploader onDataUpload={handleDataUpload} />
          {loading && <div className="loading">処理中...</div>}
        </div>

        <div className="map-container">
          <MapComponent
            tourismData={tourismData}
            onMapClick={handleMapClick}
            selectedRegion={selectedRegion}
          />
        </div>

        <div className="right-panel">
          <AnalysisPanel
            regionData={regionData}
            analysis={analysis}
            selectedRegion={selectedRegion}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
