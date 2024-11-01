import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import { produceMessage } from "../kafka.js";
<<<<<<< HEAD
// import { cacheMessage, getCachedMessage } from '../chatService.js';
// import redis from '../redis.js';
=======
import { cacheMessage, getCachedMessage } from '../chatService.js';
import redis from '../redis.js';

>>>>>>> f84f3c979c2562a1aa93cd9d125673c278e4359c

export const sendMessage = async (req, res) => {
	try {
		const { message } = req.body;
		const { id: receiverId } = req.params;
		const senderId = req.user._id;

		let conversation = await Conversation.findOne({
			participants: { $all: [senderId, receiverId] },
		});

		if (!conversation) {
			conversation = await Conversation.create({
				participants: [senderId, receiverId],
			});
		}

		// const newMessage = new Message({
		// 	senderId,
		// 	receiverId,
		// 	message,
		// });

		// if (newMessage) {
		// 	conversation.messages.push(newMessage._id);
		// }

		const messageData = {
            senderId,
            receiverId,
            message,
            conversationId: conversation._id,
        };
        await produceMessage(messageData);

		// await conversation.save();
		// await newMessage.save();

		// this will run in parallel
		// await Promise.all([conversation.save(), newMessage.save()]);

		// SOCKET IO FUNCTIONALITY WILL GO HERE
		const receiverSocketId = getReceiverSocketId(receiverId);
		if (receiverSocketId) {
			// io.to(<socket_id>).emit() used to send events to specific client
			io.to(receiverSocketId).emit("newMessage", messageData);
		}

		res.status(201).json(messageData);
	} catch (error) {
		console.log("Error in sendMessage controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};


// getMessages function using redis
  
// export const getMessages = async (req, res) => {
// 	try {
// 	  const { id: receiverId } = req.params;
<<<<<<< HEAD
// 	  const senderId = req.user?._id;
=======
// 	  const senderId = req.user._id;
// 	  const messageId = `messages:${senderId}:${receiverId}`;
// export const getMessages = async (req, res) => {
// 	try {
// 	  const { id: userToChatId } = req.params;
// 	  const senderId = req.user._id;
// 	  const messageId = `messages:${senderId}:${userToChatId}`;
>>>>>>> f84f3c979c2562a1aa93cd9d125673c278e4359c
  
// 	  if (!receiverId || !senderId) {
// 		return res.status(400).json({ error: "Invalid sender or receiver ID" });
// 	  }
  
// 	  const messageId = `messages:${senderId}:${receiverId}`;
  
// 	  // Try to get messages from the Redis list
// 	  const cachedMessages = await redis.lrange(messageId, 0, -1); // Get all messages from the list
// 	  if (cachedMessages.length > 0) {
// 		const messages = cachedMessages.map((msg) => JSON.parse(msg));
// 		console.log("Returning cached messages", messages);
// 		return res.status(200).json(messages);
// 	  }
  
// 	  // If not cached, fetch messages from the database
// 	  const conversation = await Conversation.findOne({
// 		participants: { $all: [senderId, receiverId] },
// 	  }).populate("messages");
  
// 	  if (!conversation) {
// 		return res.status(200).json([]);
// 	  }
  
// 	  const messages = conversation.messages;
  
// 	  // Cache the messages in Redis list
// 	  for (const msg of messages) {
// 		await redis.lpush(messageId, JSON.stringify(msg)); // Push each message to the Redis list
// 	  }
  
// 	  res.status(200).json(messages);
// 	} catch (error) {
// 	  console.log("Error in getMessages controller:", error.message);
// 	  res.status(500).json({ error: "Internal server error" });
// 	}
//   };
  
export const getMessages = async (req, res) => {
	try {
		const { id: userToChatId } = req.params;
		const senderId = req.user._id;

		const conversation = await Conversation.findOne({
			participants: { $all: [senderId, userToChatId] },
		}).populate("messages"); // NOT REFERENCE BUT ACTUAL MESSAGES

		if (!conversation) return res.status(200).json([]);

		const messages = conversation.messages;

		res.status(200).json(messages);
	} catch (error) {
		console.log("Error in getMessages controller: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
<<<<<<< HEAD
};
=======
  };
  
// export const getMessages = async (req, res) => {
// 	try {
// 		const { id: userToChatId } = req.params;
// 		const senderId = req.user._id;

// 		const conversation = await Conversation.findOne({
// 			participants: { $all: [senderId, userToChatId] },
// 		}).populate("messages"); // NOT REFERENCE BUT ACTUAL MESSAGES

// 		if (!conversation) return res.status(200).json([]);

// 		const messages = conversation.messages;

// 		res.status(200).json(messages);
// 	} catch (error) {
// 		console.log("Error in getMessages controller: ", error.message);
// 		res.status(500).json({ error: "Internal server error" });
// 	}
// };
// =======
//   export const getMessages = async (req, res) => {
//   try {
//     const { id: receiverId } = req.params;
//     const senderId = req.user._id;
//     const messageId = `messages:${senderId}:${receiverId}`;

//     // Step 1: Try to get cached messages from Redis
//     const cachedMessages = await getCachedMessage(messageId) || [];

//     // Immediately send cached messages to the client
//     res.status(200).json({ messages: cachedMessages });

//     // Step 2: Fetch old messages from the database asynchronously
//     const conversation = await Conversation.findOne({
//       participants: { $all: [senderId, userToChatId] },
//     }).populate("messages");

//     const oldMessages = conversation ? conversation.messages : [];

//     // Step 3: Combine cached messages with old messages
//     const allMessages = [...cachedMessages, ...oldMessages];

//     // Step 4: Cache the combined messages for future retrieval
//     await cacheMessage(messageId, allMessages);
//   } catch (error) {
//     console.log("Error in getMessages controller:", error.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

>>>>>>> f84f3c979c2562a1aa93cd9d125673c278e4359c
