// SocketContext.js
import { createContext, useEffect, useState, useContext } from "react";
import { useAuth } from "./AuthContext";
import { io } from "socket.io-client";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { loginUserCx } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
     if (!loginUserCx) return; // Wait until loginUserCx is available
    const newSocket = io(`${import.meta.env.VITE_BE_URL}/chat`, {
      query: { username: loginUserCx },
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [loginUserCx]);


  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
