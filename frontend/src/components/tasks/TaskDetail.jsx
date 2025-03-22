import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Divider,
  LinearProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  Snackbar,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  PriorityHigh as PriorityHighIcon,
  Refresh as RefreshIcon,
  Event as EventIcon,
  Timer as TimerIcon,
  PlayArrow as PlayArrowIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { TaskContext } from '../../context/TaskContext';
import moment from 'moment';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getTask, deleteTask, updateTaskStatus, loading: contextLoading, error: contextError } = useContext(TaskContext);
  
  const [task, setTask] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const [loadingTask, setLoadingTask] = useState(true);
  const [loadError, setLoadError] = useState(null);
  
  // Create a memoized fetch function to avoid dependency issues
  const fetchTaskData = useCallback(async () => {
    if (!id) return;
    
    setLoadingTask(true);
    setLoadError(null);
    
    try {
      console.log('Fetching task details for ID:', id);
      const taskData = await getTask(id);
      
      if (taskData) {
        console.log('Task data loaded:', taskData);
        setTask(taskData);
      } else {
        console.error('Task not found');
        setLoadError('Task not found. It may have been deleted or you might not have permission to view it.');
      }
    } catch (err) {
      console.error('Error loading task:', err);
      setLoadError('Error loading task. Please try refreshing the page.');
    } finally {
      setLoadingTask(false);
    }
  }, [id, getTask]);

  // Fetch task data when component mounts or id changes
  useEffect(() => {
    fetchTaskData();
  }, [fetchTaskData]);

  // Handle delete confirmation
  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  // Handle task deletion
  const handleDeleteTask = async () => {
    try {
      await deleteTask(id);
      setSnackbarMessage('Task successfully deleted');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Navigate back to task list after short delay
      setTimeout(() => navigate('/tasks'), 1500);
    } catch (err) {
      console.error('Error deleting task:', err);
      setSnackbarMessage('Error deleting task. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      handleCloseDeleteDialog();
    }
  };

  // Handle status update
  const handleStatusUpdate = async (newStatus) => {
    try {
      const updatedTask = await updateTaskStatus(id, newStatus);
      if (updatedTask) {
        setTask(updatedTask);
        setSnackbarMessage(`Task marked as ${getStatusLabel(newStatus)}`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      setSnackbarMessage('Error updating task status. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Get priority color and label
  const getPriorityInfo = (priority) => {
    switch (priority) {
      case 1:
        return { color: 'error', label: 'High Priority' };
      case 2:
        return { color: 'warning', label: 'Medium Priority' };
      case 3:
        return { color: 'success', label: 'Low Priority' };
      default:
        return { color: 'default', label: 'Not Set' };
    }
  };

  // Get status color and label
  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { color: 'success', label: 'Completed' };
      case 'in-progress':
        return { color: 'primary', label: 'In Progress' };
      case 'pending':
        return { color: 'warning', label: 'Pending' };
      default:
        return { color: 'default', label: 'Unknown' };
    }
  };

  // Get formatted status label
  const getStatusLabel = (status) => {
    return getStatusInfo(status).label;
  };

  // Format date and check if overdue
  const formatDate = (date) => {
    if (!date) return 'No deadline set';
    try {
      return moment(date).format('MMMM D, YYYY [at] h:mm A');
    } catch (err) {
      console.error("Error formatting date:", err, date);
      return 'Invalid date format';
    }
  };

  // Format time for scheduled tasks with improved handling
  const formatScheduledTime = (scheduledTime) => {
    if (!scheduledTime) return 'Not scheduled';
    
    try {
      // Handle object format with start and end properties
      if (typeof scheduledTime === 'object' && scheduledTime !== null) {
        if (scheduledTime.start && scheduledTime.end) {
          return `${moment(scheduledTime.start).format('MMMM D, YYYY [at] h:mm A')} - ${moment(scheduledTime.end).format('h:mm A')}`;
        } else if (scheduledTime.start) {
          return moment(scheduledTime.start).format('MMMM D, YYYY [at] h:mm A');
        }
      }
      
      // Handle string format
      if (typeof scheduledTime === 'string') {
        return moment(scheduledTime).format('MMMM D, YYYY [at] h:mm A');
      }
      
      return 'Invalid scheduled time format';
    } catch (err) {
      console.error("Error formatting scheduled time:", err, scheduledTime);
      return 'Error formatting scheduled time';
    }
  };

  const isOverdue = (deadline) => {
    if (!deadline) return false;
    return moment(deadline).isBefore(moment()) && task.status !== 'completed';
  };

  // Calculate time remaining until deadline
  const getTimeRemaining = (deadline) => {
    if (!deadline) return 'No deadline set';
    
    const now = moment();
    const deadlineMoment = moment(deadline);
    
    if (deadlineMoment.isBefore(now)) {
      return task.status === 'completed' 
        ? 'Completed on time' 
        : `Overdue by ${deadlineMoment.from(now, true)}`;
    }
    
    return `Due in ${now.to(deadlineMoment, true)}`;
  };

  // Format duration
  const formatDuration = (minutes) => {
    if (!minutes) return 'Not specified';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}${mins > 0 ? ` ${mins} minute${mins !== 1 ? 's' : ''}` : ''}`;
    }
    
    return `${mins} minute${mins !== 1 ? 's' : ''}`;
  };

  // If loading, show progress
  if (loadingTask) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading task details...
        </Typography>
      </Box>
    );
  }

  // If error, show error message
  if (loadError) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/tasks')}
        >
          Back to Tasks
        </Button>
      </Box>
    );
  }

  // If task not found, show message
  if (!task) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">
          Task not found or still loading. Please try again in a moment.
        </Alert>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/tasks')}
        >
          Back to Tasks
        </Button>
      </Box>
    );
  }

  const priorityInfo = getPriorityInfo(task.priority);
  const statusInfo = getStatusInfo(task.status);
  const overdueStatus = isOverdue(task.deadline);

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
        <IconButton onClick={() => navigate('/tasks')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1, mb: { xs: 2, sm: 0 } }}>
          Task Details
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, width: { xs: '100%', sm: 'auto' } }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/tasks/edit/${id}`)}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleOpenDeleteDialog}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h5" component="h2" gutterBottom>
              {task.title}
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Chip 
                label={priorityInfo.label} 
                color={priorityInfo.color} 
                icon={<PriorityHighIcon />} 
              />
              <Chip 
                label={statusInfo.label} 
                color={statusInfo.color} 
              />
              {overdueStatus && (
                <Chip 
                  label="Overdue" 
                  color="error" 
                />
              )}
              {task.scheduled && (
                <Chip 
                  label="Scheduled" 
                  color="info" 
                  icon={<EventIcon />} 
                />
              )}
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <EventIcon sx={{ mr: 1 }} /> Deadline
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {formatDate(task.deadline)}
            </Typography>
            <Typography variant="body2" color={overdueStatus ? 'error.main' : 'text.secondary'}>
              {getTimeRemaining(task.deadline)}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <TimerIcon sx={{ mr: 1 }} /> Estimated Duration
            </Typography>
            <Typography variant="body1">
              {formatDuration(task.estimatedDuration)}
            </Typography>
          </Grid>

          {task.tags && task.tags.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {task.tags.map((tag, index) => (
                  <Chip key={index} label={tag} size="small" />
                ))}
              </Box>
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Description
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {task.description || 'No description provided.'}
            </Typography>
          </Grid>

          {task.scheduledTime && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                Scheduled Time
              </Typography>
              <Typography variant="body1">
                {formatScheduledTime(task.scheduledTime)}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6" component="h3" gutterBottom>
          Task Actions
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {task.status === 'pending' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrowIcon />}
              onClick={() => handleStatusUpdate('in-progress')}
            >
              Start Task
            </Button>
          )}
          
          {task.status === 'in-progress' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={() => handleStatusUpdate('completed')}
            >
              Mark as Completed
            </Button>
          )}
          
          {task.status === 'completed' && (
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => handleStatusUpdate('in-progress')}
            >
              Reopen Task
            </Button>
          )}
        </Box>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this task? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteTask} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TaskDetail; 