const net = require('net');

// Create a socket client
const client = new net.Socket();

// Connect to the socket server
client.connect(8080, 'localhost', () => {
  console.log('Connected to socket server');
  
  // Send invalid JSON data (simulating the error from the logs)
  const invalidData1 = 'device1,2026-03-08T12:00:00,data,image/avif';
  const invalidData2 = 'device1,2026-03-08T12:00:01,data, zstd';
  const validData = 'device1,2026-03-08T12:00:02,data,{"temperature": 25, "humidity": 60}';
  
  console.log('Sending invalid JSON data 1...');
  client.write(invalidData1 + '\n');
  
  setTimeout(() => {
    console.log('Sending invalid JSON data 2...');
    client.write(invalidData2 + '\n');
  }, 1000);
  
  setTimeout(() => {
    console.log('Sending valid JSON data...');
    client.write(validData + '\n');
  }, 2000);
  
  setTimeout(() => {
    console.log('Closing connection...');
    client.end();
  }, 3000);
});

// Handle data received from server
client.on('data', (data) => {
  console.log('Received from server:', data.toString());
});

// Handle connection close
client.on('close', () => {
  console.log('Connection closed');
});

// Handle errors
client.on('error', (error) => {
  console.error('Error:', error);
});
