// chatService.js
import redis from './redis.js';

// Cache a message with a 1-hour expiration
export const cacheMessage = async (messageId, messageData) => {
  await redis.set(`message:${messageId}`, JSON.stringify(messageData), 'EX', 3600);
};

// Retrieve a cached message
export const getCachedMessage = async (messageId) => {
  const cachedMessage = await redis.get(`message:${messageId}`);
  return cachedMessage ? JSON.parse(cachedMessage) : null;
};
