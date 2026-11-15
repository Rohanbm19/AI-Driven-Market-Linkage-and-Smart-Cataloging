import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RequireBuyer() {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return <div className="auth-loading" role="status">Loading your account...</div>;
  }

  if (isAuthenticated && role === 'artisan') {
    return <Navigate to="/seller/dashboard" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/buyer/login?redirect=%2Fbuyer%2Fprofile" replace />;
  }

  return <Outlet />;
}
