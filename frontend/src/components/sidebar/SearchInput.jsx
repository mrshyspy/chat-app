import { useState } from "react";
import { IoSearchSharp } from "react-icons/io5";
import useConversation from "../../zustand/useConversation";
import useGetConversations from "../../hooks/useGetConversations";
import toast from "react-hot-toast";

const SearchInput = () => {
	const [search, setSearch] = useState("");
	const { setSelectedConversation } = useConversation();
	const { conversations } = useGetConversations();

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!search) return;
		if (search.length < 3) {
			return toast.error("Search term must be at least 3 characters long");
		}

		const conversation = conversations.find((c) => c.fullName.toLowerCase().includes(search.toLowerCase()));

		if (conversation) {
			setSelectedConversation(conversation);
			setSearch("");
		} else toast.error("No such user found!");
	};

	return (
		<form onSubmit={handleSubmit} className='flex items-center gap-2 p-2 bg-gray-800 rounded-full'>
			<input
				type='text'
				placeholder='Search…'
				className='bg-gray-700 text-gray-200 placeholder-gray-500 rounded-full px-4 py-2 focus:outline-none'
				value={search}
				onChange={(e) => setSearch(e.target.value)}
			/>
			<button type='submit' className='bg-blue-500 p-2 rounded-full hover:bg-blue-600 transition duration-300'>
				<IoSearchSharp className='w-6 h-6 text-white' />
			</button>
		</form>
	);
};

export default SearchInput;
