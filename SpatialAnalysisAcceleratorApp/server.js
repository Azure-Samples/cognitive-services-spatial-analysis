// Cognitive Services for spatial analysis: Accelerator app for Person Counting. 

/* eslint-disable no-undef */
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const ServerEventReader = require('./server-event-reader.js');

// These are set in the configuration settings that you enter in .vscode/launch.js
const iotHubConnectionString = process.env.IotHubConnectionString;
const eventHubConsumerGroup = process.env.EventHubConsumerGroup;

// Redirect requests to the public subdirectory towards the client
const app = express();
app.use(express.static(path.join(__dirname, 'root')));
app.use((req, res /* , next */) => {
  res.redirect('/');
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        console.log(`Broadcasting data ${data}`);
        client.send(data);
      } catch (e) {
        console.error(e);
      }
    }
  });
};

// To navigate to the app after launching, navigate to localhost:3000
server.listen(process.env.PORT || '3000', () => {
  console.log('Listening on %d.', server.address().port);
});

const serverEventReader = new ServerEventReader(iotHubConnectionString, eventHubConsumerGroup);

(async () => {
  await serverEventReader.startReadMessage((message, date, deviceId) => {
    try {
      const payload = {
        IotData: message,
        MessageDate: date || Date.now().toISOString(),
        DeviceId: deviceId,
      };

      wss.broadcast(JSON.stringify(payload));
    } catch (err) {
      console.error('Error broadcasting: [%s] from [%s].', err, message);
    }
  });
})().catch();