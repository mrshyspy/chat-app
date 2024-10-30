import { Kafka } from "kafkajs";
import fs from 'fs';
import path from "path";
import dotenv from 'dotenv';
import { cacheMessage, getCachedMessage } from './chatService.js';
import Conversation from "./models/conversation.model.js"; 
import Message from "./models/message.model.js";

dotenv.config();

// Use the correct casing for the environment variable
const broker = process.env.BROKERS; 
console.log(broker);
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
  }
});

const producer = kafka.producer();
const consumer = kafka.consumer({
  groupId: 'chat-consumer-group',
  autoCommit: true,
  autoCommitInterval: 5000,
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

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const parsedMessage = JSON.parse(message.value.toString());
          console.log(`Received message from Kafka:`, parsedMessage);
          await saveMessageToDatabase(parsedMessage);
        } catch (error) {
          console.error("Error processing message:", error);
          console.log("Pausing consumer for 60 seconds...");
          await consumer.pause([{ topic: "chat-messages" }]);
          setTimeout(async () => {
            console.log("Resuming consumer...");
            await consumer.resume([{ topic: "chat-messages" }]);
          }, 60000);
        }
      },
    });
  } catch (error) {
    console.error("Error connecting to Kafka consumer:", error);
  }
}


// In your saveMessageToDatabase function
async function saveMessageToDatabase({ senderId, receiverId, message }) {
  try {
    const messageId = `messages:${senderId}:${receiverId}`;
    const cachedMessage = await getCachedMessage(messageId);

    if (cachedMessage) {
      console.log("Message loaded from cache:", cachedMessage);
      return; // Skip saving if message is already cached
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      message,
    });
    await newMessage.save();
    conversation.messages.push(newMessage._id);
    await conversation.save();

    // Cache the newly saved message
    await cacheMessage(messageId, { senderId, receiverId, message });

    console.log("Message saved to database and cached:", newMessage);
  } catch (error) {
    console.error("Error saving message to database:", error);
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
  console.log("Shutting down...");
  await disconnectProducer();
  await disconnectConsumer();
  process.exit(0);
});
