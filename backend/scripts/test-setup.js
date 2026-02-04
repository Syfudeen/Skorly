require('dotenv').config();
const mongoose = require('mongoose');
const Redis = require('redis');

/**
 * Test Setup Script
 * Verifies that all required services are accessible
 */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testMongoDB() {
  log('\n📊 Testing MongoDB Connection...', colors.blue);
  
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/skorly';
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    
    log('✅ MongoDB connection successful', colors.green);
    log(`   URI: ${mongoUri}`, colors.reset);
    log(`   Database: ${mongoose.connection.name}`, colors.reset);
    
    await mongoose.connection.close();
    return true;
  } catch (error) {
    log('❌ MongoDB connection failed', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    return false;
  }
}

async function testRedis() {
  log('\n🔴 Testing Redis Connection...', colors.blue);
  
  try {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      socket: {
        connectTimeout: 5000
      }
    };
    
    const client = Redis.createClient(redisConfig);
    
    await client.connect();
    
    // Test ping
    const pong = await client.ping();
    
    if (pong === 'PONG') {
      log('✅ Redis connection successful', colors.green);
      log(`   Host: ${redisConfig.host}:${redisConfig.port}`, colors.reset);
      log(`   Response: ${pong}`, colors.reset);
    }
    
    await client.quit();
    return true;
  } catch (error) {
    log('❌ Redis connection failed', colors.red);
    log(`   Error: ${error.message}`, colors.red);
    return false;
  }
}

async function testEnvironmentVariables() {
  log('\n⚙️  Checking Environment Variables...', colors.blue);
  
  const requiredVars = [
    'NODE_ENV',
    'PORT',
    'MONGODB_URI',
    'REDIS_HOST',
    'REDIS_PORT'
  ];
  
  const optionalVars = [
    'REDIS_PASSWORD',
    'QUEUE_CONCURRENCY',
    'CORS_ORIGIN',
    'LOG_LEVEL'
  ];
  
  let allPresent = true;
  
  log('\n  Required Variables:', colors.yellow);
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      log(`  ✅ ${varName}: ${process.env[varName]}`, colors.green);
    } else {
      log(`  ❌ ${varName}: NOT SET`, colors.red);
      allPresent = false;
    }
  });
  
  log('\n  Optional Variables:', colors.yellow);
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      log(`  ✅ ${varName}: ${process.env[varName]}`, colors.green);
    } else {
      log(`  ⚠️  ${varName}: NOT SET (using default)`, colors.yellow);
    }
  });
  
  return allPresent;
}

async function testNodeModules() {
  log('\n📦 Checking Node Modules...', colors.blue);
  
  const requiredModules = [
    'express',
    'mongoose',
    'redis',
    'bullmq',
    'xlsx',
    'axios',
    'multer',
    'winston',
    'helmet',
    'cors'
  ];
  
  let allInstalled = true;
  
  requiredModules.forEach(moduleName => {
    try {
      require.resolve(moduleName);
      log(`  ✅ ${moduleName}`, colors.green);
    } catch (error) {
      log(`  ❌ ${moduleName} - NOT INSTALLED`, colors.red);
      allInstalled = false;
    }
  });
  
  return allInstalled;
}

async function testDirectories() {
  log('\n📁 Checking Required Directories...', colors.blue);
  
  const fs = require('fs');
  const path = require('path');
  
  const requiredDirs = [
    'uploads',
    'logs',
    'src',
    'src/config',
    'src/models',
    'src/routes',
    'src/services',
    'src/workers',
    'src/middleware',
    'src/utils'
  ];
  
  let allExist = true;
  
  requiredDirs.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (fs.existsSync(dirPath)) {
      log(`  ✅ ${dir}`, colors.green);
    } else {
      log(`  ❌ ${dir} - MISSING`, colors.red);
      allExist = false;
    }
  });
  
  return allExist;
}

async function runAllTests() {
  log('╔═══════════════════════════════════════════════════════════╗', colors.blue);
  log('║         Skorly Backend - Setup Verification Test         ║', colors.blue);
  log('╚═══════════════════════════════════════════════════════════╝', colors.blue);
  
  const results = {
    environment: await testEnvironmentVariables(),
    directories: await testDirectories(),
    modules: await testNodeModules(),
    mongodb: await testMongoDB(),
    redis: await testRedis()
  };
  
  log('\n' + '═'.repeat(60), colors.blue);
  log('📋 Test Summary', colors.blue);
  log('═'.repeat(60), colors.blue);
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    const color = passed ? colors.green : colors.red;
    log(`  ${test.toUpperCase().padEnd(20)} ${status}`, color);
  });
  
  const allPassed = Object.values(results).every(result => result === true);
  
  log('\n' + '═'.repeat(60), colors.blue);
  
  if (allPassed) {
    log('🎉 All tests passed! Your setup is ready.', colors.green);
    log('\nYou can now start the server:', colors.green);
    log('  npm run dev', colors.yellow);
    log('\nAnd start the worker:', colors.green);
    log('  npm run worker', colors.yellow);
  } else {
    log('⚠️  Some tests failed. Please fix the issues above.', colors.red);
    log('\nCommon fixes:', colors.yellow);
    log('  1. Install dependencies: npm install', colors.reset);
    log('  2. Start MongoDB: mongod', colors.reset);
    log('  3. Start Redis: redis-server', colors.reset);
    log('  4. Copy .env.example to .env and configure', colors.reset);
  }
  
  log('\n');
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  log(`\n💀 Fatal error: ${error.message}`, colors.red);
  process.exit(1);
});