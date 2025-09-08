// useSocketEvent.js
import { useEffect } from "react";
import { useSocket } from "../contexts/socketContext"; 

export const useSocketEvent = (eventName, handler) => {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on(eventName, handler);

    // cleanup
    return () => {
      socket.off(eventName, handler);
    };
  }, [socket, eventName, handler]);
};
