import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set auth token
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  };

  // Load user
  const loadUser = async () => {
    try {
      setLoading(true);
      if (token) {
        setAuthToken(token);
        const res = await axios.get('/api/users/me');
        setUser(res.data);
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('Error loading user:', err.response?.data?.msg || err.message);
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setError(err.response?.data?.msg || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  // Register user
  const register = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post('/api/users/register', formData);
      const newToken = res.data.token;
      setToken(newToken);
      setAuthToken(newToken);
      await loadUser();
      return true;
    } catch (err) {
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        // Handle validation errors array
        const errorMsg = err.response.data.errors.map(e => e.msg).join(', ');
        setError(errorMsg);
      } else {
        // Handle generic error
        setError(err.response?.data?.message || 'Registration failed');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post('/api/users/login', formData);
      const newToken = res.data.token;
      setToken(newToken);
      setAuthToken(newToken);
      await loadUser();
      return true;
    } catch (err) {
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        // Handle validation errors array
        const errorMsg = err.response.data.errors.map(e => e.msg).join(', ');
        setError(errorMsg);
      } else {
        // Handle generic error
        setError(err.response?.data?.message || 'Invalid credentials');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    setToken(null);
    setAuthToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  };

  // Update user profile
  const updateProfile = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.put('/api/users/me', formData);
      setUser(res.data);
      return true;
    } catch (err) {
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        // Handle validation errors array
        const errorMsg = err.response.data.errors.map(e => e.msg).join(', ');
        setError(errorMsg);
      } else {
        // Handle generic error
        setError(err.response?.data?.message || 'Failed to update profile');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      await axios.put('/api/users/me', { password: newPassword, currentPassword });
      return true;
    } catch (err) {
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        // Handle validation errors array
        const errorMsg = err.response.data.errors.map(e => e.msg).join(', ');
        setError(errorMsg);
      } else {
        // Handle generic error
        setError(err.response?.data?.message || 'Failed to change password');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Clear errors
  const clearError = () => setError(null);

  // Load user data when token changes
  useEffect(() => {
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated,
        loading,
        error,
        register,
        login,
        logout,
        loadUser,
        updateProfile,
        changePassword,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 