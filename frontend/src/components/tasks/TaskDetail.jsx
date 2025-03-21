import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  Flag as FlagIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { TaskContext } from '../../context/TaskContext';
import moment from 'moment';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getTask, deleteTask, updateTask, loading, error } = useContext(TaskContext);
  
  const [task, setTask] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(false);

  useEffect(() => {
    const fetchTask = async () => {
      const taskData = await getTask(id);
      setTask(taskData);
    };
    
    fetchTask();
  }, [id, getTask]);

  const handleDelete = async () => {
    setActionLoading(true);
    const success = await deleteTask(id);
    setActionLoading(false);
    
    if (success) {
      navigate('/tasks');
    } else {
      setDeleteDialogOpen(false);
    }
  };

  const updateTaskStatus = async (newStatus) => {
    if (task && task.status !== newStatus) {
      setActionLoading(true);
      const updatedTask = await updateTask(id, { status: newStatus });
      setActionLoading(false);
      
      if (updatedTask) {
        setTask(updatedTask);
        setStatusUpdateSuccess(true);
        setTimeout(() => setStatusUpdateSuccess(false), 3000);
      }
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return 'error';
      case 2: return 'warning';
      case 3: return 'info';
      default: return 'default';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 1: return 'High';
      case 2: return 'Medium';
      case 3: return 'Low';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'pending': return 'info';
      default: return 'default';
    }
  };

  const isOverdue = (deadline) => {
    return moment(deadline).isBefore(moment()) && (task?.status !== 'completed');
  };

  const formatDate = (date) => {
    return moment(date).format('MMMM DD, YYYY [at] h:mm A');
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''} ${mins > 0 ? `${mins} min${mins > 1 ? 's' : ''}` : ''}` : `${mins} minute${mins > 1 ? 's' : ''}`;
  };

  const getTimeRemaining = (deadline) => {
    const now = moment();
    const deadlineDate = moment(deadline);
    const diff = deadlineDate.diff(now);
    
    if (diff < 0) {
      return 'Overdue';
    }
    
    const duration = moment.duration(diff);
    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours > 0 ? `${hours} hr${hours > 1 ? 's' : ''}` : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes > 0 ? `${minutes} min${minutes > 1 ? 's' : ''}` : ''}`;
    } else {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!task) {
    return <Alert severity="info">Task not found</Alert>;
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => navigate('/tasks')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Task Details
        </Typography>
      </Box>

      {statusUpdateSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Task status updated successfully
        </Alert>
      )}

      <Paper elevation={3} sx={{ 
        p: 4, 
        borderTop: 6, 
        borderColor: getPriorityColor(task.priority) + '.main' 
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            {task.title}
          </Typography>
          <Box>
            <Chip 
              label={getPriorityLabel(task.priority)} 
              color={getPriorityColor(task.priority)}
              icon={<FlagIcon />}
              sx={{ mr: 1 }}
            />
            <Chip 
              label={task.status.charAt(0).toUpperCase() + task.status.slice(1)} 
              color={getStatusColor(task.status)}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1">
                {task.description || 'No description provided'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={5}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <EventIcon sx={{ mr: 1 }} color="action" />
                Deadline
              </Typography>
              <Typography 
                variant="body1" 
                color={isOverdue(task.deadline) ? 'error.main' : 'text.primary'}
                gutterBottom
              >
                {formatDate(task.deadline)}
              </Typography>
              {task.status !== 'completed' && (
                <Typography 
                  variant="body2" 
                  color={isOverdue(task.deadline) ? 'error.main' : 'text.secondary'}
                >
                  {isOverdue(task.deadline) 
                    ? `Overdue by ${moment().diff(moment(task.deadline), 'days')} days` 
                    : `Time remaining: ${getTimeRemaining(task.deadline)}`}
                </Typography>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={7}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTimeIcon sx={{ mr: 1 }} color="action" />
                Estimated Duration
              </Typography>
              <Typography variant="body1">
                {formatDuration(task.estimatedDuration)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={5}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <ScheduleIcon sx={{ mr: 1 }} color="action" />
                Scheduled Time
              </Typography>
              <Typography variant="body1">
                {task.scheduledTime ? formatDate(task.scheduledTime) : 'Not scheduled yet'}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            {task.status !== 'completed' ? (
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => updateTaskStatus('completed')}
                disabled={actionLoading}
                sx={{ mr: 2 }}
              >
                {actionLoading ? <CircularProgress size={24} /> : 'Mark as Completed'}
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => updateTaskStatus('in-progress')}
                disabled={actionLoading}
                sx={{ mr: 2 }}
              >
                {actionLoading ? <CircularProgress size={24} /> : 'Reopen Task'}
              </Button>
            )}
            {task.status === 'pending' && (
              <Button
                variant="outlined"
                color="warning"
                onClick={() => updateTaskStatus('in-progress')}
                disabled={actionLoading}
                sx={{ mr: 2 }}
              >
                {actionLoading ? <CircularProgress size={24} /> : 'Start Task'}
              </Button>
            )}
          </Box>
          <Box>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<EditIcon />}
              component={RouterLink}
              to={`/tasks/${id}/edit`}
              sx={{ mr: 2 }}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Paper>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this task? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskDetail; 