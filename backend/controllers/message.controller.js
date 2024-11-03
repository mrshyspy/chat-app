import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import { produceMessage } from "../kafka.js";
import redis from '../redis.js';

export const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        if (!message || !receiverId) {
            return res.status(400).json({ error: "Message and receiver ID are required." });
        }

        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
            });
        }

        const messageData = {
            senderId,
            receiverId,
            message,
            conversationId: conversation._id,
        };

        await produceMessage(messageData);

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("chat:newMessage", messageData);
        }

        res.status(201).json(messageData);
    } catch (error) {
        console.error("Error in sendMessage controller:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: receiverId } = req.params;
        const senderId = req.user?._id;

        if (!receiverId || !senderId) {
            return res.status(400).json({ error: "Invalid sender or receiver ID" });
        }

        const messageId = `messages:${senderId}:${receiverId}`;

        const cachedMessages = await redis.lrange(messageId, 0, -1);
        const messages = [];
        for (const msg of cachedMessages) {
            try {
                messages.push(JSON.parse(msg));
            } catch (parseError) {
                console.error("Failed to parse cached message:", parseError);
                // Remove corrupted message from Redis
                await redis.lrem(messageId, 1, msg);
            }
        }

        if (messages.length > 0) {
            console.log("Returning cached messages");
            return res.status(200).json(messages);
        }

        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        }).populate("messages");

        if (!conversation) {
            return res.status(200).json([]); // No conversation means no messages
        }

        for (const msg of conversation.messages) {
            await redis.lpush(messageId, JSON.stringify(msg)); // Cache messages
        }

        res.status(200).json(conversation.messages);
    } catch (error) {
        console.error("Error in getMessages controller:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

  
