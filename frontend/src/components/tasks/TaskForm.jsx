import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  Snackbar,
  IconButton,
  InputAdornment,
  Chip,
  Stack,
  CircularProgress
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { TaskContext } from '../../context/TaskContext';
import moment from 'moment';

const TaskForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getTask, createTask, updateTask, loading, error } = useContext(TaskContext);
  
  const initialFormState = {
    title: '',
    description: '',
    priority: 3,
    deadline: moment().add(1, 'day').startOf('day'),
    estimatedDuration: 60,
    status: 'pending',
    tags: []
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [tag, setTag] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Load task data if in edit mode
  useEffect(() => {
    const fetchTask = async () => {
      if (id) {
        console.log('Fetching task data for editing. Task ID:', id);
        try {
          const taskData = await getTask(id);
          if (taskData) {
            console.log('Task data loaded:', taskData);
            setIsEditMode(true);
            
            // Format deadline for date picker
            const formattedTask = {
              ...taskData,
              deadline: taskData.deadline ? moment(taskData.deadline) : null
            };
            
            setFormData(formattedTask);
          } else {
            console.error('Task not found for editing');
            setSnackbarMessage('Task not found. Creating a new task instead.');
            setSnackbarOpen(true);
          }
        } catch (err) {
          console.error('Error loading task for editing:', err);
          setSnackbarMessage('Error loading task data. Please try again.');
          setSnackbarOpen(true);
        }
      }
    };

    fetchTask();
  }, [id, getTask]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when field is changed
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle deadline date change
  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, deadline: date }));
    
    // Clear validation error when field is changed
    if (formErrors.deadline) {
      setFormErrors(prev => ({ ...prev, deadline: '' }));
    }
  };

  // Handle tag input change
  const handleTagChange = (e) => {
    setTag(e.target.value);
  };

  // Add tag to form data
  const handleAddTag = () => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
      setTag('');
    }
  };

  // Remove tag from form data
  const handleDeleteTag = (tagToDelete) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToDelete)
    }));
  };

  // Validate form fields
  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.deadline) {
      errors.deadline = 'Deadline is required';
    }
    
    if (!formData.estimatedDuration || formData.estimatedDuration <= 0) {
      errors.estimatedDuration = 'Estimated duration must be greater than 0';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Format data for submission
      const taskData = {
        ...formData,
        deadline: formData.deadline ? formData.deadline.toDate() : null
      };
      
      console.log('Submitting task data:', taskData);
      
      let result;
      if (isEditMode) {
        result = await updateTask(id, taskData);
        if (result) {
          setSnackbarMessage('Task updated successfully');
          setSnackbarOpen(true);
          setTimeout(() => navigate(`/tasks/${result._id}`), 1000);
        }
      } else {
        result = await createTask(taskData);
        if (result) {
          setSnackbarMessage('Task created successfully');
          setSnackbarOpen(true);
          setTimeout(() => navigate(`/tasks/${result._id}`), 1000);
        }
      }
    } catch (err) {
      console.error('Error saving task:', err);
      setSnackbarMessage('Error saving task. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Format estimated duration
  const formatDuration = (minutes) => {
    if (!minutes) return 'Not specified';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}${mins > 0 ? ` ${mins} minute${mins !== 1 ? 's' : ''}` : ''}`;
    }
    
    return `${mins} minute${mins !== 1 ? 's' : ''}`;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Box>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {isEditMode ? 'Edit Task' : 'Create New Task'}
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Paper elevation={3} sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Task Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  error={!!formErrors.title}
                  helperText={formErrors.title}
                  disabled={loading || submitting}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DateTimePicker
                    label="Deadline"
                    value={formData.deadline}
                    onChange={handleDateChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!formErrors.deadline,
                        helperText: formErrors.deadline,
                        required: true
                      }
                    }}
                    disabled={loading || submitting}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Estimated Duration (minutes)"
                  name="estimatedDuration"
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={handleChange}
                  error={!!formErrors.estimatedDuration}
                  helperText={formErrors.estimatedDuration || `Approximately ${formatDuration(formData.estimatedDuration)}`}
                  disabled={loading || submitting}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">mins</InputAdornment>
                  }}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={loading || submitting}>
                  <InputLabel id="priority-label">Priority</InputLabel>
                  <Select
                    labelId="priority-label"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    label="Priority"
                  >
                    <MenuItem value={1}>High Priority</MenuItem>
                    <MenuItem value={2}>Medium Priority</MenuItem>
                    <MenuItem value={3}>Low Priority</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {isEditMode && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth disabled={loading || submitting}>
                    <InputLabel id="status-label">Status</InputLabel>
                    <Select
                      labelId="status-label"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      label="Status"
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="in-progress">In Progress</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  disabled={loading || submitting}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="subtitle1">Tags</Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      label="Add a tag"
                      value={tag}
                      onChange={handleTagChange}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      disabled={loading || submitting}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={handleAddTag}
                      fullWidth
                      disabled={loading || submitting || !tag.trim()}
                    >
                      Add Tag
                    </Button>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                    {formData.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        onDelete={() => handleDeleteTag(tag)}
                        disabled={loading || submitting}
                      />
                    ))}
                  </Stack>
                </Box>
              </Grid>
              
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(-1)}
                    disabled={loading || submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={loading || submitting}
                    startIcon={submitting && <CircularProgress size={20} />}
                  >
                    {submitting 
                      ? 'Saving...' 
                      : isEditMode ? 'Update Task' : 'Create Task'
                    }
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
        
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default TaskForm;
