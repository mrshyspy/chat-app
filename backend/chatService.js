import redis from './redis.js';

const CACHE_EXPIRATION_SECONDS = 3600; // 1 hour expiration time

// Cache a message with a defined expiration
export const cacheMessage = async (messageId, messageData) => {
  try {
    await redis.set(messageId, JSON.stringify(messageData), 'EX', CACHE_EXPIRATION_SECONDS);
    console.log(`Cached message with ID: ${messageId}`);
  } catch (error) {
    console.error(`Failed to cache message with ID: ${messageId}`, error);
  }
};

// Retrieve a cached message
export const getCachedMessage = async (messageId) => {
  try {
    const cachedMessage = await redis.get(messageId);
    if (cachedMessage) {
      console.log(`Cache hit for message ID: ${messageId}`);
      return JSON.parse(cachedMessage);
    } else {
      console.log(`Cache miss for message ID: ${messageId}`);
      return null;
    }
  } catch (error) {
    console.error(`Failed to retrieve cached message with ID: ${messageId}`, error);
    return null;
  }
};
