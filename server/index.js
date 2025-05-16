const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 }, () => {
  console.log('WebSocket server running on ws://localhost:8080');
});

const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('New client connected');

  ws.on('message', (message) => {
    console.log('Received from client:', message);
    for (const client of clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected');
  });
});
