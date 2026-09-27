import express from 'express';
import { apiRouter } from '../server/api.ts';

const app = express();
app.use(express.json());

// Handle both /api prefixed routes and direct endpoints (when rewritten by Vercel)
app.use('/api', apiRouter);
app.use(apiRouter);

export default app;
