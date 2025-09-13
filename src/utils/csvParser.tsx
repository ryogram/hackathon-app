import { Location } from '../types';

export const getLocationsFromCSV = async (): Promise<Location[]> => {
    // CSVファイルをfetchで取得
    const response = await fetch('/data/mizuziko-2.csv'); // public/data/mizuziko.csv を参照
    const csvData = await response.text();

    // CSVデータを行ごとに分割し、ヘッダー行を除外
    const lines = csvData.split('\n').filter(line => line.trim() !== '' && !line.startsWith('id'));

    // 各行をパースしてLocation型の配列を作成
    const locations: Location[] = lines.map((line) => {
        const [id, latitude, longitude] = line.split(',').map(value => value.trim());
        return {
            id: Number(id), // idを数値に変換
            latitude: Number(latitude), // latitudeを数値に変換
            longitude: Number(longitude), // longitudeを数値に変換
        };
    });

    return locations;
};