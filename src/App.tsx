import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Categories from './pages/Categories';
import Sponsors from './pages/Sponsors';
import Register from './pages/Register';
import Exhibitors from './pages/Exhibitors';
import SplashLoader from './components/SplashLoader';
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
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/sponsors" element={<Sponsors />} />
          <Route path="/register" element={<Register />} />
          <Route path="/exhibitors" element={<Exhibitors />} />
          <Route path="/vendors" element={<Exhibitors />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
