import { Box, Container } from '@mui/material';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * Layout component to wrap all pages
 * Includes navbar and container for consistent layout
 */
const Layout = ({ children }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Navbar />
      <Container 
        component="main" 
        sx={{ 
          flexGrow: 1,
          py: { xs: 2, sm: 4 },
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </Container>
      <Footer />
    </Box>
  );
};

export default Layout; 