import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Can } from '@casl/react';
import { defineAbilityFor } from '../abilities/defineAbility';
import api from '../services/api';

const AuthContext = createContext();
export const AbilityContext = createContext();
export { Can };

// Initial Default Admin Credentials
export const DEFAULT_ADMIN_SEED = {
  role: 'Admin',
  name: 'System Admin',
  email: 'admin@peoplepay360.com',
  password: 'admin123',
  department: 'Executive Management',
  badgeClass: 'admin',
  desc: 'System Administrator — Onboard employees & higher authority users'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('peoplepay360_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('peoplepay360_token') || '');
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('peoplepay360_refresh_token') || '');
  const [loading, setLoading] = useState(false);

  // Dynamically compute CASL Ability whenever user changes
  const ability = useMemo(() => defineAbilityFor(user), [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('peoplepay360_token', token);
    } else {
      localStorage.removeItem('peoplepay360_token');
    }
  }, [token]);

  useEffect(() => {
    if (refreshToken) {
      localStorage.setItem('peoplepay360_refresh_token', refreshToken);
    } else {
      localStorage.removeItem('peoplepay360_refresh_token');
    }
  }, [refreshToken]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('peoplepay360_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('peoplepay360_user');
    }
  }, [user]);

  // Listen for automatic session expiration events from api interceptor
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setToken('');
      setRefreshToken('');
      localStorage.removeItem('peoplepay360_token');
      localStorage.removeItem('peoplepay360_refresh_token');
      localStorage.removeItem('peoplepay360_user');
    };

    window.addEventListener('auth:session_expired', handleExpired);
    return () => window.removeEventListener('auth:session_expired', handleExpired);
  }, []);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        const accToken = response.data.accessToken || response.data.token;
        const refToken = response.data.refreshToken;

        setUser(response.data.user);
        setToken(accToken);
        setRefreshToken(refToken);
        setLoading(false);
        return { success: true, user: response.data.user };
      }
    } catch (err) {
      setLoading(false);
      const errObj = err.response?.data?.error;
      const msg = errObj?.message || err.response?.data?.message || 'Failed to authenticate';
      return { success: false, message: msg, error: errObj, fields: errObj?.fields || null };
    }
  };

  // Logout handler
  const logout = async () => {
    const currentRefToken = localStorage.getItem('peoplepay360_refresh_token');
    if (currentRefToken) {
      try {
        await api.post('/auth/logout', { refreshToken: currentRefToken });
      } catch (e) {
        // Silent fail on network error during logout
      }
    }
    setUser(null);
    setToken('');
    setRefreshToken('');
    localStorage.removeItem('peoplepay360_token');
    localStorage.removeItem('peoplepay360_refresh_token');
    localStorage.removeItem('peoplepay360_user');
  };

  // Create User by Admin / Higher Authority
  const createNewUser = async (userData) => {
    try {
      const response = await api.post('/auth/users', userData);
      if (response.data.success) {
        return { success: true, user: response.data.user, message: response.data.message };
      }
    } catch (err) {
      const errObj = err.response?.data?.error;
      const msg = errObj?.message || err.response?.data?.message || 'Failed to create user';
      return { success: false, message: msg, error: errObj, fields: errObj?.fields || null };
    }
  };

  // Fetch Users List
  const fetchUsers = async (params = {}) => {
    try {
      const response = await api.get('/auth/users', { params });
      return response.data;
    } catch (err) {
      return { success: false, users: [], message: err.response?.data?.message || 'Failed to fetch users' };
    }
  };

  // Toggle Status Active/Inactive
  const toggleUserStatus = async (userId) => {
    try {
      const response = await api.patch(`/auth/users/${userId}/status`);
      return response.data;
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to toggle status' };
    }
  };

  // Hierarchy check if current logged-in user can create specified role
  const canCreateRole = (targetRole) => {
    if (!user) return false;
    const role = user.role;
    if (role === 'Admin') return true;
    if (role === 'HR Payroll Manager') {
      return ['HR Payroll User', 'HR Manager', 'Employee'].includes(targetRole);
    }
    if (role === 'HR Manager') {
      return targetRole === 'Employee';
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        ability,
        loading,
        login,
        logout,
        createNewUser,
        fetchUsers,
        toggleUserStatus,
        canCreateRole
      }}
    >
      <AbilityContext.Provider value={ability}>
        {children}
      </AbilityContext.Provider>
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
