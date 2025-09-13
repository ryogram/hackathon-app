import React, { useEffect, useState } from 'react';
import { getLocationsFromCSV } from '../utils/csvParser';
import { Location } from '../types';

const Battle: React.FC = () => {
    const [locations, setLocations] = useState<Location[]>([]);
    const [winner, setWinner] = useState<string | null>(null);
    const [player1Name, setPlayer1Name] = useState<string>(''); // プレイヤー1の名前
    const [player2Name, setPlayer2Name] = useState<string>(''); // プレイヤー2の名前
    const [player1Locations, setPlayer1Locations] = useState<Location[]>([]); // プレイヤー1の地点
    const [player2Locations, setPlayer2Locations] = useState<Location[]>([]); // プレイヤー2の地点

    useEffect(() => {
        const fetchData = async () => {
            const data = await getLocationsFromCSV();
            setLocations(data);
        };
        fetchData();
    }, []);

    const handleBattle = () => {
        if (locations.length < 10) {
            setWinner('Not enough locations for a battle!');
            return;
        }

        // ランダムに5つの地点を選択（プレイヤー1とプレイヤー2用）
        const shuffledLocations = [...locations].sort(() => 0.5 - Math.random());
        const player1 = shuffledLocations.slice(0, 5);
        const player2 = shuffledLocations.slice(5, 10);

        setPlayer1Locations(player1); // プレイヤー1の地点を保存
        setPlayer2Locations(player2); // プレイヤー2の地点を保存

        // 各プレイヤーの値を計算（緯度と経度をすべて掛け合わせる）
        const player1Value = player1.reduce((acc, loc) => acc * loc.latitude * loc.longitude, 1);
        const player2Value = player2.reduce((acc, loc) => acc * loc.latitude * loc.longitude, 1);

        // 勝者を決定
        if (player1Value > player2Value) {
            setWinner(`${player1Name} wins! Total value: ${player1Value}`);
        } else if (player2Value > player1Value) {
            setWinner(`${player2Name} wins! Total value: ${player2Value}`);
        } else {
            setWinner(`It's a tie! Both players have the same value.`);
        }
    };

    return (
        <div>
            <h1>Latitude and Longitude Battle</h1>
            <div>
                <label>
                    Player 1 Name:
                    <input
                        type="text"
                        value={player1Name}
                        onChange={(e) => setPlayer1Name(e.target.value)} // プレイヤー1の名前を更新
                    />
                </label>
            </div>
            <div>
                <label>
                    Player 2 Name:
                    <input
                        type="text"
                        value={player2Name}
                        onChange={(e) => setPlayer2Name(e.target.value)} // プレイヤー2の名前を更新
                    />
                </label>
            </div>
            <button onClick={handleBattle}>Start Battle</button>
            {winner && <p>{winner}</p>}

            <h2>{player1Name}'s Locations</h2>
            <ul>
                {player1Locations.map((loc) => (
                    <li key={loc.id}>
                        ID: {loc.id}, Latitude: {loc.latitude}, Longitude: {loc.longitude}
                    </li>
                ))}
            </ul>

            <h2>{player2Name}'s Locations</h2>
            <ul>
                {player2Locations.map((loc) => (
                    <li key={loc.id}>
                        ID: {loc.id}, Latitude: {loc.latitude}, Longitude: {loc.longitude}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Battle;