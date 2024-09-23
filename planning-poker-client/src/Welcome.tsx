import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const [activeRooms, setActiveRooms] = useState<string[]>([]);

  useEffect(() => {
    // Fetch active rooms from the server
    socket.emit('getActiveRooms', (rooms: string[]) => {
      setActiveRooms(rooms);
    });

    // Listen for updates to active rooms
    socket.on('activeRooms', (rooms: string[]) => {
      setActiveRooms(rooms);
    });

    return () => {
      socket.off('activeRooms');
    };
  }, []);

  const handleEnter = () => {
    navigate('/room');
  };

  const handleJoin = (roomId: string) => {
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen flex flex-col items-center">
      <header className="w-full bg-blue-600 text-white py-4 mb-8">
        <h1 className="text-4xl font-bold text-center">Planning Poker</h1>
      </header>
      <main className="flex flex-col items-center w-full max-w-2xl">
        <h2 className="text-2xl font-semibold mb-4">Active Rooms</h2>
        <ul className="mb-8 w-full grid grid-cols-1 gap-4">
          {activeRooms.map((roomId) => (
            <li key={roomId} className="bg-white p-4 rounded shadow-md flex justify-between items-center">
              <span className="text-lg font-medium">{roomId}</span>
              <button
                onClick={() => handleJoin(roomId)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
              >
                Join
              </button>
            </li>
          ))}
        </ul>
        <button
          onClick={handleEnter}
          className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600 transition"
        >
          Enter
        </button>
      </main>
    </div>
  );
};

export default Welcome;