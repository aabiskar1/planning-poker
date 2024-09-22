// src/App.tsx
import React from 'react';
import ChatRoom from './ChatRoom';
import { BrowserRouter,Routes,Route } from 'react-router-dom';
import Welcome from './Welcome';

const App: React.FC = () => (
  <div className="App">
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/room" element={<ChatRoom />} />
        <Route path="/room/:roomId" element={<ChatRoom />} />
      </Routes> 
    </BrowserRouter>

  </div>
);

export default App;