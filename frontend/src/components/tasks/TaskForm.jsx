import { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  FormHelperText,
  Snackbar,
  IconButton,
  InputAdornment,
} from "@mui/material";
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import { TaskContext } from "../../context/TaskContext";
import { DateTimePicker } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import moment from "moment";

const TaskForm = () => {
  const { createTask, updateTask, getTask, loading, error, clearError } =
    useContext(TaskContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    deadline: moment().add(1, "day"),
    estimatedDuration: 60,
    priority: 2,
    status: "pending",
  });

  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch task data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchTaskData = async () => {
        const task = await getTask(id);
        if (task) {
          setFormData({
            title: task.title,
            description: task.description || "",
            deadline: moment(task.deadline),
            estimatedDuration: task.estimatedDuration,
            priority: task.priority,
            status: task.status,
          });
        }
      };

      fetchTaskData();
    }

    return () => clearError();
  }, [id, isEditMode, getTask, clearError]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear validation error when user types
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
  };

  // Handle date change
  const handleDateChange = (date) => {
    setFormData({ ...formData, deadline: date });
    if (formErrors.deadline) {
      setFormErrors({ ...formErrors, deadline: "" });
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = "Title is required";
    }

    if (!formData.deadline) {
      errors.deadline = "Deadline is required";
    } else if (!moment(formData.deadline).isValid()) {
      errors.deadline = "Invalid date";
    }

    if (!formData.estimatedDuration) {
      errors.estimatedDuration = "Estimated duration is required";
    } else if (
      isNaN(formData.estimatedDuration) ||
      formData.estimatedDuration <= 0
    ) {
      errors.estimatedDuration = "Duration must be a positive number";
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

    setSaving(true);

    try {
      // Format data for API
      const taskData = {
        ...formData,
        deadline: formData.deadline.toISOString(),
      };

      if (isEditMode) {
        await updateTask(id, taskData);
        setSuccessMessage("Task updated successfully");
      } else {
        await createTask(taskData);
        setSuccessMessage("Task created successfully");
      }

      // Navigate after a short delay to show success message
      setTimeout(() => navigate("/tasks"), 1500);
    } catch (err) {
      console.error("Error saving task:", err);
    } finally {
      setSaving(false);
    }
  };

  // Convert minutes to hours and minutes
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Box>
        <Box sx={{ mb: 4, display: "flex", alignItems: "center" }}>
          <IconButton onClick={() => navigate("/tasks")} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {isEditMode ? "Edit Task" : "Create New Task"}
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
                  disabled={loading || saving}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={4}
                  disabled={loading || saving}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Deadline"
                  value={formData.deadline}
                  onChange={handleDateChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!formErrors.deadline}
                      helperText={formErrors.deadline}
                      required
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <EventIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                  disabled={loading || saving}
                />
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
                  helperText={
                    formErrors.estimatedDuration ||
                    `Approx. ${formatDuration(formData.estimatedDuration)}`
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccessTimeIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  disabled={loading || saving}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!formErrors.priority}>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    label="Priority"
                    disabled={loading || saving}
                  >
                    <MenuItem value={1}>High</MenuItem>
                    <MenuItem value={2}>Medium</MenuItem>
                    <MenuItem value={3}>Low</MenuItem>
                  </Select>
                  {formErrors.priority && (
                    <FormHelperText>{formErrors.priority}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {isEditMode && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={!!formErrors.status}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      label="Status"
                      disabled={loading || saving}
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="in-progress">In Progress</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                    </Select>
                    {formErrors.status && (
                      <FormHelperText>{formErrors.status}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12} sx={{ mt: 2 }}>
                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}
                >
                  <Button
                    variant="outlined"
                    onClick={() => navigate("/tasks")}
                    disabled={saving}
                    startIcon={<ClearIcon />}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading || saving}
                    startIcon={
                      saving ? <CircularProgress size={20} /> : <SaveIcon />
                    }
                  >
                    {saving
                      ? "Saving..."
                      : isEditMode
                      ? "Update Task"
                      : "Create Task"}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>

        <Snackbar
          open={!!successMessage}
          autoHideDuration={3000}
          onClose={() => setSuccessMessage("")}
          message={successMessage}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default TaskForm;
