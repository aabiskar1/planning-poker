import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

interface ChatRoomProps {
  room?: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ room }) => {
  const { roomId: urlRoomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState(urlRoomId || '');
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
    if (urlRoomId) {
      joinRoom(urlRoomId);
      navigate('/room', { replace: true });
    }
  }, [urlRoomId, navigate]);

  useEffect(() => {
    const handleRoomCreated = (roomId: string) => {
      setCurrentRoom(roomId);
      setMessages((prevMessages) => [...prevMessages, `Room created: ${roomId}`]);
    };

    const handleUserJoined = (message: string) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    const handleNewVote = (message: string) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    const handleUserCount = (count: number) => {
      setUserCount(count);
    };

    const handleAdminAssigned = (adminId: string) => {
      setAdmin(adminId);
    };

    const handleVotesRevealed = (votes: { [key: string]: string }) => {
      setVotes(votes);
    };

    const handleUserKicked = (message: string) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    const handleVotesCleared = () => {
      setVotes({});
      setMessages((prevMessages) => [...prevMessages, 'Votes have been cleared']);
    };

    const handleUserList = (users: string[]) => {
      setUserList(users);
    };

    const handleKicked = (message: string) => {
      setError(message);
      setCurrentRoom(undefined);
    };

    const handleError = (errorMessage: string) => {
      setError(errorMessage);
    };

    socket.on('roomCreated', handleRoomCreated);
    socket.on('userJoined', handleUserJoined);
    socket.on('newVote', handleNewVote);
    socket.on('userCount', handleUserCount);
    socket.on('adminAssigned', handleAdminAssigned);
    socket.on('votesRevealed', handleVotesRevealed);
    socket.on('userKicked', handleUserKicked);
    socket.on('votesCleared', handleVotesCleared);
    socket.on('userList', handleUserList);
    socket.on('kicked', handleKicked);
    socket.on('error', handleError);

    return () => {
      socket.off('roomCreated', handleRoomCreated);
      socket.off('userJoined', handleUserJoined);
      socket.off('newVote', handleNewVote);
      socket.off('userCount', handleUserCount);
      socket.off('adminAssigned', handleAdminAssigned);
      socket.off('votesRevealed', handleVotesRevealed);
      socket.off('userKicked', handleUserKicked);
      socket.off('votesCleared', handleVotesCleared);
      socket.off('userList', handleUserList);
      socket.off('kicked', handleKicked);
      socket.off('error', handleError);
    };
  }, []);

  const createRoom = () => {
    setError(undefined);
    socket.emit('createRoom', roomId);
  };

  const joinRoom = (roomId: string) => {
    setError(undefined);
    console.log(`Attempting to join room: ${roomId}`);
    socket.emit('joinRoom', roomId, (response: { success: boolean; error?: string }) => {
      if (response.success) {
        console.log(`Successfully joined room: ${roomId}`);
        setCurrentRoom(roomId);
      } else {
        console.error(`Failed to join room: ${response.error}`);
        setError(response.error || 'Failed to join room');
      }
    });
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

  const renderRoomDetails = () => (
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
  );

  return (
    <div>
      <h1>Chat Room</h1>
      <div>
        <input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="Room ID" />
        <button onClick={createRoom}>Create Room</button>
        <button onClick={() => joinRoom(roomId)}>Join Room</button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {currentRoom && renderRoomDetails()}
    </div>
  );
};

export default ChatRoom;