const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('✅ New client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      const [x, y, sliderVal] = data;

      if (x !== null && y !== null) {
        console.log(`🕹️ Joystick Data -> X: ${x}, Y: ${y}`);
        
        // Handle joystick data (e.g., save to DB, control a robot, etc.)
      }

      if (sliderVal !== null) {
        console.log(`🎚️ Slider Value -> ${sliderVal}`);
        // Handle slider value (e.g., control speed, volume, brightness)
      }

      // Optionally broadcast to other clients
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message.toString());
        }
      });

    } catch (error) {
      console.error('❌ Failed to parse incoming message:', error);
    }
  });

  ws.on('close', () => {
    console.log('⚠️ Client disconnected');
  });
});

console.log('🚀 WebSocket server running on ws://localhost:8080');
