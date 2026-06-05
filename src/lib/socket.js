import { io } from 'socket.io-client';

const PROD_API = 'https://attendance-a5x-server-1.onrender.com';
const SERVER_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.MODE === 'production' ? PROD_API : 'http://localhost:3001');

const socket = io(SERVER_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,      // max 5 retries (not infinite spam)
  reconnectionDelay: 3000,       // wait 3s before retry
  reconnectionDelayMax: 30000,   // max 30s between retries
  timeout: 20000,
  transports: ['polling', 'websocket'], // polling first (more stable on free tier)
});

socket.on('connect_error', (err) => {
  console.warn('Socket connection failed:', err.message);
});

export default socket;
