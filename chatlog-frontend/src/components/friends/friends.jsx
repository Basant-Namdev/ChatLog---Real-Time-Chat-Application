import React, { useEffect, useState, useRef } from "react";
import "./friends.css";
import { useAuth } from "../../contexts/AuthContext"
import { useSocket } from "../../contexts/socketContext";
import swal from "sweetalert2";

const Friends = ({ onUserClick, chat, setFriendReqCount, friendReqCount, }) => {
  const { loginUserCx } = useAuth();
  const [friendReq, setFriendReq] = useState([]);
  const [friends, setFriends] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const be_url = import.meta.env.VITE_BE_URL;
  const { token } = useAuth();
  const socket = useSocket();

  const fetchFriends = async () => {
    try {
      const res = await fetch(`${be_url}/dashbord/friends`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }
      });
      const data = await res.json();

      setFriends(data.friends);
      setFriendReq(data.friendReq);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();

    // --- handler functions ---
    const handleFriendRequest = (reqUser, count) => {
      setFriendReq((prev) => {
        // Check if this user already exists in the list
        const alreadyExists = prev.some((u) => u._id === reqUser._id);

        if (alreadyExists) {
          return prev; // no change
        }
        return [...prev, reqUser]; // add new unique user
      });
    };

    const handleUnfriendedAckFR = (id) => {
      setFriends((prev) => prev.filter((u) => u._id !== id));
    };

    const handleReqAccepted = (user) => {
      setFriendReq((prev) => prev.filter((u) => u._id !== user._id));
      setFriends((prev) => [...prev, user]);
      setFriendReqCount(Math.max(0, friendReqCount - 1));
    };

    const handleReqAcceptanceFailureFR = (err, result, reqSender) => {
      swal.fire({
        title: "Failed to accept request",
        text: err,
        icon: "error",
      });
      if (result === "no req") {
        setFriendReq((prev) => prev.filter((u) => u._id !== reqSender));
        setFriendReqCount(Math.max(0, friendReqCount - 1));
      }
    };

    // --- attach listeners ---
    if (socket) {
      socket.on("req Acceptance failure", handleReqAcceptanceFailureFR);
      socket.on("friendRequest", handleFriendRequest);
      socket.on("req Accepted ack", handleReqAccepted);
      socket.on("unfriended ack", handleUnfriendedAckFR);
    }

    // --- cleanup ---
    return () => {
      if (socket) {
        socket.off("req Acceptance failure", handleReqAcceptanceFailureFR);
        socket.off("friendRequest", handleFriendRequest);
        socket.off("req Accepted ack", handleReqAccepted);
        socket.off("unfriended ack", handleUnfriendedAckFR);
      }
    };
  }, [socket]);


  // Filter users based on search
  const filteredFriendReq = friendReq.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredFriends = friends.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  // Actions
  const acceptFriendRequest = (userId) => {
    socket.emit('friend request accept', { from: userId });
  };

  const deleteFriendRequest = async (userId) => {
    try {
      const res = await fetch(`${be_url}/dashbord/delete-friend-request/${userId}`, {
        method: "PATCH", headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      if (res.ok) {
        setFriendReq((prev) => prev.filter((u) => u._id !== userId));
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

  return (
    <div style={{ height: "100vh", overflowY: "hidden" }}>
      {/* Search */}
      <input
        type="search"
        id="search"
        placeholder="search here..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Friend Requests Section */}
      <div id="friendReq">
        <div style={{ padding: ".5rem", display: "flex", justifyContent: "space-between" }}>
          <p style={{ color: "white" }}>
            friend requests{" "}
            {friendReq.length > 0 && (
              <span className="friends-count">{friendReq.length}</span>
            )}
          </p>
          <span>
            <i
              className="fa-solid fa-angle-up arrow"
              style={{ display: showRequests ? "inline-block" : "none" }}
              onClick={() => setShowRequests(false)}
            ></i>
            <i
              className="fa-solid fa-angle-down arrow"
              style={{ display: !showRequests ? "inline-block" : "none" }}
              onClick={() => setShowRequests(true)}
            ></i>
          </span>
        </div>

        {showRequests && (
          <div
            id="requests"
            style={{
              height: "30vh",
              overflowY: "auto",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {filteredFriendReq.length > 0 ? (
              filteredFriendReq.map((req) => (
                <div key={req._id} className="user-req-container user-container">
                  <div className="user" data-user={req._id} onClick={() => onUserClick(req._id)}>
                    <img src={req.profile} alt={req.name} />
                    <span>
                      {req.name.length > 15 ? req.name.slice(0, 15) + "..." : req.name}
                    </span>
                  </div>
                  <div className="btn" style={{ display: "flex" }}>
                    <button
                      className="accpet-btn username"
                      style={{ marginRight: ".7rem" }}
                      onClick={() => acceptFriendRequest(req._id)}
                    >
                      Accept
                    </button>
                    <div>
                      <i
                        className="fa-solid fa-square-xmark cancel"
                        onClick={() => deleteFriendRequest(req._id)}
                      ></i>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: "white", textAlign: "center", marginTop: "5rem" }}>
                No Friend Requests Available.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Friends Section */}
      <div
        className="user-list"
        id="friends"
        style={{ overflowY: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {filteredFriends.length > 0 ? (
          filteredFriends.map((fr) => (
            <div className="user-container" key={fr._id}>
              <div className="user" data-user={fr._id} onClick={() => onUserClick(fr._id)}>
                <img src={fr.profile} alt={fr.name} />
                <span>
                  {fr.name.length > 15 ? fr.name.slice(0, 15) + "..." : fr.name}
                </span>
              </div>
              <div className="btn">
                <button className="message-opt" onClick={() => chat(fr._id, fr.name, fr.profile)}>
                  <i className="fa-regular fa-message"></i>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ color: "white", textAlign: "center", marginTop: "3rem" }}>
            No Friends
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;
