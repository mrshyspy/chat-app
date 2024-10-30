import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import { produceMessage } from "../kafka.js";
import { cacheMessage, getCachedMessage } from '../chatService.js';


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

// export const getMessages = async (req, res) => {
// 	try {
// 	  const { id: userToChatId } = req.params;
// 	  const senderId = req.user._id;
// 	  const messageId = `messages:${senderId}:${userToChatId}`;
  
// 	  // Try to get messages from the cache
// 	  const cachedMessages = await getCachedMessage(messageId);
// 	  if (cachedMessages) {
// 		console.log("Returning cached messages", cachedMessages);
// 		return res.status(200).json(cachedMessages);
// 	  }
  
// 	  // If not cached, fetch messages from the database
// 	  const conversation = await Conversation.findOne({
// 		participants: { $all: [senderId, userToChatId] },
// 	  }).populate("messages");
  
// 	  if (!conversation) {
// 		return res.status(200).json([]);
// 	  }
  
// 	  const messages = conversation.messages;
  
// 	  // Cache the messages for 1 hour
// 	  await cacheMessage(messageId, messages);
  
// 	  res.status(200).json(messages);
// 	} catch (error) {
// 	  console.log("Error in getMessages controller:", error.message);
// 	  res.status(500).json({ error: "Internal server error" });
// 	}
//   };
  export const getMessages = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    const messageId = `messages:${senderId}:${receiverId}`;

    // Step 1: Try to get cached messages from Redis
    const cachedMessages = await getCachedMessage(messageId) || [];

    // Immediately send cached messages to the client
    res.status(200).json({ messages: cachedMessages });

    // Step 2: Fetch old messages from the database asynchronously
    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, userToChatId] },
    }).populate("messages");

    const oldMessages = conversation ? conversation.messages : [];

    // Step 3: Combine cached messages with old messages
    const allMessages = [...cachedMessages, ...oldMessages];

    // Step 4: Cache the combined messages for future retrieval
    await cacheMessage(messageId, allMessages);
  } catch (error) {
    console.log("Error in getMessages controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

