import { createContext, useState, useCallback } from "react";
import axios from "axios";

export const TaskContext = createContext();

const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [todayScheduledTasks, setTodayScheduledTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get all tasks
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Backend route is already mounted at /api/tasks
      const res = await axios.get("/api/tasks");
      setTasks(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching tasks");
      console.error("Error fetching tasks:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get single task
  const getTask = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`/api/tasks/${id}`);
      setCurrentTask(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching task");
      console.error("Error fetching task:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create task
  const createTask = useCallback(async (taskData) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post("/api/tasks", taskData);
      setTasks(prev => [...prev, res.data]);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || "Error creating task");
      console.error("Error creating task:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update task
  const updateTask = useCallback(async (id, taskData) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.put(`/api/tasks/${id}`, taskData);
      setTasks(prev => prev.map((task) => (task._id === id ? res.data : task)));
      if (currentTask && currentTask._id === id) {
        setCurrentTask(res.data);
      }
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || "Error updating task");
      console.error("Error updating task:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentTask]);

  // Delete task
  const deleteTask = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      await axios.delete(`/api/tasks/${id}`);
      setTasks(prev => prev.filter((task) => task._id !== id));
      if (currentTask && currentTask._id === id) {
        setCurrentTask(null);
      }
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Error deleting task");
      console.error("Error deleting task:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentTask]);

  // Fetch scheduled tasks
  const fetchScheduledTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching all scheduled tasks");
      const res = await axios.get("/api/tasks/scheduled");
      
      // Check for empty response
      if (!res.data || !Array.isArray(res.data)) {
        console.warn("Invalid scheduled tasks data received:", res.data);
        setScheduledTasks([]);
        return [];
      }
      
      // Include basic debugging
      console.log(`Fetched ${res.data.length} scheduled tasks`);
      
      // Set tasks in state
      setScheduledTasks(res.data);
      return res.data;
    } catch (err) {
      console.error("Error fetching scheduled tasks:", err.response?.data || err.message);
      setError(err.response?.data?.message || err.message || "Error fetching scheduled tasks");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch today's scheduled tasks
  const fetchTodayScheduledTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching today's scheduled tasks");
      const res = await axios.get("/api/tasks/scheduled");
      
      // Filter tasks that are scheduled for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayTasks = res.data.filter(task => {
        try {
          if (task.scheduledTime) {
            let scheduleDate;
            
            if (typeof task.scheduledTime === 'string') {
              scheduleDate = new Date(task.scheduledTime);
            } else if (task.scheduledTime.start) {
              scheduleDate = new Date(task.scheduledTime.start);
            } else {
              return false;
            }
            
            // Include all tasks scheduled for today, regardless of completion status
            return scheduleDate >= today && scheduleDate < tomorrow;
          }
          return false;
        } catch (e) {
          console.error("Error filtering today's tasks:", e);
          return false;
        }
      });
      
      console.log(`Found ${todayTasks.length} tasks scheduled for today`);
      setTodayScheduledTasks(todayTasks);
      return todayTasks;
    } catch (err) {
      console.error("Error fetching today's scheduled tasks:", err);
      setError("Failed to load today's scheduled tasks");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Schedule tasks
  const scheduleTasks = useCallback(async (tasks) => {
    try {
      setLoading(true);
      setError(null);
      
      // Update individual tasks with their scheduled time
      const updatePromises = tasks.map(taskData => {
        return axios.put(`/api/tasks/${taskData._id}`, {
          scheduledTime: taskData.scheduledTime
        });
      });
      
      await Promise.all(updatePromises);
      
      // Refresh the tasks and scheduled tasks
      await fetchTasks();
      const scheduledData = await fetchScheduledTasks();
      
      return scheduledData;
    } catch (err) {
      setError(err.response?.data?.message || "Error scheduling tasks");
      console.error("Error scheduling tasks:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchTasks, fetchScheduledTasks]);

  // Search tasks
  const searchTasks = useCallback(async (query) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`/api/tasks/search?q=${query}`);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || "Error searching tasks");
      console.error("Error searching tasks:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear errors
  const clearError = useCallback(() => setError(null), []);

  // Auto-schedule tasks using backend algorithm
  const autoScheduleTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call the backend scheduling endpoint
      const res = await axios.post("/api/tasks/schedule");
      
      // Refresh local data after auto-scheduling
      await fetchTasks();
      await fetchScheduledTasks();
      
      return res.data;
    } catch (err) {
      console.error('Auto-scheduling error:', err.response?.data || err.message);
      setError(err.response?.data?.message || err.message || "Error auto-scheduling tasks");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchTasks, fetchScheduledTasks]);

  // Schedule a single task
  const scheduleTask = useCallback(async (taskId, scheduledTime) => {
    console.log(`Scheduling task ${taskId} for ${scheduledTime}`);
    try {
      setLoading(true);
      setError(null);
      
      // Validate inputs
      if (!taskId) {
        throw new Error('Task ID is required');
      }
      
      if (!scheduledTime) {
        throw new Error('Scheduled time is required');
      }
      
      // Ensure scheduled time is a valid date
      const scheduledDate = new Date(scheduledTime);
      if (isNaN(scheduledDate.getTime())) {
        throw new Error('Invalid scheduled time format');
      }
      
      // Call the backend endpoint for scheduling a specific task
      const res = await axios.put(`/api/tasks/${taskId}/schedule`, {
        scheduledTime: scheduledDate
      });
      
      console.log('Task scheduling response:', res.data);
      
      // Update the tasks list
      const updatedTask = res.data.task;
      setTasks(prev => prev.map(task => 
        task._id === taskId ? updatedTask : task
      ));
      
      // Update scheduled tasks
      await fetchScheduledTasks();
      
      return updatedTask;
    } catch (err) {
      console.error('Task scheduling error:', err.response?.data || err.message);
      setError(err.response?.data?.message || err.message || "Error scheduling task");
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchScheduledTasks]);

  // Update task status
  const updateTaskStatus = useCallback(async (id, status) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.patch(`/api/tasks/${id}/status`, { status });
      
      // Update tasks list
      setTasks(prev => prev.map(task => (task._id === id ? res.data : task)));
      
      // Update current task if it's the one being updated
      if (currentTask && currentTask._id === id) {
        setCurrentTask(res.data);
      }
      
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || "Error updating task status");
      console.error("Error updating task status:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentTask]);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        currentTask,
        scheduledTasks,
        todayScheduledTasks,
        loading,
        error,
        fetchTasks,
        getTask,
        createTask,
        updateTask,
        deleteTask,
        fetchScheduledTasks,
        fetchTodayScheduledTasks,
        scheduleTasks,
        searchTasks,
        clearError,
        autoScheduleTasks,
        scheduleTask,
        updateTaskStatus
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export default TaskProvider;
