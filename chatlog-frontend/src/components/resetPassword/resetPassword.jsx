import React, { useState } from "react";
import Swal from "sweetalert2";
import "./resetPassword.css";
import { useAuth } from "../../contexts/AuthContext";

const ResetPassword = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [cnfPassword, setCnfPassword] = useState("");
  const be_url = import.meta.env.VITE_BE_URL;
  const { token } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== cnfPassword) {
      Swal.fire({
        icon: "warning",
        title: "Password mismatch",
        text: "New password and confirm password do not match",
        confirmButtonColor: "#d33",
      });
      return;
    }

    try {
      const response = await fetch(`${be_url}/dashbord/passwordReset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // pass token for auth
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const result = await response.json();
      if (result.success) {
        Swal.fire({
          icon: "success",
          title: "Password changed successfully",
          text: result.message,
          confirmButtonColor: "green",
        });
        setOldPassword("");
        setNewPassword("");
        setCnfPassword("");
      } else {
        Swal.fire({
          icon: "info",
          title: "Wrong attempt",
          text: result.message,
          confirmButtonColor: "#d33",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong! Try again later.",
        confirmButtonColor: "#d33",
      });
      console.error("Error submitting form:", error);
    }
  };

  return (
    <form id="reset-pass-cont" onSubmit={handleSubmit}>
      <h1>Reset Password</h1>
      <div id="resetPass-child-cont">
        <div>
          <label htmlFor="oldPass">Old Password : </label>
          <input
            type="password"
            id="oldPass"
            className="reset-pass-inps"
            placeholder="Enter old password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="newPass">New Password : </label>
          <input
            type="password"
            id="newPass"
            className="reset-pass-inps"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="cnfPass">Confirm Password : </label>
          <input
            type="password"
            id="cnfPass"
            className="reset-pass-inps"
            placeholder="Confirm new password"
            value={cnfPassword}
            onChange={(e) => setCnfPassword(e.target.value)}
            required
          />
        </div>
      </div>
      <button type="submit" id="resetPassword">
        Submit
      </button>
    </form>
  );
};

export default ResetPassword;
