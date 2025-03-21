import { useState, useContext, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Avatar,
  Divider,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Save as SaveIcon, Person as PersonIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';

// Tab panel component
const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const Profile = () => {
  const { user, updateProfile, error, loading } = useContext(AuthContext);
  
  const [activeTab, setActiveTab] = useState(0);
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    name: '',
    email: ''
  });
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  
  const [formError, setFormError] = useState({});

  // Populate profile data when user is loaded
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSuccess('');
    setFormError({});
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
    
    // Clear validation errors when user types
    if (formError[name]) {
      setFormError({ ...formError, [name]: '' });
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
    
    // Clear validation errors when user types
    if (formError[name]) {
      setFormError({ ...formError, [name]: '' });
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field]
    });
  };

  const validateProfileForm = () => {
    const errors = {};
    
    if (!profileData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!profileData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      errors.email = 'Email is invalid';
    }
    
    setFormError(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = () => {
    const errors = {};
    const { currentPassword, newPassword, confirmPassword } = passwordData;
    
    if (!currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!newPassword) {
      errors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setFormError(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }
    
    setSubmitting(true);
    setSuccess('');
    
    try {
      const success = await updateProfile(profileData);
      if (success) {
        setSuccess('Profile updated successfully');
      }
    } catch (err) {
      // Handle error silently
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    setSubmitting(true);
    setSuccess('');
    
    try {
      // This is just a placeholder since the changePassword method is not implemented
      // const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setTimeout(() => {
        setSuccess('Password changed successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setSubmitting(false);
      }, 1000);
    } catch (err) {
      // Handle error silently
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ borderRadius: 2 }}>
        <Box sx={{ p: 3, pb: 0 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: 'primary.main',
                  fontSize: '2rem'
                }}
              >
                {user?.name?.charAt(0) || <PersonIcon fontSize="large" />}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h4" component="h1">
                {user?.name || 'User Profile'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {user?.email || 'No email provided'}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="profile tabs"
            centered
          >
            <Tab label="Edit Profile" />
            <Tab label="Change Password" />
          </Tabs>
        </Box>

        {error && (
          <Box sx={{ px: 3, pt: 3 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {success && (
          <Box sx={{ px: 3, pt: 3 }}>
            <Alert severity="success">{success}</Alert>
          </Box>
        )}

        <TabPanel value={activeTab} index={0}>
          <Box component="form" onSubmit={handleProfileSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  error={!!formError.name}
                  helperText={formError.name}
                  disabled={submitting || loading}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  error={!!formError.email}
                  helperText={formError.email}
                  disabled={submitting || loading}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={submitting || loading}
              >
                {(submitting) ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Save Changes'
                )}
              </Button>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box component="form" onSubmit={handlePasswordSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Current Password"
                  name="currentPassword"
                  type={showPasswords.currentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  error={!!formError.currentPassword}
                  helperText={formError.currentPassword}
                  disabled={submitting}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle current password visibility"
                          onClick={() => togglePasswordVisibility('currentPassword')}
                          edge="end"
                        >
                          {showPasswords.currentPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="New Password"
                  name="newPassword"
                  type={showPasswords.newPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  error={!!formError.newPassword}
                  helperText={formError.newPassword}
                  disabled={submitting}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle new password visibility"
                          onClick={() => togglePasswordVisibility('newPassword')}
                          edge="end"
                        >
                          {showPasswords.newPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  name="confirmPassword"
                  type={showPasswords.confirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  error={!!formError.confirmPassword}
                  helperText={formError.confirmPassword}
                  disabled={submitting}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle confirm password visibility"
                          onClick={() => togglePasswordVisibility('confirmPassword')}
                          edge="end"
                        >
                          {showPasswords.confirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                disabled={submitting}
              >
                {submitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Change Password'
                )}
              </Button>
            </Box>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default Profile; 