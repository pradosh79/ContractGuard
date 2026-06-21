require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const analyzeRoutes = require('../server/routes/analyze');

const app = express();
app.use(cors());
app.use(express.json());

let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');
  await mongoose.connect(process.env.MONGO_URI);
  isConnected = true;
  console.log('MongoDB connected');
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection error:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.use('/api/analyze', analyzeRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;
