import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RequireArtisan() {
  const { isAuthenticated, isArtisan, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="auth-loading" role="status">Loading your account...</div>;
  }

  if (!isAuthenticated || !isArtisan) {
    const redirect = encodeURIComponent(location.pathname || '/seller/dashboard');
    return <Navigate to={`/artisan/login?redirect=${redirect}`} replace />;
  }

  return <Outlet />;
}
