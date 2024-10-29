import { Kafka } from "kafkajs";
import fs from 'fs';
import path from "path";
import dotenv from 'dotenv';
import Conversation from "./models/conversation.model.js"; 
import Message from "./models/message.model.js";


dotenv.config();

const kafka = new Kafka({
  clientId: 'chatApp',
  brokers: ['kafka-16f53485-mrshyspy.j.aivencloud.com:11153'],
  ssl: {
    ca: [fs.readFileSync(path.resolve("./backend/ca.pem"), "utf-8")],
  },
  sasl: {
    username: process.env.KAFKA_USERNAME || 'avnadmin',
    password: process.env.KAFKA_PASSWORD || 'AVNS_04ZtWmwW8q-_j6Oi2Ny',
    mechanism: "plain",
  }
});

const producer = kafka.producer();
const consumer = kafka.consumer({
  groupId: 'chat-consumer-group',
  // Enable auto-commit and set commit interval
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

    await consumer.run({
      eachMessage: async ({  message, pause }) => {
        const parsedMessage = JSON.parse(message.value.toString());
        console.log(`Received message from Kafka:`, parsedMessage);

        await saveMessageToDatabase(parsedMessage);
      },
    });
  } catch (error) {
    console.error("Error processing message:", error);
    console.log("Pausing consumer for 60 seconds...");

    // Pause the consumer and wait for 60 seconds
    await consumer.pause([{ topic: "chat-messages" }]);
    setTimeout(async () => {
      console.log("Resuming consumer...");
      await consumer.resume([{ topic: "chat-messages" }]);
    }, 60000); // 60 seconds
  }
}

async function saveMessageToDatabase({ senderId, receiverId, message }) {
    try {
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
  
      console.log("Message saved to database:", newMessage);
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
