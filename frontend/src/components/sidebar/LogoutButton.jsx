import { BiLogOut } from "react-icons/bi";
import useLogout from "../../hooks/useLogout";

const LogoutButton = () => {
    const { loading, logout } = useLogout();

    return (
        <div className='mt-auto flex justify-center p-4 bg-gray-800'>
            {!loading ? (
                <BiLogOut className='w-6 h-6 text-white cursor-pointer hover:text-gray-400 transition duration-300' onClick={logout} />
            ) : (
                <span className='loading loading-spinner text-gray-400'></span>
            )}
        </div>
    );
};

export default LogoutButton;
