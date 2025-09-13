import React, { useRef, useEffect, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { TourismData, RegionInfo } from '../types/tourism';
import { GeocodeResult } from '../types/location';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapComponentProps {
    tourismData: TourismData[];
    onMapClick: (coordinates: [number, number], regionInfo: RegionInfo) => void;
    selectedRegion: RegionInfo | null;
}

const MapComponent: React.FC<MapComponentProps> = ({
    tourismData,
    onMapClick,
    selectedRegion
}) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const [mapLoaded, setMapLoaded] = useState<boolean>(false);
    const markers = useRef<maplibregl.Marker[]>([]);

    const API_KEY = process.env.REACT_APP_AWS_LOCATION_API_KEY!;
    const AWS_REGION = process.env.REACT_APP_AWS_REGION!;

    // 逆ジオコーディング関数
    const reverseGeocode = useCallback(async (coordinates: [number, number]): Promise<RegionInfo> => {
        try {
            const response = await fetch(
                `https://places.geo.${AWS_REGION}.amazonaws.com/places/v0/indexes/ExamplePlaceIndex/search/position?key=${API_KEY}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        Position: coordinates,
                        MaxResults: 1
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const result: GeocodeResult = data.Results?.[0];

            return result ? {
                PlaceName: result.Address?.Label || '不明な地域',
                Label: result.Address?.Label,
                Address: result.Address,
                Position: result.Position
            } : { PlaceName: '不明な地域' };
        } catch (error) {
            console.error('逆ジオコーディングエラー:', error);
            return { PlaceName: '不明な地域' };
        }
    }, [API_KEY, AWS_REGION]);

    // 地図の初期化
    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        const styleUrl = `https://maps.geo.${AWS_REGION}.amazonaws.com/v2/styles/Standard/descriptor?key=${API_KEY}`;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: styleUrl,
            center: [139.6917, 35.6895], // 東京の座標
            zoom: 6
        });

        map.current.on('load', () => {
            setMapLoaded(true);

            // 地図クリックイベント
            map.current!.on('click', async (e: maplibregl.MapMouseEvent) => {
                const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat];
                const regionInfo = await reverseGeocode(coordinates);
                onMapClick(coordinates, regionInfo);
            });
        });

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, [API_KEY, AWS_REGION, onMapClick, reverseGeocode]);

    // 旅行者数に基づいてマーカーの色を決定
    const getMarkerColor = useCallback((visitorCount: number): string => {
        if (visitorCount > 100000) return '#ff0000'; // 赤：非常に多い
        if (visitorCount > 50000) return '#ff8800';  // オレンジ：多い
        if (visitorCount > 10000) return '#ffff00';  // 黄色：普通
        if (visitorCount > 1000) return '#88ff00';   // 黄緑：少ない
        return '#00ff00'; // 緑：非常に少ない
    }, []);

    // 旅行者数データをマーカーとして表示
    useEffect(() => {
        if (!mapLoaded || !map.current) return;

        // 既存のマーカーを削除
        markers.current.forEach(marker => marker.remove());
        markers.current = [];

        // 新しいマーカーを追加
        tourismData.forEach((item) => {
            const visitorCount = item.visitors || 0;
            const color = getMarkerColor(visitorCount);

            const marker = new maplibregl.Marker({
                color: color,
            })
                .setLngLat(item.coordinates)
                .setPopup(
                    new maplibregl.Popup({ offset: 25 })
                        .setHTML(`
            <div>
              <h3>${item.region || item.address}</h3>
              <p>旅行者数: ${visitorCount.toLocaleString()}人</p>
              <p>期間: ${item.period || '不明'}</p>
              ${item.category ? `<p>カテゴリ: ${item.category}</p>` : ''}
              ${item.changeRate ? `<p>前期比: ${item.changeRate > 0 ? '+' : ''}${item.changeRate}%</p>` : ''}
            </div>
          `)
                )
                .addTo(map.current!);

            markers.current.push(marker);
        });
    }, [mapLoaded, tourismData, getMarkerColor]);

    return (
        <div className="map-wrapper">
            <div ref={mapContainer} className="map-container" />
            <div className="map-legend">
                <h4>旅行者数凡例</h4>
                <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#ff0000' }}></span>
                    100,000人以上
                </div>
                <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#ff8800' }}></span>
                    50,000-99,999人
                </div>
                <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#ffff00' }}></span>
                    10,000-49,999人
                </div>
                <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#88ff00' }}></span>
                    1,000-9,999人
                </div>
                <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#00ff00' }}></span>
                    1,000人未満
                </div>
            </div>
        </div>
    );
};

export default MapComponent;
