import React, { useEffect, useState, useRef } from 'react';
import Swal from 'sweetalert2';
import './dashbord.css';
import UserChats from '../../components/userChats/userChats';
import Friends from '../../components/friends/friends';
import AllUsers from '../../components/allUsers/allUsers';
import ResetPassword from '../../components/resetPassword/resetPassword';
import Profile from '../../components/profile/profile';
import ShowUserDetail from '../../components/showUserDetails/showUserDetails';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from "../../contexts/socketContext"
import ChatBox from '../../components/chatBox/ChatBox';

const Dashbord = () => {
    const { loginUserCx, logout } = useAuth();
    const [loginUser, setLoginUser] = useState({});
    const [activeMenu, setActiveMenu] = useState(0);
    const [webPageContent, setWebPageContent] = useState(null);
    const [webPageContentShow, setWebPageContentShow] = useState(true);
    const [friendReqCount, setFriendReqCount] = useState(null);
    const [openChat, setOpenChat] = useState(null);
    const [chatVisible, setChatVisible] = useState(false);
    const [personalChatShow, setPersonalChatShow] = useState(true);
    const [friends, setFriends] = useState(loginUser?.friends || []);
    const [loading, setLoading] = useState('');
    const [currentChatUser, setCurrentChatUser] = useState({ name: '', profile: '', id: '' });
    const { token } = useAuth();
    const be_url = import.meta.env.VITE_BE_URL;
    const socket = useSocket();
    const handleUserClick = (id) => {
        setWebPageContent(<ShowUserDetail userId={id} />);
    };

    const fetchUser = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${be_url}/dashbord`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                }
            });
            const data = await res.json();

            setLoginUser(data.loginUser);
            setFriends(data.loginUser.friends || []);
            setFriendReqCount(data.friendReq.length);
        } catch (err) {
            console.error("Error fetching users:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Fetch user data on component mount
        fetchUser();
    }, []);

    const menuItems = [
        { icon: 'fa-regular fa-comment-dots', text: 'userChats', title: 'user chats' },
        { icon: 'fa-solid fa-user-group', text: 'friends' },
        { icon: 'fa-solid fa-users-between-lines', text: 'allUsers' },
        { icon: 'fa-solid fa-key', text: 'resetPassword' }
    ];

    useEffect(() => {
        // Load initial user chats
        loadUserchat();

        // Fix viewport height
        const fixVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        fixVH();
        window.addEventListener('resize', fixVH);

        // Socket event handlers
        const handleFriendRequest = (friendRequest, count) => {
            setFriendReqCount(count);
        };

        const handleReqAcceptedAck = (friend) => {
            setFriends(prev => [...prev, friend._id]);
            setFriendReqCount(prev => Math.max(0, prev - 1));
        };

        const handleUnfriendedAck = (id) => {
            setFriends(prev => prev.filter(friendId => friendId !== id));
        };

        // Initialize socket connection
        if (socket) {
            // Attach all event listeners
            socket.on('friendRequest', handleFriendRequest);
            socket.on('req Accepted ack', handleReqAcceptedAck);
            socket.on('unfriended ack', handleUnfriendedAck);
        }

        // Cleanup
        return () => {
            window.removeEventListener('resize', fixVH);

            if (!socket) return;

            socket.off('friendRequest', handleFriendRequest);
            socket.off('req Accepted ack', handleReqAcceptedAck);
            socket.off('unfriended ack', handleUnfriendedAck);
        };
    }, [socket, loginUserCx]);

    const loadUserchat = () => {
        setWebPageContent(<UserChats onUserClick={handleUserClick} chat={chat} />);
        setActiveMenu(0);
    };

    const handleMenuClick = async (index, menuText) => {
        if (menuText === 'userChats') {
            setWebPageContent(<UserChats onUserClick={handleUserClick} chat={chat} />);
            setActiveMenu(0);
            return;
        };
        if (menuText === 'friends') {
            setWebPageContent(<Friends onUserClick={handleUserClick} chat={chat} setFriendReqCount={setFriendReqCount} friendReqCount={friendReqCount} />);
            setActiveMenu(index);
            return;
        };
        if (menuText === 'allUsers') {
            setWebPageContent(<AllUsers onUserClick={handleUserClick} setFriendReqCount={setFriendReqCount} friendReqCount={friendReqCount} />);
            setActiveMenu(index);
            return;
        };
        if (menuText === 'resetPassword') {
            setWebPageContent(<ResetPassword />);
            setActiveMenu(index);
            return;
        };
        if (menuText === 'logout') {
            logout();
            return;
        };
        if (menuText === 'profile') {
            setWebPageContent(<Profile loginUser={loginUser} setLoginUser={setLoginUser} />);
            setActiveMenu(index);
            return;
        };
    };

     const handleResize = () => {
        const isMobileOrTablet = window.matchMedia("(max-width: 991px)").matches;

        if (isMobileOrTablet) {
            // On mobile, keep only one view visible at a time (chat or list)
            if (chatVisible) {
                setWebPageContentShow(false)
                setPersonalChatShow(true)
            } else {
                setWebPageContentShow(true)
                setPersonalChatShow(false)
            }
        } else {
            // Desktop view - show both panels            
            setWebPageContentShow(true)
            setPersonalChatShow(true)
        }
    };
    
    useEffect(() => {        
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        }
    }, [chatVisible]);

    const chat = async (userId, userName, userProfile) => {
        setOpenChat(userId);
        setCurrentChatUser({ name: userName, profile: userProfile, id: userId });

        const isMobileOrTab = window.matchMedia("(max-width: 991px)").matches;

        if (isMobileOrTab) {
            // Hide user list, show chat on mobile
            setWebPageContentShow(false);
            setPersonalChatShow(true);
        }
        setChatVisible(true);
    };

    return (
        <div id="cont">
            <div className="title ">
                <h3 className='fas fa-lg'>chatlog</h3>
                <div className="logout-title" onClick={() => logout()}>
                    <span style={{ color: 'white', fontSize: '1.5rem' }}>
                        <i className="fa-solid fa-right-from-bracket"></i>
                    </span>
                    <span style={{ display: 'none' }}>logout</span>
                </div>
            </div>

            {/* Menu Container */}
            <div id="dashbord" style={{ backgroundColor: 'darkslategrey' }}>
                <ul id="menu-cont">
                    {menuItems.map((item, index) => (
                        <li
                            key={index}
                            className={`menu menuFunc ${activeMenu === index ? 'active' : ''}`}
                            onClick={() => handleMenuClick(index, item.text)}
                        >
                            {item.text === 'friends' && friendReqCount > 0 && (
                                <span className="dashbord-count">
                                    {friendReqCount > 9 ? "9+" : friendReqCount}
                                </span>
                            )}
                            <i className={item.icon}></i>
                            <span className="menuText" title={item.title || item.text}>
                                {item.text}
                            </span>
                        </li>
                    ))}

                    <li className="menu menuFunc logout-sidenav" onClick={() => logout()}>
                        <i className="fa-solid fa-right-from-bracket"></i>
                        <span className="menuText" style={{ display: 'none' }}>logout</span>
                    </li>

                    <li
                        id="user-part"
                        className="menuFunc"
                        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
                        onClick={() => handleMenuClick(5, "profile")}
                    >
                        <img src={loginUser?.profile} alt="" />
                        <span className="menuText" style={{ display: 'none' }}>profile</span>
                    </li>
                </ul>
            </div>

            {/* User List Container */}
            {
                webPageContentShow && (
                    <div
                        className="webPageCont"
                    >{webPageContent}</div>
                )}


            {/* Personal Chat Container */}
            {personalChatShow && (
                <div
                    id="personal-chat"
                    style={{
                        width: '100%',
                        height: '100svh',
                        border: '2px solid grey',
                        position: 'relative'
                    }}
                >
                    {!chatVisible ? (
                        <div id="personal-chat-child-1">
                            Click on a chat to start a conversation
                        </div>
                    ) : (<ChatBox currentChatUser={currentChatUser} setPersonalChatShow={setPersonalChatShow} setWebPageContentShow={setWebPageContentShow} setChatVisible={setChatVisible} setOpenChat={setOpenChat} friends={friends}/>)}
                </div>
            )}

        </div>
    );
};

export default Dashbord;