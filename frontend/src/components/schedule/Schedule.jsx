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
} from "@mui/icons-material";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid/index.js";
import timeGridPlugin from "@fullcalendar/timegrid/index.js";
import interactionPlugin from "@fullcalendar/interaction/index.js";
import { TaskContext } from "../../context/TaskContext";
import moment from "moment";

const Schedule = () => {
  const {
    tasks,
    scheduledTasks,
    loading,
    error,
    fetchTasks,
    scheduleTasks,
    fetchScheduledTasks,
  } = useContext(TaskContext);

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

  // Memoize the loadData function
  const loadData = useCallback(async () => {
    await fetchTasks();
    await fetchScheduledTasks();
  }, [fetchTasks, fetchScheduledTasks]);

  // Fetch tasks and scheduled tasks only once on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Convert scheduled tasks to calendar events
  const calendarEvents = useMemo(() => {
    if (!scheduledTasks || scheduledTasks.length === 0) {
      return [];
    }

    return scheduledTasks.map((task) => ({
      id: task._id,
      title: task.title,
      start: task.scheduledTime,
      end: moment(task.scheduledTime)
        .add(task.estimatedDuration, "minutes")
        .toDate(),
      allDay: false,
      extendedProps: {
        description: task.description,
        priority: task.priority,
        status: task.status,
        duration: task.estimatedDuration,
      },
      backgroundColor: getPriorityColor(task.priority),
      borderColor: getPriorityColor(task.priority),
    }));
  }, [scheduledTasks]);

  // Update events when calendarEvents changes
  useEffect(() => {
    setEvents(calendarEvents);
  }, [calendarEvents]);

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
    loadData();
  }, [loadData]);

  const getPriorityColor = (priority) => {
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
  };

  const getPriorityLabel = (priority) => {
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
      const task = tasks.find((t) => t._id === selectedTask);
      const scheduledDateTime = moment(selectedDate)
        .set({
          hour: parseInt(selectedTime.split(":")[0]),
          minute: parseInt(selectedTime.split(":")[1]),
          second: 0,
        })
        .toDate();

      const scheduledTasks = [
        {
          _id: task._id,
          scheduledTime: scheduledDateTime,
        },
      ];

      await scheduleTasks(scheduledTasks);
      handleCloseScheduleDialog();

      // Refresh data
      await fetchTasks();
      await fetchScheduledTasks();
    } catch (err) {
      setScheduleError("Failed to schedule task");
      console.error("Error scheduling task:", err);
    } finally {
      setScheduling(false);
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ""}` : `${mins}m`;
  };

  return (
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
              <FullCalendar
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
                events={events}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                height="100%"
                nowIndicator={true}
                allDaySlot={false}
                slotMinTime="06:00:00"
                slotMaxTime="22:00:00"
                viewDidMount={(info) => setCalendarView(info.view.type)}
              />
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} lg={3}>
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
          <Button
            fullWidth
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
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
          <DialogTitle>{eventClickInfo.title}</DialogTitle>
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
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEventDialog}>Close</Button>
            <Button
              component={RouterLink}
              to={`/tasks/${eventClickInfo.id}`}
              variant="contained"
              color="primary"
              onClick={handleCloseEventDialog}
            >
              View Task Details
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default Schedule;
