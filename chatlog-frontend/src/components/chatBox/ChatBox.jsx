import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/socketContext';
import Swal from 'sweetalert2';
// import './ChatBox.css';

const ChatBox = ({ currentChatUser, setPersonalChatShow, setWebPageContentShow, setChatVisible, setOpenChat, friends }) => {
    const be_url = import.meta.env.VITE_BE_URL;
    const socket = useSocket();
    const { token, loginUserCx } = useAuth();
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');


    const msgScreenRef = useRef(null);
    useEffect(() => {
        // Auto-scroll messages to bottom
        if (msgScreenRef.current) {
            msgScreenRef.current.scrollTop = msgScreenRef.current.scrollHeight;
        }
    }, [messages]);
    useEffect(()=>{
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
        if (socket) socket.on('message', handleMessage);
        return ()=>{
            if ( socket ) socket.off('message', handleMessage);
        }
    },[socket,loginUserCx])
    // Load chat history
    const loadChat = async (userId) => {
        setMessageInput('');
        setMessages([{ message: 'Loading...', sender: 'system', timestamp: new Date() }]);
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
    }
    useEffect(() => {
        loadChat(currentChatUser.id)
    }, [currentChatUser]);

    const sendMessage = () => {
        if (!friends.includes(currentChatUser.id)) {
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
                socket.emit('new message', { to: currentChatUser.id, msg: messageInput });
            }

            setMessageInput('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
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
    return (
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
    );
};

export default ChatBox;