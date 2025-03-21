import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

/**
 * PrivateRoute component to protect authenticated routes
 * Redirects to login if user is not authenticated
 */
const PrivateRoute = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  // Show loading indicator while checking authentication status
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute; 