import Redis from 'ioredis';

// Use the internal Redis URL from Render
const redis = new Redis(process.env.REDIS_URL);
redis.on('connect', () => {
  console.log("Successfully connected to Redis");
});
redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

export default redis;
