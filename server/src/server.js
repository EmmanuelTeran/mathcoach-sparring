import dotenv from 'dotenv';
import { app } from './app.js';
import { connectDB } from './db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        console.log('MongoDB connected successfully');
      } catch (dbErr) {
        console.warn('MongoDB connection failed, starting server in standalone mode:', dbErr.message);
      }
    } else {
      console.log('MONGODB_URI not provided, running in standalone mode (healthcheck will report database state)');
    }

    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Server failed to start:', error);
    process.exit(1);
  }
}

bootstrap();
