import React, { useContext, useEffect, useState, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemIcon,
  Divider,
  Paper,
  Alert,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TaskIcon from '@mui/icons-material/Task';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { AuthContext } from '../../context/AuthContext';
import { TaskContext } from '../../context/TaskContext';
import { BudgetContext } from '../../context/BudgetContext';
import moment from 'moment';
import TodayIcon from '@mui/icons-material/Today';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { 
    tasks, 
    scheduledTasks, 
    todayScheduledTasks,
    loading: tasksLoading, 
    error: tasksError, 
    fetchTasks, 
    fetchScheduledTasks,
    fetchTodayScheduledTasks,
    fetchStats
  } = useContext(TaskContext);
  const { budgets, loading: budgetsLoading, error: budgetsError, fetchBudgets } = useContext(BudgetContext);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [recentBudgets, setRecentBudgets] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);

  // Create a memoized fetch function to avoid dependency issues
  const loadDashboardData = useCallback(async () => {
    setLoadingDashboard(true);
    setDashboardError(null);
    
    try {
      console.log('Loading dashboard data...');
      await Promise.all([
        fetchTasks(),
        fetchScheduledTasks(),
        fetchTodayScheduledTasks()
      ]);
      console.log('Dashboard data loaded successfully');
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setDashboardError('Failed to load dashboard data. Please try refreshing the page.');
    } finally {
      setLoadingDashboard(false);
    }
  }, [fetchTasks, fetchScheduledTasks, fetchTodayScheduledTasks]);

  // Fetch data on component mount with auto-refresh
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Loading dashboard data...");
        await fetchTasks();
        await fetchTodayScheduledTasks();
        
        // Check if fetchBudgets exists and is a function before calling it
        if (typeof fetchBudgets === 'function') {
          await fetchBudgets();
        } else {
          console.warn('fetchBudgets is not available in BudgetContext');
        }
        
        console.log("Dashboard data loaded successfully");
      } catch (error) {
        console.error("Error fetching data for dashboard:", error);
      }
    };
    
    // Initial data load
    fetchData();
    
    // Set up interval for auto-refresh
    const intervalId = setInterval(() => {
      console.log("Auto-refreshing dashboard data...");
      fetchData();
    }, 60000); // Refresh every minute
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [fetchTasks, fetchTodayScheduledTasks, fetchBudgets]);

  // Filter upcoming tasks and sort by deadline
  useEffect(() => {
    if (tasks && tasks.length > 0) {
      const upcoming = tasks
        .filter(task => task.status !== 'completed')
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 5);
      setUpcomingTasks(upcoming);
    } else {
      setUpcomingTasks([]);
    }
  }, [tasks]);

  // Get recent budgets
  useEffect(() => {
    if (budgets && budgets.length > 0) {
      const recent = [...budgets]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);
      setRecentBudgets(recent);
    } else {
      setRecentBudgets([]);
    }
  }, [budgets]);

  // Format date for display
  const formatDate = (date) => {
    return moment(date).format('MMM DD, YYYY');
  };
  
  // Helper function to format time display
  const formatTime = (timeStr) => {
    if (!timeStr) return "No time scheduled";
    
    try {
      if (typeof timeStr === 'string') {
        return moment(timeStr).format("h:mm A");
      } else if (typeof timeStr === 'object' && timeStr !== null) {
        if (timeStr.start) {
          return moment(timeStr.start).format("h:mm A");
        }
      }
      return "Invalid time format";
    } catch (err) {
      console.error("Error formatting time:", err);
      return "Invalid time";
    }
  };
  
  // Format duration in minutes to a readable format
  const formatDuration = (minutes) => {
    if (!minutes) return "N/A";
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
    }
    return `${mins}m`;
  };
  
  // Format date and time for display
  const formatDateTime = (date) => {
    return moment(date).format('MMM DD, YYYY [at] h:mm A');
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1:
        return 'error.main'; // High - Red
      case 2:
        return 'warning.main'; // Medium - Orange
      case 3:
        return 'info.main'; // Low - Blue
      default:
        return 'text.secondary'; // Default - Grey
    }
  };

  // Get priority label
  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 1:
        return 'High';
      case 2:
        return 'Medium';
      case 3:
        return 'Low';
      default:
        return 'Unknown';
    }
  };

  // Helper function to mark task as completed
  const handleMarkTaskCompleted = async (taskId) => {
    try {
      // Use axios directly to update task status
      const response = await axios.put(`/api/tasks/${taskId}`, { 
        status: 'completed',
        completed: true
      });
      
      if (response.data) {
        // Refresh data after status update
        await fetchTasks();
        await fetchTodayScheduledTasks();
      }
    } catch (err) {
      console.error("Error marking task as completed:", err);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome, {user?.name || 'User'}!
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TaskIcon fontSize="large" color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Tasks</Typography>
              </Box>
              <Typography variant="h4">{tasks.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                {tasks.filter(task => task.status === 'completed').length} completed
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                component={RouterLink}
                to="/tasks/new"
                sx={{ mt: 2 }}
                fullWidth
              >
                New Task
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AccountBalanceWalletIcon fontSize="large" color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Budgets</Typography>
              </Box>
              <Typography variant="h4">{budgets.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                {budgets.filter(budget => budget.optimizedItems?.length > 0).length} optimized
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                component={RouterLink}
                to="/budgets/new"
                sx={{ mt: 2 }}
                fullWidth
              >
                New Budget
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <EventNoteIcon fontSize="large" color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Scheduled</Typography>
              </Box>
              <Typography variant="h4">{scheduledTasks.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Tasks with scheduled times
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                component={RouterLink}
                to="/schedule"
                sx={{ mt: 2 }}
                fullWidth
              >
                View Schedule
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tasks, Scheduled Tasks, and Budgets Lists */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Upcoming Tasks
            </Typography>
            {tasksLoading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : tasksError ? (
              <Alert severity="error">{tasksError}</Alert>
            ) : upcomingTasks.length > 0 ? (
              <List>
                {upcomingTasks.map((task, index) => (
                  <React.Fragment key={task._id}>
                    <ListItem
                      button
                      component={RouterLink}
                      to={`/tasks/${task._id}`}
                      sx={{ borderLeft: 3, borderColor: getPriorityColor(task.priority) }}
                    >
                      <ListItemText
                        primary={task.title}
                        secondary={`Deadline: ${formatDate(task.deadline)}`}
                      />
                    </ListItem>
                    {index < upcomingTasks.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body1" color="text.secondary" align="center" p={3}>
                No upcoming tasks
              </Typography>
            )}
            <Box display="flex" justifyContent="flex-end">
              <Button component={RouterLink} to="/tasks">
                View All Tasks
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Today's Schedule */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <TodayIcon sx={{ mr: 1 }} />
                Today's Schedule
              </Typography>
              <Button
                component={RouterLink}
                to="/schedule"
                endIcon={<ArrowForwardIcon />}
                size="small"
              >
                View Calendar
              </Button>
            </Box>
            
            {tasksLoading ? (
              <CircularProgress />
            ) : tasksError ? (
              <Alert severity="error">{tasksError}</Alert>
            ) : todayScheduledTasks && todayScheduledTasks.length > 0 ? (
              <List sx={{ width: '100%' }}>
                {todayScheduledTasks
                  .sort((a, b) => {
                    // Sort by scheduledTime, handling both string and object formats
                    try {
                      let timeA, timeB;
                      
                      if (typeof a.scheduledTime === 'string') {
                        timeA = new Date(a.scheduledTime).getTime();
                      } else if (a.scheduledTime && a.scheduledTime.start) {
                        timeA = new Date(a.scheduledTime.start).getTime();
                      } else {
                        timeA = 0;
                      }
                      
                      if (typeof b.scheduledTime === 'string') {
                        timeB = new Date(b.scheduledTime).getTime();
                      } else if (b.scheduledTime && b.scheduledTime.start) {
                        timeB = new Date(b.scheduledTime.start).getTime();
                      } else {
                        timeB = 0;
                      }
                      
                      return timeA - timeB;
                    } catch (e) {
                      console.error("Error sorting tasks:", e);
                      return 0;
                    }
                  })
                  .map((task) => (
                    <ListItem
                      key={task._id}
                      disablePadding
                      sx={{
                        borderLeft: `4px solid ${task.completed ? '#4caf50' : getPriorityColor(task.priority)}`,
                        mb: 1,
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.04)',
                        },
                      }}
                    >
                      <ListItemButton
                        component={RouterLink}
                        to={`/tasks/${task._id}`}
                        dense
                      >
                        <ListItemIcon>
                          {task.completed ? (
                            <CheckCircleIcon color="success" />
                          ) : (
                            <AccessTimeIcon />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={task.title}
                          secondary={
                            <>
                              {formatTime(task.scheduledTime)} • {formatDuration(task.estimatedDuration)} • 
                              <Chip
                                size="small"
                                label={getPriorityLabel(task.priority)}
                                sx={{
                                  ml: 0.5,
                                  height: 20,
                                  '& .MuiChip-label': { px: 1, fontSize: '0.7rem' },
                                  bgcolor: getPriorityColor(task.priority),
                                  color: 'white',
                                }}
                              />
                            </>
                          }
                        />
                      </ListItemButton>
                      
                      {/* Add Mark Complete button if task is not already completed */}
                      {!task.completed && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, px: 2, pb: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            startIcon={<CheckCircleIcon />}
                            onClick={(e) => {
                              e.preventDefault(); // Prevent navigation
                              e.stopPropagation(); // Prevent event bubbling
                              handleMarkTaskCompleted(task._id);
                            }}
                            sx={{ fontSize: '0.7rem' }}
                          >
                            Mark Complete
                          </Button>
                        </Box>
                      )}
                    </ListItem>
                  ))}
              </List>
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="textSecondary" variant="body2">
                  No tasks scheduled for today
                </Typography>
                <Button
                  component={RouterLink}
                  to="/schedule"
                  variant="outlined"
                  size="small"
                  sx={{ mt: 2 }}
                >
                  Schedule Tasks
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Recent Budgets
            </Typography>
            {budgetsLoading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : budgetsError ? (
              <Alert severity="error">{budgetsError}</Alert>
            ) : recentBudgets.length > 0 ? (
              <List>
                {recentBudgets.map((budget, index) => (
                  <React.Fragment key={budget._id}>
                    <ListItem
                      button
                      component={RouterLink}
                      to={`/budgets/${budget._id}`}
                    >
                      <ListItemText
                        primary={budget.title}
                        secondary={`Total: $${budget.totalAmount.toFixed(2)} - Items: ${budget.items.length}`}
                      />
                    </ListItem>
                    {index < recentBudgets.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body1" color="text.secondary" align="center" p={3}>
                No budgets created yet
              </Typography>
            )}
            <Box display="flex" justifyContent="flex-end">
              <Button component={RouterLink} to="/budgets">
                View All Budgets
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 