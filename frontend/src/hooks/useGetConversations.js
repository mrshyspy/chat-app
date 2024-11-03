import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios"; // Import axios

const useGetConversations = () => {
	const [loading, setLoading] = useState(false);
	const [conversations, setConversations] = useState([]);

	useEffect(() => {
		let isMounted = true; // Flag to track mounted status

		const getConversations = async () => {
			setLoading(true);
			try {
				const res = await axios.get("/api/users"); // Use axios to make the GET request
				if (isMounted) {
					setConversations(res.data); // Access data directly from the response
				}
			} catch (error) {
				const errorMessage = error.response?.data?.error || error.message; // Extract error message from response if available
				toast.error(errorMessage);
				console.error("Error fetching conversations:", error); // Log the error for debugging
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		};

		getConversations();

		// Cleanup function to prevent state updates if unmounted
		return () => {
			isMounted = false;
		};
	}, []);

	return { loading, conversations };
};

export default useGetConversations;
