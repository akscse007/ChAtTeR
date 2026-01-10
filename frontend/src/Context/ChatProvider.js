import React, { createContext, useContext, useEffect, useState } from "react";

const ChatContext = createContext();

const ChatProvider = ({ children }) => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [user, setUser] = useState(null);
  const [notification, setNotification] = useState([]);
  const [chats, setChats] = useState([]); // 🔥 FIXED

  useEffect(() => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      setUser(userInfo || null);
    } catch (err) {
      console.error("Invalid userInfo in localStorage", err);
      setUser(null);
    }
  }, []);

  return (
    <ChatContext.Provider
      value={{
        selectedChat,
        setSelectedChat,
        user,
        setUser,
        notification,
        setNotification,
        chats,
        setChats,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const ChatState = () => useContext(ChatContext);

export default ChatProvider;
