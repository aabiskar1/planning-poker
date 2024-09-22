import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const Welcome: React.FC = () => {

return (<div>
  <h1 className="text-3xl font-bold underline "> Welcome to Planning Poker</h1>
  <h2>Active Rooms</h2>
  <ul>
    <li>
      <button className="btn">Join</button>
    </li>
  </ul>
  <button className="btn">Enter</button>
</div>);

};


export default Welcome;