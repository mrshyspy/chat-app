import User from "../models/user.model.js";
import redis from '../redis.js'; // Ensure the Redis client is imported

export const getUsersForSidebar = async (req, res) => {
	try {
		console.log("getUsersForSidebar called"); // Debug log

		const loggedInUserId = req.user._id;
		const cacheKey = `sidebarUsers:${loggedInUserId}`; // Unique cache key for the user

		// Check for cached users
		const cachedUsers = await redis.get(cacheKey);
		if (cachedUsers) {
			console.log("Returning cached users for sidebar."); // Debug log
			return res.status(200).json(JSON.parse(cachedUsers)); // Return cached users
		}

		// If not in cache, fetch from database
		const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

		// Cache the result for future requests
		if (filteredUsers.length > 0) {
			await redis.set(cacheKey, JSON.stringify(filteredUsers), 'EX', 3600); // Cache for 1 hour
			console.log("Cached users for sidebar."); // Debug log
		}

		res.status(200).json(filteredUsers);
	} catch (error) {
		console.error("Error in getUsersForSidebar: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};
