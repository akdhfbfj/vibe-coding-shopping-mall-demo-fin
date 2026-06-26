const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_ATLAS_URL || process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      'MONGODB_ATLAS_URL or MONGODB_URI must be defined in environment variables',
    );
  }

  await mongoose.connect(uri);
  console.log('MongoDB connected');
};

module.exports = connectDB;
