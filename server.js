const http = require('http');
const express = require('express');
const { Server: WebSocketServer } = require('ws');
const net = require('net');
const path = require('path');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;
const tcpPort = 4444; // Port for the TCP server

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

  clientSocket.on('data', (data) => {
    console.log(`Received from ${clientId}: ${data}`);
    // Here, you can handle incoming data from TCP clients and broadcast it or process it as needed.
  });

  clientSocket.on('end', () => {
    console.log(`TCP client disconnected: ${clientId}`);
  });
});

tcpServer.listen(tcpPort, '0.0.0.0', () => {
  console.log(`TCP server listening on port ${tcpPort}`);
});
