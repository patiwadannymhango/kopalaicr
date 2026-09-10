import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import RequireTeamAuth from './components/RequireTeamAuth';
import Home from './pages/Home';
import About from './pages/About';
import Categories from './pages/Categories';
import Sponsors from './pages/Sponsors';
import Register from './pages/Register';
import Login from './pages/Login';
import TeamDashboard from './pages/TeamDashboard';
import SplashLoader from './components/SplashLoader';
import { AuthProvider } from './context/AuthContext';
import './App.css';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 700);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) {
    return <SplashLoader />;
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/sponsors" element={<Sponsors />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route element={<RequireTeamAuth />}>
              <Route path="/dashboard" element={<TeamDashboard />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
