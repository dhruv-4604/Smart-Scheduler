import { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
} from "@mui/material";
import {
  Event as EventIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Today as TodayIcon,
  Schedule as ScheduleIcon,
  MeetingRoom as MeetingRoomIcon,
  Flag as FlagIcon,
  AccessTime as AccessTimeIcon,
  AutoAwesome as AutoAwesomeIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
} from "@mui/icons-material";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid/index.js";
import timeGridPlugin from "@fullcalendar/timegrid/index.js";
import interactionPlugin from "@fullcalendar/interaction/index.js";
import { TaskContext } from "../../context/TaskContext";
import { AuthContext } from "../../context/AuthContext";
import moment from "moment";
import axios from "axios";
import React from "react";

// Error boundary component
class ScheduleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Calendar error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, backgroundColor: '#ffebee', borderRadius: 2 }}>
          <Typography variant="h5" color="error" gutterBottom>
            Something went wrong with the calendar component
          </Typography>
          <Typography variant="body1" paragraph>
            {this.state.error?.message || "Unknown error"}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

const Schedule = () => {
  const {
    tasks,
    scheduledTasks,
    loading,
    error,
    fetchTasks,
    scheduleTasks,
    scheduleTask,
    fetchScheduledTasks,
    autoScheduleTasks,
    updateTaskStatus,
  } = useContext(TaskContext);
  const { user } = useContext(AuthContext);

  const [calendarView, setCalendarView] = useState("timeGridWeek");
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [unscheduledTasks, setUnscheduledTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [eventClickInfo, setEventClickInfo] = useState(null);
  const [openEventDialog, setOpenEventDialog] = useState(false);
  const [autoScheduling, setAutoScheduling] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info"); // "success", "error", "warning", "info"
  const [autoScheduleError, setAutoScheduleError] = useState(null);
  const [selectedUnscheduledTask, setSelectedUnscheduledTask] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDateStr, setSelectedDateStr] = useState('');

  // Helper functions using useCallback to prevent dependency issues
  const getPriorityColor = useCallback((priority) => {
    switch (priority) {
      case 1:
        return "#f44336"; // High - Red
      case 2:
        return "#ff9800"; // Medium - Orange
      case 3:
        return "#2196f3"; // Low - Blue
      default:
        return "#9e9e9e"; // Default - Grey
    }
  }, []);

  const getPriorityLabel = useCallback((priority) => {
    switch (priority) {
      case 1:
        return "High";
      case 2:
        return "Medium";
      case 3:
        return "Low";
      default:
        return "Unknown";
    }
  }, []);

  // Fetch tasks and scheduled tasks on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchTasks();
        await fetchScheduledTasks();
        
        // Set up automatic refresh every minute to keep the schedule up-to-date
        const intervalId = setInterval(() => {
          console.log("Auto-refreshing schedule data...");
          fetchScheduledTasks();
        }, 60000); // Refresh every minute
        
        return () => clearInterval(intervalId); // Clean up on unmount
      } catch (error) {
        console.error("Error fetching initial schedule data:", error);
      }
    };
    
    fetchData();
  }, [fetchTasks, fetchScheduledTasks]);

  // Convert scheduled tasks to calendar events
  const calendarEvents = useMemo(() => {
    console.log(`Converting scheduled tasks to calendar events. Count: ${scheduledTasks?.length || 0}`);
    
    if (!scheduledTasks || scheduledTasks.length === 0) {
      console.log("No scheduled tasks to display in calendar");
      return [];
    }

    try {
      const events = scheduledTasks
        .map((task) => {
          try {
            // Skip invalid tasks
            if (!task || !task._id) {
              console.warn(`Skipping invalid task:`, task);
              return null;
            }
            
            // Check if we have valid scheduling data
            if (!task.scheduledTime) {
              console.warn(`Task ${task._id} (${task.title}) has no scheduledTime`, task);
              return null;
            }
            
            // Ensure we have valid dates for start time
            let startTime;
            let endTime;
            
            if (typeof task.scheduledTime === 'string') {
              try {
                startTime = new Date(task.scheduledTime);
                // For string format, calculate end time based on duration
                const duration = task.estimatedDuration || 60; // Default 60 min
                endTime = new Date(startTime.getTime() + (duration * 60 * 1000));
              } catch (e) {
                console.error(`Error parsing string date for task ${task._id}:`, e);
                return null;
              }
            } 
            else if (typeof task.scheduledTime === 'object' && task.scheduledTime !== null) {
              if (task.scheduledTime.start) {
                try {
                  // Convert the start time string to a date object
                  startTime = new Date(task.scheduledTime.start);
                  
                  // Use provided end time or calculate it from duration
                  if (task.scheduledTime.end) {
                    endTime = new Date(task.scheduledTime.end);
                  } else {
                    const duration = task.estimatedDuration || 60; // Default 60 min
                    endTime = new Date(startTime.getTime() + (duration * 60 * 1000));
                  }
                } catch (e) {
                  console.error(`Error parsing object date for task ${task._id}:`, e);
                  return null;
                }
              } else {
                console.warn(`Task ${task._id} has scheduledTime object but no start property`);
                return null;
              }
            } else {
              console.warn(`Task ${task._id} has invalid scheduledTime format:`, task.scheduledTime);
              return null;
            }
            
            // Validate dates
            if (!startTime || isNaN(startTime.getTime())) {
              console.warn(`Task ${task._id} has invalid start time:`, startTime);
              return null;
            }
            
            if (!endTime || isNaN(endTime.getTime())) {
              console.warn(`Task ${task._id} has invalid end time:`, endTime);
              const duration = task.estimatedDuration || 60; // Default 60 min
              endTime = new Date(startTime.getTime() + (duration * 60 * 1000));
            }
            
            // Safely get priority or set default
            const priority = task.priority || 3; // Default to low priority if not specified
            const priorityColor = getPriorityColor(priority);
            
            return {
              id: task._id,
              title: task.title || "Untitled Task",
              start: startTime,
              end: endTime,
              allDay: false,
              extendedProps: {
                description: task.description || "",
                priority: priority,
                status: task.status || "pending",
                completed: task.completed || false,
                duration: task.estimatedDuration || 60,
                taskId: task._id
              },
              backgroundColor: task.completed ? '#4caf50' : priorityColor,
              borderColor: task.completed ? '#388e3c' : priorityColor,
            };
          } catch (err) {
            console.error(`Error processing task ${task?._id} for calendar:`, err);
            return null;
          }
        })
        .filter(event => event !== null); // Filter out any null events
      
      console.log(`Successfully created ${events.length} calendar events`);
      return events;
    } catch (error) {
      console.error("Error converting tasks to events:", error);
      return [];
    }
  }, [scheduledTasks, getPriorityColor]);

  // Update events when calendarEvents changes
  useEffect(() => {
    try {
      console.log(`Setting ${calendarEvents.length} events to calendar:`, calendarEvents);
      
      // Safety check for valid events array
      if (Array.isArray(calendarEvents)) {
        setEvents(calendarEvents);
      } else {
        console.error("calendarEvents is not an array:", calendarEvents);
        setEvents([]);
      }
    } catch (error) {
      console.error("Error setting events:", error);
      setEvents([]);
    }
  }, [calendarEvents]);

  // Force calendar refresh when events change
  const calendarRef = React.useRef(null);
  useEffect(() => {
    try {
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.refetchEvents();
        console.log("Calendar events refreshed");
        
        // Check if events are being correctly loaded
        const currentEvents = calendarApi.getEvents();
        console.log(`Calendar API has ${currentEvents.length} events loaded`);
      }
    } catch (error) {
      console.error("Error refreshing calendar:", error);
    }
  }, [events]);

  // Debug function to check calendar events
  const debugCalendarEvents = () => {
    console.log("Current calendar events:", events);
    console.log("Scheduled tasks:", scheduledTasks);
    
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      console.log("Calendar API events:", calendarApi.getEvents());
    }
    
    setSnackbarMessage(`Found ${events.length} events and ${scheduledTasks?.length || 0} scheduled tasks`);
    setSnackbarSeverity("info");
    setSnackbarOpen(true);
  };

  // Function to manually create a test task for debugging
  const createTestTask = async () => {
    try {
      // Use loading state from TaskContext, don't try to set it directly
      console.log("Creating test task...");
      
      // First create a task
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const taskData = {
        title: `Test Task ${new Date().toISOString().slice(11, 19)}`,
        description: "This is a test task created for debugging purposes",
        priority: 2,
        estimatedDuration: 60,
        deadline: tomorrow.toISOString()
      };
      
      // Create the task
      console.log("Creating test task:", taskData);
      const createResponse = await axios.post("/api/tasks", taskData);
      console.log("Task created:", createResponse.data);
      
      if (!createResponse.data || !createResponse.data._id) {
        throw new Error("Failed to create test task");
      }
      
      // Schedule the task for 1 hour from now
      const scheduleTime = new Date();
      scheduleTime.setHours(scheduleTime.getHours() + 1);
      
      console.log(`Scheduling task ${createResponse.data._id} for ${scheduleTime}`);
      const scheduleResponse = await axios.put(`/api/tasks/${createResponse.data._id}/schedule`, {
        scheduledTime: scheduleTime
      });
      
      console.log("Schedule response:", scheduleResponse.data);
      
      setSnackbarMessage("Test task created and scheduled successfully");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      
      // Refresh data
      await handleRefresh();
      
    } catch (error) {
      console.error("Error creating test task:", error);
      setSnackbarMessage(`Error creating test task: ${error.message || "Unknown error"}`);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  // Filter unscheduled tasks
  const filteredUnscheduledTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return [];
    }

    return tasks.filter(
      (task) => !task.scheduledTime && task.status !== "completed"
    );
  }, [tasks]);

  // Update unscheduled tasks when filteredUnscheduledTasks changes
  useEffect(() => {
    setUnscheduledTasks(filteredUnscheduledTasks);
  }, [filteredUnscheduledTasks]);

  // Memoize the refresh handler
  const handleRefresh = useCallback(() => {
    const refreshData = async () => {
      try {
        // Use loading from context instead of trying to set it directly
        console.log("Refreshing schedule data...");
        await fetchTasks();
        await fetchScheduledTasks();
        console.log("Schedule data refreshed successfully");
      } catch (error) {
        console.error("Error refreshing schedule data:", error);
      }
    };
    
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle auto-scheduling of tasks
  const handleAutoSchedule = async () => {
    // Validate that we have tasks to schedule
    if (!unscheduledTasks || unscheduledTasks.length === 0) {
      setSnackbarMessage("No unscheduled tasks to schedule");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    try {
      // Start the scheduling process
      setAutoScheduling(true);
      setAutoScheduleError(null);
      setSnackbarMessage("Starting auto-scheduling process...");
      setSnackbarSeverity("info");
      setSnackbarOpen(true);
      
      console.log(`Attempting to auto-schedule ${unscheduledTasks.length} tasks`);
      
      // Make the request directly with axios for maximum control
      const response = await axios.post("/api/tasks/schedule");
      
      console.log('Auto-schedule response:', response.data);
      
      // Check for successful completion
      if (response.data.scheduledTasks && response.data.scheduledTasks.length > 0) {
        const count = response.data.scheduledTasks.length;
        setSnackbarMessage(`Successfully scheduled ${count} tasks`);
        setSnackbarSeverity("success");
      } 
      // Handle case where no tasks were scheduled
      else {
        setSnackbarMessage("No tasks were scheduled. Please check your task data.");
        setSnackbarSeverity("warning");
      }
      
      // If there were errors, add that information
      if (response.data.errors && response.data.errors.length > 0) {
        console.warn('Some tasks had errors during scheduling:', response.data.errors);
        const errorCount = response.data.errors.length;
        setAutoScheduleError(`${errorCount} tasks couldn't be scheduled due to errors`);
      }
      
      // Always refresh data after auto-scheduling attempt
      console.log("Refreshing data after auto-scheduling");
      try {
        await fetchTasks();
        await fetchScheduledTasks();
        console.log("Data refreshed successfully");
        
        // Try to force a re-render of the calendar
        if (calendarRef.current) {
          try {
            const calendarApi = calendarRef.current.getApi();
            calendarApi.refetchEvents();
            console.log("Calendar events refreshed");
          } catch (calendarError) {
            console.error("Error refreshing calendar:", calendarError);
          }
        }
      } catch (refreshError) {
        console.error("Error refreshing data:", refreshError);
      }
    } 
    catch (error) {
      // Handle API errors
      console.error("Auto-scheduling failed:", error);
      
      let errorMessage = "Auto-scheduling failed. ";
      
      // Extract useful error information if available
      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += "Unknown error occurred.";
      }
      
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity("error");
      setAutoScheduleError(errorMessage);
    } 
    finally {
      setAutoScheduling(false);
      setSnackbarOpen(true);
    }
  };

  const handleDateClick = (info) => {
    setSelectedDate(info.date);
    setSelectedTime(moment(info.date).format("HH:mm"));
    setOpenScheduleDialog(true);
  };

  const handleEventClick = (info) => {
    setEventClickInfo(info.event);
    setOpenEventDialog(true);
  };

  const handleCloseEventDialog = () => {
    setEventClickInfo(null);
    setOpenEventDialog(false);
  };

  const handleOpenScheduleDialog = () => {
    setSelectedDate(new Date());
    setSelectedTime(moment().format("HH:mm"));
    setOpenScheduleDialog(true);
  };

  const handleCloseScheduleDialog = () => {
    setSelectedDate(null);
    setSelectedTask("");
    setSelectedTime("");
    setSelectedDuration("");
    setScheduleError("");
    setOpenScheduleDialog(false);
  };

  const handleScheduleTask = async () => {
    if (!selectedTask) {
      setScheduleError("Please select a task");
      return;
    }

    if (!selectedTime) {
      setScheduleError("Please select a time");
      return;
    }

    setScheduling(true);
    setScheduleError("");

    try {
      // Create a scheduled date time from the selected date and time
      const scheduledDateTime = moment(selectedDate)
        .set({
          hour: parseInt(selectedTime.split(":")[0]),
          minute: parseInt(selectedTime.split(":")[1]),
          second: 0,
        })
        .toDate();

      console.log(`Scheduling task ${selectedTask} for ${scheduledDateTime}`);
      
      // Use the new scheduleTask function from context
      const result = await scheduleTask(selectedTask, scheduledDateTime);
      
      if (result) {
        // Close the dialog on success
        handleCloseScheduleDialog();
        
        // Show success message
        setSnackbarMessage("Task scheduled successfully");
        setSnackbarOpen(true);
        
        // Refresh data after scheduling
        handleRefresh();
      } else {
        // Show error if scheduling failed
        setScheduleError("Failed to schedule task. Please try again.");
      }
    } catch (err) {
      console.error("Error scheduling task:", err);
      setScheduleError(err.message || "Failed to schedule task");
    } finally {
      setScheduling(false);
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ""}` : `${mins}m`;
  };

  // Add handleTaskStatusChange function
  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      setSnackbarMessage("Updating task status...");
      setSnackbarSeverity("info");
      setSnackbarOpen(true);
      
      // Use axios directly to update task status
      const response = await axios.put(`/api/tasks/${taskId}`, { 
        status: newStatus,
        completed: newStatus === 'completed'
      });
      
      if (response.data) {
        setSnackbarMessage(`Task marked as ${newStatus === 'completed' ? 'completed' : 'in progress'}`);
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        
        // Close the event dialog
        handleCloseEventDialog();
        
        // Comprehensive refresh of all related data
        console.log("Refreshing all task data after status update");
        
        // Batch multiple refreshes to avoid race conditions
        Promise.all([
          fetchTasks(),
          fetchScheduledTasks()
        ])
        .then(() => {
          console.log("All task data refreshed successfully");
          
          // Force calendar refresh
          if (calendarRef.current) {
            try {
              const calendarApi = calendarRef.current.getApi();
              calendarApi.refetchEvents();
              console.log("Calendar events refreshed");
            } catch (calendarError) {
              console.error("Error refreshing calendar:", calendarError);
            }
          }
        })
        .catch(refreshError => {
          console.error("Error during data refresh:", refreshError);
        });
      }
    } catch (err) {
      console.error("Error updating task status:", err);
      setSnackbarMessage(`Failed to update task status: ${err.response?.data?.message || err.message}`);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  // Function to directly test the API
  const testApi = async () => {
    try {
      // Test the base API first
      console.log("Testing API connection...");
      const testResponse = await axios.get("/api/tasks/test");
      console.log("API test response:", testResponse.data);
      
      // Now test the scheduled tasks endpoint
      console.log("Testing scheduled tasks endpoint...");
      const scheduledResponse = await axios.get("/api/tasks/scheduled");
      console.log("Scheduled tasks response:", scheduledResponse.data);
      
      // Show the results to the user
      if (scheduledResponse.data && Array.isArray(scheduledResponse.data)) {
        setSnackbarMessage(`API is working. Found ${scheduledResponse.data.length} scheduled tasks.`);
      } else {
        setSnackbarMessage(`API is working but returned unexpected data: ${JSON.stringify(scheduledResponse.data)}`);
      }
      setSnackbarSeverity("info");
      setSnackbarOpen(true);
      
    } catch (error) {
      console.error("API test failed:", error);
      setSnackbarMessage(`API test failed: ${error.message}`);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  return (
    <ScheduleErrorBoundary>
      <Box>
        <Box
          sx={{
            mb: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            Schedule
          </Typography>
          <Box>
            <Button
              variant="outlined"
              onClick={handleAutoSchedule}
              startIcon={<AutoAwesomeIcon />}
              sx={{ mr: 1 }}
              disabled={autoScheduling || loading || unscheduledTasks.length === 0}
            >
              {autoScheduling ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Auto Scheduling...
                </>
              ) : (
                "Auto Schedule"
              )}
            </Button>
            <Button
              variant="outlined"
              onClick={handleOpenScheduleDialog}
              startIcon={<ScheduleIcon />}
              sx={{ mr: 1 }}
            >
              Schedule Task
            </Button>
            <Button
              variant="contained"
              component={RouterLink}
              to="/tasks/new"
              startIcon={<AddIcon />}
            >
              Create Task
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {autoScheduleError && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setAutoScheduleError(null)}>
            Auto-scheduling error: {autoScheduleError}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} lg={9}>
            <Paper sx={{ p: 2, height: "70vh" }}>
              {loading ? (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  height="100%"
                >
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {events.length === 0 && (
                    <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        No scheduled tasks to display. Use the "Schedule Task" button to add tasks to the calendar.
                      </Typography>
                    </Box>
                  )}
                  <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView={calendarView}
                    headerToolbar={{
                      left: "prev,next today",
                      center: "title",
                      right: "dayGridMonth,timeGridWeek,timeGridDay",
                    }}
                    editable={true}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    events={events || []}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                    height="100%"
                    nowIndicator={true}
                    allDaySlot={false}
                    slotMinTime="06:00:00"
                    slotMaxTime="22:00:00"
                    eventTimeFormat={{
                      hour: '2-digit',
                      minute: '2-digit',
                      meridiem: 'short'
                    }}
                    eventDisplay="block" 
                    eventContent={(eventInfo) => {
                      try {
                        return (
                          <Tooltip title={eventInfo.event.title}>
                            <Box sx={{ 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              width: '100%',
                              fontSize: '0.85em',
                              fontWeight: 'bold',
                              padding: '2px 4px'
                            }}>
                              {eventInfo.timeText && <span style={{ marginRight: '4px' }}>{eventInfo.timeText}</span>}
                              {eventInfo.event.title}
                            </Box>
                          </Tooltip>
                        );
                      } catch (error) {
                        console.error("Error rendering event:", error);
                        return <Box sx={{ p: 1, bgcolor: "#ffebee" }}>Error: {error.message}</Box>;
                      }
                    }}
                    viewDidMount={(info) => setCalendarView(info.view.type)}
                    eventDidMount={(info) => {
                      console.log(`Event mounted: ${info.event.title}`);
                    }}
                  />
                </>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} lg={3}>
            {/* Today's Scheduled Tasks list */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center" }}
              >
                <TodayIcon sx={{ mr: 1 }} />
                Today's Schedule
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {loading ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress size={30} />
                </Box>
              ) : (
                <>
                  {scheduledTasks && scheduledTasks.filter(task => {
                    // Check if task is scheduled for today
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    
                    try {
                      if (task.scheduledTime) {
                        let taskDate;
                        if (typeof task.scheduledTime === 'string') {
                          taskDate = new Date(task.scheduledTime);
                        } else if (task.scheduledTime.start) {
                          taskDate = new Date(task.scheduledTime.start);
                        } else {
                          return false;
                        }
                        
                        return taskDate >= today && taskDate < tomorrow;
                      }
                      return false;
                    } catch (e) {
                      console.error("Error parsing date:", e);
                      return false;
                    }
                  }).length > 0 ? (
                    <Box>
                      {scheduledTasks.filter(task => {
                        // Check if task is scheduled for today
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const tomorrow = new Date(today);
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        
                        try {
                          if (task.scheduledTime) {
                            let taskDate;
                            if (typeof task.scheduledTime === 'string') {
                              taskDate = new Date(task.scheduledTime);
                            } else if (task.scheduledTime.start) {
                              taskDate = new Date(task.scheduledTime.start);
                            } else {
                              return false;
                            }
                            
                            return taskDate >= today && taskDate < tomorrow;
                          }
                          return false;
                        } catch (e) {
                          return false;
                        }
                      }).map((task) => {
                        let timeDisplay = '';
                        try {
                          if (task.scheduledTime) {
                            if (typeof task.scheduledTime === 'string') {
                              timeDisplay = moment(task.scheduledTime).format('h:mm A');
                            } else if (task.scheduledTime.start) {
                              timeDisplay = moment(task.scheduledTime.start).format('h:mm A');
                            }
                          }
                        } catch (e) {
                          timeDisplay = 'Invalid time';
                        }
                        
                        return (
                          <Box
                            key={task._id}
                            sx={{
                              mb: 2,
                              p: 1,
                              border: "1px solid #eee",
                              borderRadius: 1,
                              borderLeft: `4px solid ${task.completed ? '#4caf50' : getPriorityColor(task.priority)}`
                            }}
                          >
                            <Box
                              display="flex"
                              justifyContent="space-between"
                              alignItems="flex-start"
                            >
                              <Typography
                                variant="subtitle2"
                                component={RouterLink}
                                to={`/tasks/${task._id}`}
                                sx={{ textDecoration: "none", color: "inherit" }}
                              >
                                {task.title}
                              </Typography>
                              <Chip
                                label={getPriorityLabel(task.priority)}
                                size="small"
                                sx={{
                                  backgroundColor: getPriorityColor(task.priority),
                                  color: "white",
                                  fontSize: "0.7rem",
                                }}
                              />
                            </Box>
                            <Typography
                              variant="caption"
                              display="block"
                              color="text.secondary"
                              sx={{ mt: 1 }}
                            >
                              <AccessTimeIcon
                                fontSize="inherit"
                                sx={{ verticalAlign: "middle", mr: 0.5 }}
                              />
                              {timeDisplay} ({formatDuration(task.estimatedDuration)})
                            </Typography>
                            {task.completed ? (
                              <Chip 
                                label="Completed" 
                                size="small" 
                                color="success" 
                                icon={<CheckCircleIcon />} 
                                sx={{ mt: 1 }}
                              />
                            ) : (
                              <Button
                                size="small"
                                variant="outlined"
                                color="success"
                                startIcon={<CheckCircleIcon />}
                                onClick={() => handleTaskStatusChange(task._id, 'completed')}
                                sx={{ mt: 1, fontSize: '0.7rem' }}
                              >
                                Mark Complete
                              </Button>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                      p={2}
                    >
                      No tasks scheduled for today
                    </Typography>
                  )}
                </>
              )}
            </Paper>
            
            {/* Existing Upcoming Tasks paper */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center" }}
              >
                <EventIcon sx={{ mr: 1 }} />
                Upcoming Tasks
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {loading ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress size={30} />
                </Box>
              ) : unscheduledTasks.length > 0 ? (
                <Box>
                  {unscheduledTasks.slice(0, 5).map((task) => (
                    <Box
                      key={task._id}
                      sx={{
                        mb: 2,
                        p: 1,
                        border: "1px solid #eee",
                        borderRadius: 1,
                      }}
                    >
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="flex-start"
                      >
                        <Typography
                          variant="subtitle2"
                          component={RouterLink}
                          to={`/tasks/${task._id}`}
                          sx={{ textDecoration: "none", color: "inherit" }}
                        >
                          {task.title}
                        </Typography>
                        <Chip
                          label={getPriorityLabel(task.priority)}
                          size="small"
                          sx={{
                            backgroundColor: getPriorityColor(task.priority),
                            color: "white",
                            fontSize: "0.7rem",
                          }}
                        />
                      </Box>
                      <Typography
                        variant="caption"
                        display="block"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        <EventIcon
                          fontSize="inherit"
                          sx={{ verticalAlign: "middle", mr: 0.5 }}
                        />
                        {moment(task.deadline).format("MMM DD, YYYY")}
                      </Typography>
                      <Typography
                        variant="caption"
                        display="block"
                        color="text.secondary"
                      >
                        <AccessTimeIcon
                          fontSize="inherit"
                          sx={{ verticalAlign: "middle", mr: 0.5 }}
                        />
                        {formatDuration(task.estimatedDuration)}
                      </Typography>
                    </Box>
                  ))}
                  {unscheduledTasks.length > 5 && (
                    <Box textAlign="center" mt={1}>
                      <Button
                        component={RouterLink}
                        to="/tasks"
                        size="small"
                        endIcon={<ArrowForwardIcon />}
                      >
                        View all {unscheduledTasks.length} tasks
                      </Button>
                    </Box>
                  )}
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                  p={2}
                >
                  No unscheduled tasks
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Schedule Task Dialog */}
        <Dialog
          open={openScheduleDialog}
          onClose={handleCloseScheduleDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Schedule a Task</DialogTitle>
          <DialogContent>
            {scheduleError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {scheduleError}
              </Alert>
            )}

            <Box sx={{ mt: 1 }}>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Task</InputLabel>
                <Select
                  value={selectedTask}
                  onChange={(e) => setSelectedTask(e.target.value)}
                  label="Task"
                  disabled={scheduling}
                >
                  {unscheduledTasks.map((task) => (
                    <MenuItem key={task._id} value={task._id}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          width: "100%",
                        }}
                      >
                        <FlagIcon
                          sx={{ color: getPriorityColor(task.priority), mr: 1 }}
                          fontSize="small"
                        />
                        <Box sx={{ flexGrow: 1 }}>{task.title}</Box>
                        <Typography variant="caption" color="text.secondary">
                          {formatDuration(task.estimatedDuration)}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    value={
                      selectedDate
                        ? moment(selectedDate).format("YYYY-MM-DD")
                        : ""
                    }
                    onChange={(e) =>
                      setSelectedDate(moment(e.target.value).toDate())
                    }
                    InputLabelProps={{ shrink: true }}
                    disabled={scheduling}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Time"
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    disabled={scheduling}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseScheduleDialog} disabled={scheduling}>
              Cancel
            </Button>
            <Button
              onClick={handleScheduleTask}
              variant="contained"
              color="primary"
              disabled={scheduling || !selectedTask}
              startIcon={
                scheduling ? <CircularProgress size={20} /> : <ScheduleIcon />
              }
            >
              {scheduling ? "Scheduling..." : "Schedule Task"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Event Click Dialog */}
        {eventClickInfo && (
          <Dialog
            open={openEventDialog}
            onClose={handleCloseEventDialog}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              {eventClickInfo.title}
              {eventClickInfo.extendedProps.status === 'completed' && (
                <Chip 
                  label="Completed" 
                  color="success" 
                  size="small" 
                  icon={<CheckCircleIcon />}
                  sx={{ ml: 1 }}
                />
              )}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {eventClickInfo.extendedProps.description || "No description"}
                </Typography>

                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Start Time</Typography>
                    <Typography variant="body2">
                      {moment(eventClickInfo.start).format(
                        "MMM DD, YYYY [at] h:mm A"
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">End Time</Typography>
                    <Typography variant="body2">
                      {moment(eventClickInfo.end).format(
                        "MMM DD, YYYY [at] h:mm A"
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Duration</Typography>
                    <Typography variant="body2">
                      {formatDuration(eventClickInfo.extendedProps.duration)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Priority</Typography>
                    <Chip
                      label={getPriorityLabel(
                        eventClickInfo.extendedProps.priority
                      )}
                      size="small"
                      sx={{
                        backgroundColor: getPriorityColor(
                          eventClickInfo.extendedProps.priority
                        ),
                        color: "white",
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2">Status</Typography>
                    <Typography variant="body2">
                      {eventClickInfo.extendedProps.status === 'completed' 
                        ? 'Completed' 
                        : eventClickInfo.extendedProps.status === 'in-progress'
                        ? 'In Progress'
                        : 'Pending'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseEventDialog}>Close</Button>
              
              {/* Only show Mark as Completed button if task is not completed */}
              {eventClickInfo.extendedProps.status !== 'completed' && (
                <Button
                  onClick={() => handleTaskStatusChange(eventClickInfo.id, 'completed')}
                  startIcon={<CheckCircleIcon />}
                  color="success"
                  variant="contained"
                >
                  Mark as Completed
                </Button>
              )}
              
              <Button
                component={RouterLink}
                to={`/tasks/${eventClickInfo.id}`}
                variant="outlined"
                color="primary"
                onClick={handleCloseEventDialog}
              >
                View Details
              </Button>
            </DialogActions>
          </Dialog>
        )}

        {/* Snackbar for notifications */}
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
    </ScheduleErrorBoundary>
  );
};

export default Schedule;
