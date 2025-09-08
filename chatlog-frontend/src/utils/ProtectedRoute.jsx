import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

function ProtectedRoute({ children }) {
  const { token, isLoading } = useAuth();
  if (isLoading) {    
    return <div>Loading...</div>; // or a spinner component
  }

  if (!token) {    
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
