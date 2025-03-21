import { Box, Container, Typography, Link, Divider } from '@mui/material';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.mode === 'light' 
          ? theme.palette.grey[100] 
          : theme.palette.grey[900]
      }}
    >
      <Divider sx={{ mb: 3 }} />
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            &copy; {currentYear} SmartPlanner Scheduler. All rights reserved.
          </Typography>
          
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              mt: { xs: 2, sm: 0 }
            }}
          >
            <Link href="#" color="inherit" underline="hover">
              <Typography variant="body2" color="text.secondary">
                Privacy Policy
              </Typography>
            </Link>
            <Link href="#" color="inherit" underline="hover">
              <Typography variant="body2" color="text.secondary">
                Terms of Service
              </Typography>
            </Link>
            <Link href="#" color="inherit" underline="hover">
              <Typography variant="body2" color="text.secondary">
                Contact
              </Typography>
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 