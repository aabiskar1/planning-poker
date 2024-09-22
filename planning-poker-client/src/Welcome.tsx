import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const Welcome: React.FC = () => {

return (<div>
  <h1>Welcome to Planning Poker</h1>
  <h2>Active Rooms</h2>
  <ul>
    <li>
      <button>Join</button>
    </li>
  </ul>
  <button>Enter</button>
</div>);

};


export default Welcome;