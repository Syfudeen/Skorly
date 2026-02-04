require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:8080' }));
app.use(express.json());
app.use(compression());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Server is running (Simplified Mode - No Redis)',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Running in simplified mode without Redis',
    services: {
      database: 'connected',
      redis: 'not required (simplified mode)',
      queue: 'not required (simplified mode)'
    }
  });
});

// Mock API endpoints
app.get('/api', (req, res) => {
  res.json({
    status: 'success',
    message: 'Skorly API - Simplified Mode',
    note: 'Install Redis for full functionality',
    endpoints: {
      health: '/health',
      api: '/api'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║              Skorly Backend - Simplified Mode            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log('');
  console.log('⚠️  Running in simplified mode (without Redis)');
  console.log('   Install Redis for full functionality');
  console.log('');
});
