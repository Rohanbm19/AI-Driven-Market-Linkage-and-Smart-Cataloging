import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RequireArtisan() {
  const { isAuthenticated, isArtisan } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !isArtisan) {
    const redirect = encodeURIComponent(location.pathname || '/seller/dashboard');
    return <Navigate to={`/login?role=artisan&redirect=${redirect}`} replace />;
  }

  return <Outlet />;
}
