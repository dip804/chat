const WebSocket = require('ws');

const externalWsUrl = 'wss://chat-w-a.onrender.com/';
const ws = new WebSocket(externalWsUrl);

ws.on('open', () => {
  console.log('Connected to external WebSocket server');
});

ws.on('message', (message) => {
  console.log('Received message from external WebSocket server:', message);
});

ws.on('close', () => {
  console.log('Disconnected from external WebSocket server');
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});
