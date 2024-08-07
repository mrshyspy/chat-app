import Conversations from "./Conversations";
import LogoutButton from "./LogoutButton";
import SearchInput from "./SearchInput";

const Sidebar = () => {
    return (
        <div className='border-r border-gray-700 p-4 flex flex-col bg-gray-900 h-full'>
            <SearchInput />
            <div className='border-b border-gray-700 my-3'></div>
            <Conversations />
            <LogoutButton />
        </div>
    );
};

export default Sidebar;
