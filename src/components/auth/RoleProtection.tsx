import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface RoleProtectionProps {
  children: ReactNode;
  allowedRoles: string[];
  fallbackPath?: string;
}

export const RoleProtection = ({ 
  children, 
  allowedRoles, 
  fallbackPath = '/' 
}: RoleProtectionProps) => {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!userProfile) {
    return <Navigate to="/auth" replace />;
  }

  if (!allowedRoles.includes(userProfile.role)) {
    console.warn(`User with role ${userProfile.role} attempted to access restricted content`);
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};