import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { initAI } from './services/aiService.js';
import { getDB } from './store/db.js';

import authRoutes from './routes/authRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import approvalRoutes from './routes/approvalRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

// Load environment variables
dotenv.config();

// Initialize AI and DB
initAI();
getDB();

const app = express();

// Create uploads directory if it doesn't exist
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  })
);

// Route Mounts
app.use('/api/auth', authRoutes);
app.post('/api/login', (req, res, next) => {
  req.url = '/login';
  authRoutes(req, res, next);
});
app.post('/api/register', (req, res, next) => {
  req.url = '/register';
  authRoutes(req, res, next);
});

app.use('/api/public', publicRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint (replaces demo reset in production)
app.all(['/api/reset', '/api/health'], (req, res) => {
  res.json({ status: 'ok', production: true, uptime: process.uptime() });
});

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({ name: 'ClearPath Statutory API', version: '1.0.0', status: 'online' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  process.stdout.write("[ClearPath Server] running on port " + PORT + "\n");
});
