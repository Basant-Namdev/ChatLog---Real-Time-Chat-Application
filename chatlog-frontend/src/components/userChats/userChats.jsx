import React, { useState, useEffect } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./userChats.css";
import { useAuth } from "../../contexts/AuthContext";

const UserChats = ({onUserClick,chat}) => {
  const [chatUser, setChatUser] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  // Fetch users from API
  const fetchUsersChats = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BE_URL}/dashbord/userChats`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }});
      const data = await res.json();
      
      setChatUser(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchUsersChats();
  }, []);

  // Filter users when search changes
  useEffect(() => {
    const filter = search.toLowerCase();
    setFilteredUsers(
      chatUser.filter((user) =>
        user.name.toLowerCase().includes(filter)
      )
    );
  }, [search, chatUser]);

  if (loading) {
    return <div style={{ color: "white", textAlign: "center" }}>Loading...</div>;
  }

  return (
    <div>
      {/* Search Box */}
      <input
        type="search"
        id="search"
        placeholder="search here..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* User List */}
      <div
        className="user-list"
        style={{
          overflowY: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div className="user-container" key={user._id}>
              <div className="user" data-user={user._id} onClick={() => onUserClick(user._id)}>
                <img src={user.profile} alt={user.name} />
                <span>
                  {user.name.length > 15
                    ? user.name.slice(0, 15) + "..."
                    : user.name}
                </span>
              </div>
              <div className="btn">
                <button
                  className="message-opt"
                  onClick={() => chat(user._id, user.name, user.profile)}
                >
                  <i className="fa-regular fa-message"></i>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ color: "white", textAlign: "center", marginTop: "3rem" }}>
            No Chats Found
          </div>
        )}
      </div>
    </div>
  );
};

export default UserChats;
