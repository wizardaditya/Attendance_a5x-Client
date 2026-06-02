import { io } from 'socket.io-client';

// In production the client and server are on different origins.
const PROD_API = 'https://attendance-a5x-server.onrender.com';
const SERVER_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.MODE === 'production' ? PROD_API : 'http://localhost:3001');

const socket = io(SERVER_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
});

export default socket;
