const http = require('http');
const https = require('https');
const express = require('express');
const fs = require('fs');
const net = require('net');
const path = require('path');
const socketIo = require('socket.io');
const WebSocket = require('ws');

const app = express();
const httpPort = 80;
const httpsPort = 443;
const tcpPort = 4444;
const adminPort = 5555;

// HTTPS setup (Replace with your own certificates)
const options = {
  key: fs.readFileSync('/path/to/your/private.key'),
  cert: fs.readFileSync('/path/to/your/certificate.crt'),
  ca: fs.readFileSync('/path/to/your/ca_bundle.crt')
};

// Create HTTP and HTTPS servers
const httpServer = http.createServer(app);
const httpsServer = https.createServer(options, app);

// Maintain a list of connected clients
const connectedClients = new Set(); // Using Set to keep unique client sockets

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Set up Socket.io for WebSocket communication
const io = socketIo(httpServer);
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

// Start HTTP and HTTPS servers
httpServer.listen(httpPort, () => {
  console.log(`HTTP server started at http://localhost:${httpPort}`);
});

httpsServer.listen(httpsPort, () => {
  console.log(`HTTPS server started at https://localhost:${httpsPort}`);
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
