const http = require('http');
const express = require('express');
const net = require('net');
const path = require('path');
const socketIo = require('socket.io');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;
const tcpPort = 4444;
const adminPort = 5555;

// Maintain a list of connected clients
const connectedClients = new Set(); // Using Set to keep unique client sockets

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Set up Socket.io for WebSocket communication
const io = socketIo(server);
const users = {};

io.on('connection', (socket) => {
  console.log('WebSocket client connected');

  socket.on('new-user-joined', (username) => {
    users[socket.id] = username;
    socket.broadcast.emit('user-connected', username);
    io.emit('user-list', users);
  });

  socket.on('disconnect', () => {
    socket.broadcast.emit('user-disconnected', users[socket.id]);
    delete users[socket.id];
    io.emit('user-list', users);
  });

  socket.on('message', (data) => {
    socket.broadcast.emit('message', { user: data.user, msg: data.msg });
  });
});

// Start the HTTP and WebSocket server
server.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});

// Create a TCP server to handle client connections on port 4444
const tcpServer = net.createServer((clientSocket) => {
  const clientId = `${clientSocket.remoteAddress}:${clientSocket.remotePort}`;
  console.log(`TCP client connected: ${clientId}`);
  connectedClients.add(clientSocket);

  clientSocket.on('data', (data) => {
    console.log(`Received from ${clientId}: ${data}`);
    // Handle incoming data from TCP clients
  });

  clientSocket.on('end', () => {
    console.log(`TCP client disconnected: ${clientId}`);
    connectedClients.delete(clientSocket);
  });
});

tcpServer.listen(tcpPort, '0.0.0.0', () => {
  console.log(`TCP server listening on port ${tcpPort}`);
});

// Create a TCP server to handle admin connections on port 5555
const adminServer = net.createServer((adminSocket) => {
  console.log('Admin client connected');

  adminSocket.on('data', (data) => {
    console.log(`Admin received data: ${data}`);
    // Broadcast message to all TCP clients
    connectedClients.forEach(client => {
      client.write(data);
    });
  });

  adminSocket.on('end', () => {
    console.log('Admin client disconnected');
  });
});

adminServer.listen(adminPort, '0.0.0.0', () => {
  console.log(`Admin TCP server listening on port ${adminPort}`);
});

// Connect to the external WebSocket server
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
