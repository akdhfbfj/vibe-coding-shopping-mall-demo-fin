const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;
let server;

const startServer = async () => {
  try {
    await connectDB();
    server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

const shutdown = (signal, callback) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  if (!server) {
    callback?.();
    return;
  }

  server.close(async () => {
    console.log('HTTP server closed.');
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    callback?.();
  });
};

process.on('SIGINT', () => {
  shutdown('SIGINT', () => process.exit(0));
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM', () => process.exit(0));
});

process.once('SIGUSR2', () => {
  shutdown('SIGUSR2', () => process.kill(process.pid, 'SIGUSR2'));
});

startServer();
