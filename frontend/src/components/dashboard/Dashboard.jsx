import React, { useContext, useEffect, useState } from 'react';
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
  Divider,
  Paper,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TaskIcon from '@mui/icons-material/Task';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import EventNoteIcon from '@mui/icons-material/EventNote';
import { AuthContext } from '../../context/AuthContext';
import { TaskContext } from '../../context/TaskContext';
import { BudgetContext } from '../../context/BudgetContext';
import moment from 'moment';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { tasks, scheduledTasks, loading: tasksLoading, error: tasksError, fetchTasks } = useContext(TaskContext);
  const { budgets, loading: budgetsLoading, error: budgetsError, fetchBudgets } = useContext(BudgetContext);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [recentBudgets, setRecentBudgets] = useState([]);

  // Fetch tasks and budgets on component mount
  useEffect(() => {
    fetchTasks();
    fetchBudgets();
  }, [fetchTasks, fetchBudgets]);

  // Filter upcoming tasks and sort by deadline
  useEffect(() => {
    if (tasks.length > 0) {
      const upcoming = tasks
        .filter(task => task.status !== 'completed')
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 5);
      setUpcomingTasks(upcoming);
    }
  }, [tasks]);

  // Get recent budgets
  useEffect(() => {
    if (budgets.length > 0) {
      const recent = [...budgets]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);
      setRecentBudgets(recent);
    }
  }, [budgets]);

  // Format date for display
  const formatDate = (date) => {
    return moment(date).format('MMM DD, YYYY');
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

      {/* Tasks and Budgets Lists */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
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
                      sx={{ borderLeft: 3, borderColor: task.priority === 1 ? 'error.main' : task.priority === 2 ? 'warning.main' : 'info.main' }}
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

        <Grid item xs={12} md={6}>
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