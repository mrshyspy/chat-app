import { useSocketContext } from "../../context/SocketContext";
import useConversation from "../../zustand/useConversation";

const Conversation = ({ conversation, lastIdx, emoji }) => {
    const { selectedConversation, setSelectedConversation } = useConversation();

    const isSelected = selectedConversation?._id === conversation._id;
    const { onlineUsers } = useSocketContext();
    const isOnline = onlineUsers.includes(conversation._id);

    return (
        <>
            <div
                className={`flex gap-3 items-center hover:bg-gray-700 rounded-lg p-3 cursor-pointer transition duration-300 ease-in-out
                ${isSelected ? "bg-gray-700" : "bg-gray-800"}
            `}
                onClick={() => setSelectedConversation(conversation)}
            >
                <div className={`relative w-12 h-12 rounded-full overflow-hidden ${isOnline ? "ring-2 ring-green-500" : "ring-2 ring-gray-500"}`}>
                    <img src={conversation.profilePic} alt='user avatar' className="object-cover w-full h-full" />
                </div>

                <div className='flex flex-col flex-1 text-gray-100'>
                    <div className='flex justify-between'>
                        <p className='font-medium text-base'>{conversation.fullName}</p>
                        <span className='text-lg'>{emoji}</span>
                    </div>
                    {/* <p className='text-sm text-gray-400'>Last message preview here...</p> */}
                </div>

                {/* <div className='flex flex-col items-end'>
                    <span className='text-xs text-gray-500'>Time</span>
                    <span className='bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>1</span>
                </div> */}
            </div>

            {!lastIdx && <div className='border-t border-gray-700 my-2' />}
        </>
    );
};

export default Conversation;
