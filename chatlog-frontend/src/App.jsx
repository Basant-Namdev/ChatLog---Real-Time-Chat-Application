import './App.css'
import { Routes, Route } from 'react-router-dom'
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import '@fortawesome/fontawesome-free/css/all.min.css';
import Home from './pages/home/home'
import Dashbord from './pages/dashbord/dashbord';
import ProtectedRoute from './utils/ProtectedRoute.jsx';
function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/dashbord"
          element={
            <ProtectedRoute>
              <Dashbord />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}

export default App
