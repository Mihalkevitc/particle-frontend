import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Header } from '@/components/Header';
import { Feed } from '@/pages/Feed';
import { PresetPage } from '@/pages/PresetPage';
import { Constructor } from '@/pages/Constructor';
import { Profile } from '@/pages/Profile';
import { Auth } from '@/pages/Auth';

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Header />
      <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/preset/:id" element={<PresetPage />} />
          <Route
            path="/constructor"
            element={isAuthenticated ? <Constructor /> : <Navigate to="/auth" />}
          />
          <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/auth" />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
