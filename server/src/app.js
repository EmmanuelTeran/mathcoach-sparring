import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.js';
import { topicsRouter } from './routes/topics.js';
import { practiceRouter } from './routes/practice.js';
import { dashboardRouter } from './routes/dashboard.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', healthRouter);
app.use('/api', practiceRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/topics', topicsRouter);
app.use('/api/practice', practiceRouter);
