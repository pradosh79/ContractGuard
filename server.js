require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const analyzeRoutes = require('./server/routes/analyze');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/analyze', analyzeRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve the built React app for everything else
const clientBuildPath = path.join(__dirname, 'client', 'build');
app.use(express.static(clientBuildPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`ContractGuard server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
