import React, { useEffect, useState, useRef } from 'react';
import { io } from "socket.io-client";
import Swal from 'sweetalert2';
import './dashbord.css';
import AOS from "aos";
import "aos/dist/aos.css";
import UserChats from '../../components/userChats/userChats';
import Friends from '../../components/friends/friends';
import AllUsers from '../../components/allUsers/allUsers';
import ResetPassword from '../../components/resetPassword/resetPassword';
import Profile from '../../components/profile/profile';
import ShowUserDetail from '../../components/showUserDetails/showUserDetails';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from "../../contexts/socketContext"

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
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [loading, setLoading] = useState('');
    const [currentChatUser, setCurrentChatUser] = useState({ name: '', profile: '', id: '' });

    const { token } = useAuth();
    const be_url = import.meta.env.VITE_BE_URL;

    const socket = useSocket();
    const msgScreenRef = useRef(null);

    useEffect(() => {
            AOS.init({
                once: true, // animation happens only once
            });
        }, []);

    const handleUserClick = (id) => {
        setWebPageContent(<ShowUserDetail userId={id} />);
    };

    const fetchUser = async () => {
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

        const handleMessage = (msg) => {
            const time = new Date().toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            });

            const newMessage = {
                message: msg,
                time,
                sender: 'receiver',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, newMessage]);
        };

        // Initialize socket connection
        if (socket) {

            // Attach all event listeners
            socket.on('friendRequest', handleFriendRequest);
            socket.on('req Accepted ack', handleReqAcceptedAck);
            socket.on('unfriended ack', handleUnfriendedAck);
            socket.on('message', handleMessage);
        }

        // Cleanup
        return () => {
            window.removeEventListener('resize', fixVH);

            if (!socket) return;

            socket.off('friendRequest', handleFriendRequest);
            socket.off('req Accepted ack', handleReqAcceptedAck);
            socket.off('unfriended ack', handleUnfriendedAck);
            socket.off('message', handleMessage);
        };
    }, [socket, loginUserCx]);

    useEffect(() => {
        // Auto-scroll messages to bottom
        if (msgScreenRef.current) {
            msgScreenRef.current.scrollTop = msgScreenRef.current.scrollHeight;
        }
    }, [messages]);

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
        setMessages([{ message: 'Loading...', sender: 'system', timestamp: new Date() }]);

        // Load chat history
        try {

            const response = await fetch(`${be_url}/dashbord/loadChat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ recieverId: userId })
            });

            const data = await response.json();
            const formattedMessages = [];

            data.forEach((item, index) => {
                // Add date separator if needed
                if (index === 0 || item.createdAt.split('T')[0] !== data[index - 1].createdAt.split('T')[0]) {
                    formattedMessages.push({
                        message: item.createdAt.split('T')[0],
                        sender: 'date',
                        timestamp: new Date(item.createdAt)
                    });
                }

                const utcTime = new Date(item.createdAt);
                const localTimeString = utcTime.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                });

                formattedMessages.push({
                    message: item.message,
                    time: localTimeString,
                    sender: loginUserCx === item.sender ? 'user' : 'receiver',
                    timestamp: new Date(item.createdAt)
                });
            });

            setMessages(formattedMessages);
        } catch (error) {
            console.error('Error loading chat:', error);
            setMessages([]);
        }
    };

    const sendMessage = () => {
        if (!friends.includes(openChat)) {
            Swal.fire({
                icon: 'error',
                title: 'Oops!',
                html: 'You can only chat with users who are your <b>friends</b>.',
                confirmButtonColor: '#d33',
                confirmButtonText: 'Okay'
            });
            return;
        }

        if (messageInput.trim()) {
            const time = new Date().toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            });

            const newMessage = {
                message: messageInput,
                time: time,
                sender: 'user',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, newMessage]);

            if (socket) {
                socket.emit('new message', { to: openChat, msg: messageInput });
            }

            setMessageInput('');
        }
    };

    const closeChat = () => {
        const isMobileOrTab = window.matchMedia("(max-width: 991px)").matches;

        if (isMobileOrTab) {
            setPersonalChatShow(false);
            setWebPageContentShow(true);
        }
        setChatVisible(false);
        setOpenChat(null);
        setMessages([]);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        sendMessage();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
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
                    ) : (
                        <div
                            id="personal-chat-child-2"
                            style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                        >
                            <div id="specific-user">
                                <img src={currentChatUser.profile} alt="" />
                                <span>{currentChatUser.name}</span>
                                <i
                                    id="cross"
                                    className="fa-regular fa-circle-xmark"
                                    onClick={closeChat}
                                    style={{ cursor: 'pointer' }}
                                />
                            </div>

                            <form id="chatCont" onSubmit={handleFormSubmit} style={{ overflow: "auto", flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div id="msg-cont" ref={msgScreenRef} style={{ flex: 1, overflowY: 'auto' }}>
                                    {messages.map((msg, index) => {
                                        if (msg.sender === 'date') {
                                            return (
                                                <div
                                                    key={index}
                                                    style={{
                                                        textAlign: 'center',
                                                        color: 'white',
                                                        marginTop: '2px'
                                                    }}
                                                >
                                                    {msg.message}
                                                </div>
                                            );
                                        } else if (msg.sender === 'system') {
                                            return (
                                                <p
                                                    key={index}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '50%',
                                                        left: '50%',
                                                        transform: 'translate(-50%, -50%)',
                                                        color: 'white',
                                                        fontSize: '2rem',
                                                        marginRight: '1rem'
                                                    }}
                                                >
                                                    <i className="fa-solid fa-spinner fa-spin-pulse"></i>
                                                </p>
                                            );
                                        } else {
                                            const isUser = msg.sender === 'user';
                                            return (
                                                <div
                                                    key={index}
                                                    className={isUser ? 'user-msg-cont' : 'reciever-msg-cont'}
                                                >
                                                    <span className={isUser ? 'user-msg' : 'reciever-msg'}>
                                                        {msg.message}
                                                        <sub style={{ fontSize: '11px', marginLeft: '.6rem' }}>
                                                            {msg.time}
                                                        </sub>
                                                    </span>
                                                </div>
                                            );
                                        }
                                    })}
                                </div>

                                <div style={{ display: 'flex' }}>
                                    <input
                                        type="text"
                                        name="message"
                                        id="msg"
                                        placeholder="Enter your message here"
                                        autoComplete="off"
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                    />
                                    <button id="send" type="submit">Send</button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

export default Dashbord;