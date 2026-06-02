import { io } from 'socket.io-client';

// In production the client and server are on different origins.
// VITE_API_URL should be set to your backend URL (e.g. https://worksyne-api.onrender.com)
const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const socket = io(SERVER_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
});

export default socket;
