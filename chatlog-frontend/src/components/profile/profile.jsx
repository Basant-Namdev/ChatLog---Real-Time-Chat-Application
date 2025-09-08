import React, { useState } from "react";
import Swal from "sweetalert2";
import { useAuth } from "../../contexts/AuthContext";

const Profile = ({ loginUser, setLoginUser }) => {
  const [name, setName] = useState(loginUser.name || "");
  const [username] = useState(loginUser.username || "");
  const [profileImg, setProfileImg] = useState(loginUser.profile || "");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const be_url = import.meta.env.VITE_BE_URL;
  const { token } = useAuth();

  // handle profile picture change
  const handleProfileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("image", file);
      setLoading(true);

      const res = await fetch(`${be_url}/dashbord/changeProfile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setProfileImg(data.profile);
        setLoginUser({ ...loginUser, profile: data.profile });
        Swal.fire("Success", "Profile picture updated!", "success");
      } else {
        Swal.fire("Error", data.message || "Something went wrong", "error");
      }
    } catch (error) {
      Swal.fire("Error", "Unable to update profile picture", "error");
    } finally {
      setLoading(false);
    }
  };

  // handle name change
  const handleNameChange = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${be_url}/dashbord/changeName`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();
      if (data.success) {
        setName(data.name);
        setIsEditing(false);
        Swal.fire("Success", "Name updated successfully!", "success");
      } else {
        Swal.fire("Error", data.message || "Something went wrong", "error");
      }
    } catch (error) {
      Swal.fire("Error", "Unable to update name", "error");
    }
  };

  return (
    <div
      id="profile-page-cont"
      style={{
        height: "31rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-around",
        padding: "1rem",
      }}
    >
      <h1 style={{ color: "white", padding: "1rem" }}>Profile</h1>

      {/* Profile image */}
      <div id="profile-img" style={{ display: "flex", justifyContent: "center" }}>
        <label style={{ cursor: "pointer" }}>
          <input
            type="file"
            accept="image/*"
            onChange={handleProfileChange}
            style={{ display: "none" }}
          />
          <img
            src={profileImg || "/images/blank profile.jpg"}
            alt="profile"
            style={{ width: "13rem", height: "13rem", borderRadius: "50%" }}
          />
        </label>
        {loading && (
          <div
            style={{
              width: "13rem",
              height: "13rem",
              borderRadius: "50%",
              backdropFilter: "blur(10px)",
              position: "absolute",
              top: "5.3rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <i className="fa-solid fa-spinner fa-spin-pulse" style={{ fontSize: "3rem" }} />
          </div>
        )}
      </div>

      {/* Username */}
      <div style={{ fontSize: "1.1rem", padding: ".5rem", color: "aqua" }}>Username</div>
      <hr />
      <div className="name-sec" style={{ fontSize: "1.5rem", display: "flex", justifyContent: "space-between", marginBottom: "1rem", color: "white" }}>
        {username}
      </div>

      {/* Name */}
      <div style={{ fontSize: "1.1rem", padding: ".5rem", color: "aqua" }}>Your name</div>
      <hr />
      <div className="name-sec-cont">
        {!isEditing ? (
          <div
            className="name-sec"
            style={{ fontSize: "1.5rem", display: "flex", justifyContent: "space-between", marginBottom: "1rem", color: "white" }}
          >
            <div>{name}</div>
            <div>
              <i
                className="fa-solid fa-pencil"
                style={{ fontSize: "1rem", cursor: "pointer" }}
                onClick={() => setIsEditing(true)}
              />
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleNameChange}
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "22.3rem",
                border: "none",
                background: "none",
                borderBottom: "1px solid",
                color: "white",
                fontSize: "1.2rem",
              }}
              required
            />
            <button type="submit" style={{ background: "none", border: "none", color: "white" }}>
              <i className="fa-solid fa-check" style={{ fontSize: "1.2rem", cursor: "pointer" }} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
