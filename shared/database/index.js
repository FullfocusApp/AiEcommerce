const mongoose = require('mongoose');
const redis = require('redis');
const config = require('../config');

class Database {
  constructor() {
    this.mongoClient = null;
    this.redisClient = null;
  }

  async connectMongo() {
    try {
      this.mongoClient = await mongoose.connect(config.database.mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ MongoDB connected successfully');
      return this.mongoClient;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  async connectRedis() {
    try {
      this.redisClient = redis.createClient({
        url: config.database.redisUrl,
      });

      this.redisClient.on('error', (err) => console.error('Redis Client Error', err));
      this.redisClient.on('connect', () => console.log('✅ Redis connected successfully'));

      await this.redisClient.connect();
      return this.redisClient;
    } catch (error) {
      console.error('❌ Redis connection error:', error);
      throw error;
    }
  }

  async connectAll() {
    await Promise.all([
      this.connectMongo(),
      this.connectRedis(),
    ]);
  }

  async disconnect() {
    if (this.mongoClient) {
      await mongoose.disconnect();
      console.log('MongoDB disconnected');
    }
    if (this.redisClient) {
      await this.redisClient.quit();
      console.log('Redis disconnected');
    }
  }

  getRedis() {
    return this.redisClient;
  }

  getMongo() {
    return this.mongoClient;
  }
}

module.exports = new Database();
