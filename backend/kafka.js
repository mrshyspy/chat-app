import { Kafka } from "kafkajs";
import fs from 'fs';
import path from "path";
import dotenv from 'dotenv';
import Conversation from "./models/conversation.model.js"; 
import Message from "./models/message.model.js";
import redis from './redis.js';

dotenv.config();
// if (redis.status !== "ready") {
//   console.error("Redis is not ready. Please check the connection.");
//   // Optionally, add a retry logic here
// }

// Set up broker and Kafka configuration
const broker = process.env.BROKERS;
console.log("Kafka broker:", broker);

const kafka = new Kafka({
  clientId: 'chatApp',
  brokers: [broker],
  ssl: {
    ca: [fs.readFileSync(path.resolve("./backend/ca.pem"), "utf-8")],
  },
  sasl: {
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
    mechanism: "plain",
  },
});

const producer = kafka.producer();
const consumer = kafka.consumer({
  groupId: 'chat-consumer-group',
  autoCommit: true,
  autoCommitInterval: 5000, // Commit every 5 seconds
});

export async function initializeProducer() {
  try {
    await producer.connect();
    console.log("Kafka producer connected");
  } catch (error) {
    console.error("Failed to connect Kafka producer:", error);
  }
}

export async function produceMessage(message) {
  try {
    await producer.send({
      topic: 'chat-messages',
      messages: [{ value: JSON.stringify(message) }],
    });
    console.log("Message produced to Kafka:", message);
  } catch (error) {
    console.error("Error producing message to Kafka:", error);
  }
}

export async function initializeConsumer() {
  try {
    await consumer.connect();
    console.log("Kafka consumer connected");

    await consumer.subscribe({ topic: 'chat-messages', fromBeginning: false });
    console.log("Subscribed to topic: chat-messages");

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const messageValue = message.value?.toString();
          if (!messageValue) {
            console.error("Empty message received from Kafka");
            return;
          }

          const parsedMessage = JSON.parse(messageValue);
          console.log(`Received message from Kafka:`, parsedMessage);

          // Save the message to the database
          await saveMessageToDatabase(parsedMessage);
        } catch (error) {
          console.error("Error processing message:", error);

          // Pause consumer for 60 seconds on error
          console.log("Pausing consumer for 60 seconds due to error...");
          consumer.pause([{ topic: "chat-messages" }]);

          setTimeout(() => {
            console.log("Resuming consumer...");
            consumer.resume([{ topic: "chat-messages" }]);
          }, 60000); // 60 seconds
        }
      },
    });
  } catch (error) {
    console.error("Error connecting Kafka consumer:", error);
  }
}

// Save the message to the database
async function saveMessageToDatabase({ senderId, receiverId, message }) {
  try {
    console.log("Attempting to find conversation...");
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      console.log("Conversation not found, creating a new one...");
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    console.log("Saving new message...");
    const newMessage = new Message({
      senderId,
      receiverId,
      message,
    });
    await newMessage.save();

    conversation.messages.push(newMessage._id);
    await conversation.save();

    console.log("Message successfully saved to database:", newMessage._id);
    const messageId = `messages:${senderId}:${receiverId}`;
    await redis.rpush(messageId, JSON.stringify(newMessage));
    console.log("Message successfully cached to Redis:", newMessage._id);
    await redis.expire(messageId, 86400); // Expire cache after 1 day
  } catch (error) {
    console.error("Error saving message to database:", error.message || error);
  }
}

export async function disconnectProducer() {
  await producer.disconnect();
  console.log("Kafka producer disconnected");
}

export async function disconnectConsumer() {
  await consumer.disconnect();
  console.log("Kafka consumer disconnected");
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log("Shutting down gracefully...");
  await disconnectProducer();
  await disconnectConsumer();
  process.exit(0);
});
