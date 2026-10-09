import mongoose from 'mongoose';

export async function connectDB(uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/devcoach') {
  try {
    await mongoose.connect(uri);
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
