import { useEffect, useState } from "react";
import "./allUsers.css";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/socketContext";
import swal from "sweetalert2";


const AllUsers = ({ onUserClick, setFriendReqCount, friendReqCount }) => {
  const { loginUserCx } = useAuth();
  const [loginUser, setLoginUser] = useState({});
  const be_url = import.meta.env.VITE_BE_URL;
  const socket = useSocket();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  const { token } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${be_url}/dashbord/allUsers`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch users");

        const data = await res.json();
        setUsers(data.users || []);
        setLoginUser(data.loginUser || {});
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers();
  }, [token]);

  const deleteFriendRequestAU = async (userId) => {
    try {
      const res = await fetch(`${be_url}/dashbord/delete-friend-request/${userId}`, {
        method: "PATCH", headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      if (res.ok) {
        setLoginUser((prev) => ({
          ...prev,
          friendReq: prev.friendReq.filter((id) => id !== userId),
        }));
        setFriendReqCount(Math.max(0, friendReqCount - 1));
      }
    } catch (err) {
      swal.fire({
        title: "Failed",
        text: "Unable to delete request. Try again later.",
        icon: "error",
      });
    }
  };

  useEffect(() => {
    if (!socket) return;

    // --- handler functions ---
    const handleFriendRequestAU = (reqUser, count) => {
      setLoginUser((prev) => ({
        ...prev,
        friendReq: [...(prev.friendReq || []), reqUser._id],
      }));
    };

    const handleReqAcceptedAU = (user) => {
      setLoginUser((prev) => ({
        ...prev,
        friendReq: (prev.friendReq || []).filter((id) => id !== user._id),
        friends: [...(prev.friends || []), user._id],
      }));
      setFriendReqCount(Math.max(0, friendReqCount - 1));
    };

    const handleReqAcceptanceFailureAU = (err, result, reqSender) => {
      if (result === "no req") {
        swal.fire({
          title: "Failed to accept request",
          text: err,
          icon: "error",
        });
        setLoginUser((prev) => ({
          ...prev,
          friendReq: (prev.friendReq || []).filter((id) => id !== reqSender),
        }));
        setFriendReqCount(Math.max(0, friendReqCount - 1));
      } else {
        swal.fire({
          title: "Failed to accept request",
          text: err,
          icon: "error",
        });
      }
    };

    const handleFriendRequestFailureAU = (err, result) => {
      swal.fire({
        title: "Failed to send request.Try again later.",
        text: err,
        icon: "error",
      });
      if (result === "in friendReq") {
        setLoginUser((prev) => ({
          ...prev,
          friendReq: [...(prev.friendReq || []), reqUser._id],
        }));
      }
    };

    const handleFriendReqAckAU = (id) => {
      setLoginUser((prev) => ({
        ...prev,
        sentReq: [...(prev.sentReq || []), id],
      }));
    }

    // --- attach listeners ---
    socket.on("friendRequest", handleFriendRequestAU);
    socket.on('friendRequest ack', handleFriendReqAckAU);
    socket.on("friendRequest failure", handleFriendRequestFailureAU);
    socket.on("req Acceptance failure", handleReqAcceptanceFailureAU);
    socket.on("req Accepted ack", handleReqAcceptedAU);


    // --- cleanup ---
    return () => {
      socket.off("friendRequest", handleFriendRequestAU);
      socket.off('friendRequest ack', handleFriendReqAckAU);
      socket.off("friendRequest failure", handleFriendRequestFailureAU);
      socket.off("req Acceptance failure", handleReqAcceptanceFailureAU);
      socket.off("req Accepted ack", handleReqAcceptedAU);
    };
  }, [socket]);

  // Handle connect (send request)
  const handleConnect = (userId) => {
    socket.emit("friend request sent", { to: userId });
  };

  // Handle accept
  const handleAccept = (userId) => {
    socket.emit("friend request accept", { from: userId });
  };

  // Filter users based on search input
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

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
      <div className="user-list">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => {
            const isSent = loginUser.sentReq?.includes(user._id);
            const isFriendReq = loginUser.friendReq?.includes(user._id);
            const isFriend = loginUser.friends?.includes(user._id);

            return (
              <div className="user-container" key={user._id}>
                <div className="user" data-user={user._id} onClick={() => onUserClick(user._id)}>
                  <img src={user.profile} alt={user.name} />
                  <span>
                    {user.name.length > 15
                      ? user.name.slice(0, 15) + "..."
                      : user.name}
                  </span>
                </div>

                {/* Buttons based on state */}
                <div className="btn">
                  {isSent ? (
                    <button className="req-sent-btn" disabled>
                      Sent
                    </button>
                  ) : isFriendReq ? (
                    <div style={{ display: "flex" }}>
                      <button
                        className="accpet-btn"
                        style={{ marginRight: ".7rem" }}
                        onClick={() => handleAccept(user._id)}
                      >
                        Accept
                      </button>
                      <i
                        className="fa-solid fa-square-xmark cancel"
                        onClick={() => deleteFriendRequestAU(user._id)}
                      ></i>
                    </div>
                  ) : isFriend ? (
                    <div className="friends">Friend</div>
                  ) : (
                    <button
                      className="connect-btn"
                      onClick={() => handleConnect(user._id)}
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ color: "white", textAlign: "center", marginTop: "3rem" }}>
            No users
          </div>
        )}
      </div>
    </div>
  );
};

export default AllUsers;
