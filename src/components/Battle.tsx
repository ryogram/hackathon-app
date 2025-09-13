import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getLocationsFromCSV } from '../utils/csvParser';
import { Location } from '../types';

// カスタムスタイルを適用したマーカーを作成
const createColoredMarker = (color: string) => {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
    });
};

const player1Marker = createColoredMarker('blue'); // プレイヤー1のマーカー色
const player2Marker = createColoredMarker('red');  // プレイヤー2のマーカー色

const Battle: React.FC = () => {
    const [locations, setLocations] = useState<Location[]>([]);
    const [player1Locations, setPlayer1Locations] = useState<Location[]>([]); // プレイヤー1の地点
    const [player2Locations, setPlayer2Locations] = useState<Location[]>([]); // プレイヤー2の地点
    const [player1Selected, setPlayer1Selected] = useState<Location[]>([]); // プレイヤー1が選んだ地点
    const [player2Selected, setPlayer2Selected] = useState<Location[]>([]); // プレイヤー2が選んだ地点
    const [currentPlayer, setCurrentPlayer] = useState<number>(1); // 現在のプレイヤー (1または2)
    const [winner, setWinner] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const data = await getLocationsFromCSV();
            setLocations(data);

            // ランダムに10個の地点を選択し、5個ずつプレイヤーに割り当て
            const shuffled = [...data].sort(() => 0.5 - Math.random()).slice(0, 10);
            setPlayer1Locations(shuffled.slice(0, 5));
            setPlayer2Locations(shuffled.slice(5, 10));
        };
        fetchData();
    }, []);

    const handleMarkerClick = (location: Location) => {
        // 現在のプレイヤーが選択可能な地点のみ選べる
        if (currentPlayer === 1 && !player1Locations.find((loc) => loc.id === location.id)) return;
        if (currentPlayer === 2 && !player2Locations.find((loc) => loc.id === location.id)) return;

        // すでに選択されている場合は何もしない
        if (
            (currentPlayer === 1 && player1Selected.find((loc) => loc.id === location.id)) ||
            (currentPlayer === 2 && player2Selected.find((loc) => loc.id === location.id))
        ) {
            return;
        }

        // プレイヤーごとに最大2つまで選択可能
        if (currentPlayer === 1 && player1Selected.length < 2) {
            setPlayer1Selected([...player1Selected, location]);
        } else if (currentPlayer === 2 && player2Selected.length < 2) {
            setPlayer2Selected([...player2Selected, location]);
        }
    };

    const handleConfirmSelection = () => {
        if (currentPlayer === 1 && player1Selected.length === 2) {
            setCurrentPlayer(2); // プレイヤー2の番に切り替え
        } else if (currentPlayer === 2 && player2Selected.length === 2) {
            handleBattle(); // 両プレイヤーが選び終わったらバトル開始
        }
    };

    const handleBattle = () => {
        const [loc1, loc2] = player1Selected;
        const [loc3, loc4] = player2Selected;

        // 緯度と経度を掛け合わせた値を計算
        const value1 = loc1.latitude * loc1.longitude * loc2.latitude * loc2.longitude;
        const value2 = loc3.latitude * loc3.longitude * loc4.latitude * loc4.longitude;

        // 勝者を決定
        if (value1 > value2) {
            setWinner(`Player 1 wins with value ${value1}`);
        } else if (value2 > value1) {
            setWinner(`Player 2 wins with value ${value2}`);
        } else {
            setWinner(`It's a tie! Both players have the same value.`);
        }
    };

    return (
        <div>
            <h1>Latitude and Longitude Battle</h1>
            <p>Current Player: {currentPlayer === 1 ? 'Player 1' : 'Player 2'}</p>
            <button onClick={handleConfirmSelection} disabled={(currentPlayer === 1 && player1Selected.length < 2) || (currentPlayer === 2 && player2Selected.length < 2)}>
                Confirm Selection
            </button>
            {winner && <p>{winner}</p>}

            <h2>Player 1 Selected Locations</h2>
            <ul>
                {player1Selected.map((loc) => (
                    <li key={loc.id}>
                        ID: {loc.id}, Latitude: {loc.latitude}, Longitude: {loc.longitude}
                    </li>
                ))}
            </ul>

            <h2>Player 2 Selected Locations</h2>
            <ul>
                {player2Selected.map((loc) => (
                    <li key={loc.id}>
                        ID: {loc.id}, Latitude: {loc.latitude}, Longitude: {loc.longitude}
                    </li>
                ))}
            </ul>

            <h2>Map</h2>
            <MapContainer center={[35.6895, 139.6917]} zoom={5} style={{ height: '500px', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {player1Locations.map((loc) => (
                    <Marker
                        key={loc.id}
                        position={[loc.latitude, loc.longitude]}
                        icon={player1Marker} // プレイヤー1の色付きマーカー
                        eventHandlers={{
                            click: () => handleMarkerClick(loc), // プレイヤー1の地点を選択
                        }}
                    >
                        <Popup>
                            Player 1 Location <br />
                            Latitude: {loc.latitude}, Longitude: {loc.longitude}
                        </Popup>
                    </Marker>
                ))}
                {player2Locations.map((loc) => (
                    <Marker
                        key={loc.id}
                        position={[loc.latitude, loc.longitude]}
                        icon={player2Marker} // プレイヤー2の色付きマーカー
                        eventHandlers={{
                            click: () => handleMarkerClick(loc), // プレイヤー2の地点を選択
                        }}
                    >
                        <Popup>
                            Player 2 Location <br />
                            Latitude: {loc.latitude}, Longitude: {loc.longitude}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default Battle;