import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./showUserDetails.css";
import { useSocket } from "../../contexts/socketContext";
import swal from "sweetalert2";


export default function ShowUserDetail({ userId }) {
  const { loginUserCx } = useAuth();
  const be_url = import.meta.env.VITE_BE_URL;
  const socket = useSocket()
  const [user, setUser] = useState(null);
  const [relation, setRelation] = useState(""); 
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const res = await fetch(`${be_url}/dashbord/showUserDetails/?userId=${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch user details");
        const data = await res.json();
        setUser(data.user);
        setRelation(data.relation);
      } catch (err) {
        console.error("Error fetching user details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId]);

  // Handler functions
  const handleReqAcceptanceFailure = (err,result) => {
    swal.fire({
      title: "Failed to accept request",
      text: err,
      icon: "error",
    });
    if(result==="no req") {setRelation("none");}
  };

  const handleUnfriendedAckFailure = (err) => {
    swal.fire({
      title: "Failed to unfriend",
      text: err,
      icon: "error",
    });
  };

  const handleFriendRequestFailure = (err,result) => {
    swal.fire({
      title: "Failed to send request.Try again later.",
      text: err,
      icon: "error",
    });
    console.log(result);
    
    if(result==="in friendReq") {setRelation("friendReq");}
  };

  const handleReqAcceptedAck = () => {
    setRelation("friends");
  };
  const handleUnfriendedAckSUD = () => {
    setRelation("none");
  }

  // useEffect with socket
  useEffect(() => {
    if (loginUserCx !== null && socket) {
      socket.on("req Acceptance failure", handleReqAcceptanceFailure);
      socket.on("unfriended ack", handleUnfriendedAckSUD);
      socket.on("unfriended ack failure", handleUnfriendedAckFailure);
      socket.on("friendRequest failure", handleFriendRequestFailure);
      socket.on("req Accepted ack", handleReqAcceptedAck);
      socket.on("friendRequest ack", handleFriendRequestAckSUD);
    }

    return () => {
      if (!socket) return;
      socket.off("req Acceptance failure", handleReqAcceptanceFailure);
      socket.off("unfriended ack", handleUnfriendedAckSUD);
      socket.off("unfriended ack failure", handleUnfriendedAckFailure);
      socket.off("friendRequest failure", handleFriendRequestFailure);
      socket.off("req Accepted ack", handleReqAcceptedAck);
      socket.off("friendRequest ack", handleFriendRequestAckSUD);
    };
  }, [socket, loginUserCx]);


  // ---- Button handlers ----
  const handleCancelRequest = async () => {
    try {
      const res = await fetch(`${be_url}/dashbord/cancel-sent-request/${userId}`, {
        method: "PATCH", headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      if (res.ok) {
        setRelation("none");
      }
    } catch (err) {
      swal.fire({
        title: "Failed",
        text: "Unable to cancel request. Try again later.",
        icon: "error",
      });
    }
  };

  const deleteFriendRequest = async () => {
    try {
      const res = await fetch(`${be_url}/dashbord/delete-friend-request/${userId}`, {
        method: "PATCH", headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      if (res.ok) {
        setRelation("none");
      } else {
        setRelation("none");
      }
    } catch (err) {
      swal.fire({
        title: "Failed",
        text: "Unable to delete request. Try again later.",
        icon: "error",
      });
    }
  };

  const handleSendRequest = () => {
    socket.emit("friend request sent", { to: userId });
  };

  const handleUnfriend = async () => {
    socket.emit("unfriended", { to: userId });
  };

  const handleAcceptRequest = () => {
    socket.emit("friend request accept", { from: userId });
  };
  const handleFriendRequestAckSUD = () => {
    setRelation("friendReqSent");
  }

  // ---- UI Render ----
  if (loading) return <p>Loading...</p>;
  if (!user) return <p>User not found</p>;

  return (
    <div id="user-detail-container">
      <div style={{ display: "flex", justifyContent: "center" }}>
        <img src={user.profile} alt="profile" className="profilePic" />
      </div>

      <div id="btn-container">
        {relation === "friends" ? (
          <>
            <button
              className="btn-s"
              style={{ color: "white", background: "none", border: "2px solid white", cursor: "not-allowed" }}
            >
              Friends
            </button>
            <button className="btn-s" id="unfriend" onClick={handleUnfriend}>
              Unfriend
            </button>
          </>
        ) : relation === "friendReq" ? (
          <>
            <button className="btn-s" id="accept-btn" onClick={handleAcceptRequest}>
              Accept
            </button>
            <button className="btn-s" style={{ backgroundColor: "red" }} onClick={deleteFriendRequest}>
              Delete
            </button>
          </>
        ) : relation === "friendReqSent" ? (
          <>
            <button id="sent-btn">Sent</button>
            <button className="btn-s" style={{ backgroundColor: "red" }} onClick={handleCancelRequest}>
              Cancel
            </button>
          </>
        ) : (
          <button className="btn-s" id="connect-btn" onClick={handleSendRequest}>
            Connect
          </button>
        )}
      </div>

      <div style={{ fontSize: "1.1rem", padding: ".5rem", color: "aqua" }}>Username</div>
      <hr style={{ marginBottom: ".5rem" }} />
      <div id="name">{user.name}</div>
    </div>
  );
}
