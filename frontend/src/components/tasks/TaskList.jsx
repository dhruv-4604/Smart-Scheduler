import { useState, useEffect, useContext } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  IconButton,
  Divider,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Event as EventIcon,
  Refresh as RefreshIcon,
  Flag as FlagIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import { TaskContext } from '../../context/TaskContext';
import moment from 'moment';

const TaskList = () => {
  const { tasks, loading, error, fetchTasks, deleteTask } = useContext(TaskContext);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('deadline-asc');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (tasks) {
      let filtered = [...tasks];
      
      // Apply search filter
      if (searchTerm) {
        filtered = filtered.filter(task => 
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply status filter
      if (statusFilter !== 'all') {
        filtered = filtered.filter(task => task.status === statusFilter);
      }
      
      // Apply priority filter
      if (priorityFilter !== 'all') {
        filtered = filtered.filter(task => task.priority === Number(priorityFilter));
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        const [field, direction] = sortBy.split('-');
        
        if (field === 'deadline') {
          const dateA = new Date(a.deadline);
          const dateB = new Date(b.deadline);
          return direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        
        if (field === 'priority') {
          return direction === 'asc' ? a.priority - b.priority : b.priority - a.priority;
        }
        
        if (field === 'title') {
          return direction === 'asc' 
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title);
        }
        
        return 0;
      });
      
      setFilteredTasks(filtered);
    }
  }, [tasks, searchTerm, statusFilter, priorityFilter, sortBy]);

  const handleDeleteTask = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setDeleteLoading(true);
      await deleteTask(id);
      setDeleteLoading(false);
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

  const formatDate = (date) => {
    return moment(date).format('MMM DD, YYYY');
  };

  const isOverdue = (deadline) => {
    return moment(deadline).isBefore(moment()) && statusFilter !== 'completed';
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Tasks
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ mr: 1 }}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button 
            component={RouterLink} 
            to="/tasks/new" 
            variant="contained" 
            startIcon={<AddIcon />}
          >
            New Task
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {showFilters && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Filters</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search Tasks"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  label="Priority"
                >
                  <MenuItem value="all">All Priorities</MenuItem>
                  <MenuItem value="1">High</MenuItem>
                  <MenuItem value="2">Medium</MenuItem>
                  <MenuItem value="3">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort By"
                >
                  <MenuItem value="deadline-asc">Deadline (Soonest)</MenuItem>
                  <MenuItem value="deadline-desc">Deadline (Latest)</MenuItem>
                  <MenuItem value="priority-asc">Priority (High to Low)</MenuItem>
                  <MenuItem value="priority-desc">Priority (Low to High)</MenuItem>
                  <MenuItem value="title-asc">Title (A-Z)</MenuItem>
                  <MenuItem value="title-desc">Title (Z-A)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              startIcon={<RefreshIcon />}
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPriorityFilter('all');
                setSortBy('deadline-asc');
              }}
            >
              Reset Filters
            </Button>
          </Box>
        </Paper>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : filteredTasks.length > 0 ? (
        <Grid container spacing={3}>
          {filteredTasks.map(task => (
            <Grid item xs={12} sm={6} md={4} key={task._id}>
              <Card 
                elevation={3} 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderLeft: 6,
                  borderColor: getPriorityColor(task.priority) + '.main'
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Typography variant="h6" component={RouterLink} to={`/tasks/${task._id}`} sx={{ textDecoration: 'none', color: 'inherit' }}>
                      {task.title}
                    </Typography>
                    <Chip 
                      label={getPriorityLabel(task.priority)} 
                      size="small" 
                      color={getPriorityColor(task.priority)}
                      icon={<FlagIcon />}
                    />
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {task.description ? (
                      task.description.length > 100 
                        ? `${task.description.substring(0, 100)}...` 
                        : task.description
                    ) : 'No description'}
                  </Typography>
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color={isOverdue(task.deadline) ? 'error.main' : 'text.secondary'}>
                      <EventIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                      {formatDate(task.deadline)}
                    </Typography>
                    <Chip 
                      label={task.status.charAt(0).toUpperCase() + task.status.slice(1)} 
                      size="small" 
                      color={getStatusColor(task.status)}
                    />
                  </Box>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Tooltip title="Edit Task">
                    <IconButton 
                      component={RouterLink} 
                      to={`/tasks/${task._id}/edit`}
                      size="small"
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="View Details">
                    <IconButton 
                      component={RouterLink} 
                      to={`/tasks/${task._id}`}
                      size="small"
                      color="info"
                    >
                      <EventIcon />
                    </IconButton>
                  </Tooltip>
                  <Box flexGrow={1} />
                  <Tooltip title="Delete Task">
                    <IconButton 
                      onClick={() => handleDeleteTask(task._id)}
                      size="small"
                      color="error"
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No tasks found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
              ? 'Try changing your filters or search term'
              : 'Get started by creating your first task'}
          </Typography>
          <Button 
            component={RouterLink} 
            to="/tasks/new" 
            variant="contained" 
            startIcon={<AddIcon />}
          >
            Create Task
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default TaskList; 