import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const be_url = import.meta.env.VITE_BE_URL;
  const navigate = useNavigate();
  const [loginUserCx, setLoginUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Add loading state


  const api = axios.create({
    baseURL: be_url,
    withCredentials: true,
  });

  useEffect(() => {
    const checkRefresh = async () => {
      try {
        const res = await api.post("/auth/refresh");
        if (res.data.success) {          
          setToken(res.data.token);
          setLoginUser(res.data.userId);
        } else {          
          setToken(null);
          navigate("/"); // redirect if refresh fails
        }
      } catch {        
        setToken(null);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkRefresh();
  }, []);

  useEffect(() => {
    let interval;
    if (token) {
      interval = setInterval(async () => {
        try {
          const res = await api.post("/auth/refresh");
          if (res.data.success) {
            setToken(res.data.token);
            setLoginUser(res.data.userId);
          }
        } catch (err) {
          logout();
        }
      }, 14 * 60 * 1000); // every 14 minutes
    }
    return () => clearInterval(interval);
  }, [token]);

  // login function
  const login = (user, jwt) => {
    setLoginUser(user);
    setToken(jwt);
  };

  // logout function
  const logout = async () => {
    try {
      // 👇 call backend API
      await api.get("/dashbord/logout", {
        headers: {
          Authorization: `Bearer ${token}`,
        }});

      // clear memory
      setLoginUser(null);
      setToken(null);

      navigate("/");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <AuthContext.Provider value={{ loginUserCx, isLoading, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
