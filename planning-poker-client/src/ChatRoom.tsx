import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

const ChatRoom: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const [currentRoom, setCurrentRoom] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<string[]>([]);
  const [vote, setVote] = useState('');
  const [userCount, setUserCount] = useState(0);
  const [error, setError] = useState<string | undefined>(undefined);
  const [admin, setAdmin] = useState<string | undefined>(undefined);
  const [votes, setVotes] = useState<{ [key: string]: string }>({});
  const [userIdToKick, setUserIdToKick] = useState<string>('');
  const [userList, setUserList] = useState<string[]>([]);

  useEffect(() => {
    socket.on('roomCreated', (roomId: string) => {
      setCurrentRoom(roomId);
      setMessages((prevMessages) => [...prevMessages, `Room created: ${roomId}`]);
    });

    socket.on('userJoined', (message: string) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on('newVote', (message: string) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on('userCount', (count: number) => {
      setUserCount(count);
    });

    socket.on('adminAssigned', (adminId: string) => {
      setAdmin(adminId);
    });

    socket.on('votesRevealed', (votes: { [key: string]: string }) => {
      setVotes(votes);
    });

    socket.on('userKicked', (message: string) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on('votesCleared', () => {
      setVotes({});
      setMessages((prevMessages) => [...prevMessages, 'Votes have been cleared']);
    });

    socket.on('userList', (users: string[]) => {
      setUserList(users);
    });

    socket.on('kicked', (message: string) => {
      setError(message);
      setCurrentRoom(undefined);
    });

    socket.on('error', (errorMessage: string) => {
      setError(errorMessage);
    });

    return () => {
      socket.off('roomCreated');
      socket.off('userJoined');
      socket.off('newVote');
      socket.off('userCount');
      socket.off('adminAssigned');
      socket.off('votesRevealed');
      socket.off('userKicked');
      socket.off('votesCleared');
      socket.off('userList');
      socket.off('kicked');
      socket.off('error');
    };
  }, []);

  const createRoom = () => {
    setError(undefined);
    socket.emit('createRoom', roomId);
  };

  const joinRoom = () => {
    setError(undefined);
    socket.emit('joinRoom', roomId);
    setCurrentRoom(roomId);
  };

  const sendVote = () => {
    socket.emit('vote', currentRoom, vote);
  };

  const revealVotes = () => {
    socket.emit('revealVotes', currentRoom);
  };

  const kickUser = () => {
    socket.emit('kickUser', currentRoom, userIdToKick);
  };

  const clearVotes = () => {
    socket.emit('clearVotes', currentRoom);
  };

  return (
    <div>
      <h1>Chat Room</h1>
      <div>
        <input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="Room ID" />
        <button onClick={createRoom}>Create Room</button>
        <button onClick={joinRoom}>Join Room</button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {currentRoom && (
        <div>
          <h2>Room: {currentRoom}</h2>
          <p>Users connected: {userCount}</p>
          <p>Admin: {admin}</p>
          <ul>
            {messages.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
          <h3>Connected Users:</h3>
          <ul>
            {userList.map((userId) => (
              <li key={userId}>{userId}</li>
            ))}
          </ul>
          <input value={vote} onChange={(e) => setVote(e.target.value)} placeholder="Your vote" />
          <button onClick={sendVote}>Send Vote</button>
          {admin === socket.id && (
            <div>
              <button onClick={revealVotes}>Reveal Votes</button>
              <input
                value={userIdToKick}
                onChange={(e) => setUserIdToKick(e.target.value)}
                placeholder="User ID to kick"
              />
              <button onClick={kickUser}>Kick User</button>
              <button onClick={clearVotes}>Clear Votes</button>
            </div>
          )}
          {Object.keys(votes).length > 0 && (
            <div>
              <h3>Votes:</h3>
              <ul>
                {Object.entries(votes).map(([userId, userVote]) => (
                  <li key={userId}>{userId}: {userVote}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatRoom;