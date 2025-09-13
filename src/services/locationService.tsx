import { LocationClient, SearchPlaceIndexForTextCommand } from '@aws-sdk/client-location';
import { GeoPlacesClient, GeocodeCommand } from '@aws-sdk/client-geo-places';
import { TourismData } from '../types/tourism';

export class LocationService {
    private locationClient: LocationClient;
    private geoPlacesClient: GeoPlacesClient;

    constructor() {
        const config = {
            region: process.env.REACT_APP_AWS_REGION!,
            credentials: {
                accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY!,
            }
        };

        this.locationClient = new LocationClient(config);
        this.geoPlacesClient = new GeoPlacesClient(config);
    }

    async geocodeCSVData(csvData: Omit<TourismData, 'coordinates'>[]): Promise<TourismData[]> {
        const geocodedData: TourismData[] = [];

        for (const item of csvData) {
            try {
                const coordinates = await this.geocodeAddress(item.address);
                if (coordinates) {
                    geocodedData.push({
                        ...item,
                        coordinates,
                        id: `${item.region}-${item.period}-${Math.random().toString(36).substr(2, 9)}`
                    });
                }
            } catch (error) {
                console.error(`ジオコーディングエラー: ${item.address}`, error);
                // エラーの場合はデフォルト座標を使用（東京）
                geocodedData.push({
                    ...item,
                    coordinates: [139.6917, 35.6895],
                    id: `${item.region}-${item.period}-${Math.random().toString(36).substr(2, 9)}`
                });
            }

            // レート制限対策
            await this.delay(100);
        }

        return geocodedData;
    }

    private async geocodeAddress(address: string): Promise<[number, number] | null> {
        try {
            const command = new GeocodeCommand({
                QueryText: address,
                MaxResults: 1
            });

            const response = await this.geoPlacesClient.send(command);

            if (response.ResultItems && response.ResultItems.length > 0) {
                const position = response.ResultItems[0].Position;
                return position ? [position[0], position[1]] : null;
            }

            return null;
        } catch (error) {
            console.error('ジオコーディングエラー:', error);
            return null;
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
