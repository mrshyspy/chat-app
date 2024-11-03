import { useAuthContext } from "../../context/AuthContext";
import { extractTime } from "../../utils/extractTime";
import useConversation from "../../zustand/useConversation";

const Message = ({ message }) => {
	const { authUser } = useAuthContext();
	const { selectedConversation } = useConversation();
	const fromMe = message.senderId === authUser._id;
	const formattedTime = extractTime(message.createdAt);
	const chatClassName = fromMe ? "chat-end" : "chat-start";
	const profilePic = fromMe ? authUser.profilePic : selectedConversation?.profilePic;
	const bubbleBgColor = fromMe ? "bg-blue-600" : "bg-gray-700";
	const shakeClass = message.shouldShake ? "shake" : "";

	const formatMessage = (msg) => {
		const maxLineLength = 40;
		const lines = [];
		for (let i = 0; i < msg.length; i += maxLineLength) {
			lines.push(msg.substring(i, i + maxLineLength));
		}
		return lines;
	};

	const formattedMessage = formatMessage(message.message);

	return (
		<div className={`chat ${chatClassName}`}>
			<div className='chat-image avatar'>
				<div className='w-10 rounded-full'>
					<img alt='User avatar' src={profilePic} />
				</div>
			</div>
			<div className={`chat-bubble text-white ${bubbleBgColor} ${shakeClass} p-3 rounded-xl`}>
				{formattedMessage.map((line, index) => (
					<p key={index} className="m-0">{line}</p>
				))}
			</div>
			<div className='chat-footer opacity-70 text-xs flex gap-1 items-center text-gray-400'>
				{formattedTime}
			</div>
		</div>
	);
};

export default Message;
