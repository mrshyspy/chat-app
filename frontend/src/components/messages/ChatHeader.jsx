import { useState, useEffect } from "react";
import { useAuthContext } from "../../context/AuthContext";
import useConversation from "../../zustand/useConversation";

const ChatHeader = () => {
	const { selectedConversation } = useConversation();
	const { authUser } = useAuthContext();
	const [profilePic, setProfilePic] = useState("");

	useEffect(() => {
		if (selectedConversation) {
			setProfilePic(selectedConversation.profilePic);
		}
	}, [selectedConversation]);

	return (
		<div className='bg-gray-700 p-4 flex items-center'>
			<img
				src={profilePic || "https://via.placeholder.com/40"}
				alt='User avatar'
				className='w-10 h-10 rounded-full object-cover'
			/>
			<div className='ml-3'>
				<p className='text-white font-bold'>
					{selectedConversation ? selectedConversation.fullName : 'No conversation selected'}
				</p>
				{selectedConversation && (
					<p className='text-gray-400 text-sm'>Active</p>
				)}
			</div>
		</div>
	);
};

export default ChatHeader;
