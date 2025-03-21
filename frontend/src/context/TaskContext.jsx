import { createContext, useState, useCallback } from 'react';
import axios from 'axios';

export const TaskContext = createContext();

const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get all tasks
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/tasks');
      setTasks(res.data);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error fetching tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get single task
  const getTask = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`/api/tasks/${id}`);
      setCurrentTask(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.msg || 'Error fetching task');
      console.error('Error fetching task:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create task
  const createTask = async (taskData) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post('/api/tasks', taskData);
      setTasks([...tasks, res.data]);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.msg || 'Error creating task');
      console.error('Error creating task:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update task
  const updateTask = async (id, taskData) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.put(`/api/tasks/${id}`, taskData);
      setTasks(tasks.map(task => task._id === id ? res.data : task));
      if (currentTask && currentTask._id === id) {
        setCurrentTask(res.data);
      }
      return res.data;
    } catch (err) {
      setError(err.response?.data?.msg || 'Error updating task');
      console.error('Error updating task:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete task
  const deleteTask = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await axios.delete(`/api/tasks/${id}`);
      setTasks(tasks.filter(task => task._id !== id));
      if (currentTask && currentTask._id === id) {
        setCurrentTask(null);
      }
      return true;
    } catch (err) {
      setError(err.response?.data?.msg || 'Error deleting task');
      console.error('Error deleting task:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get scheduled tasks
  const fetchScheduledTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/tasks/scheduled');
      setScheduledTasks(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.msg || 'Error fetching scheduled tasks');
      console.error('Error fetching scheduled tasks:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Schedule tasks
  const scheduleTasks = async (tasks) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post('/api/tasks/schedule', { tasks });
      setScheduledTasks(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.msg || 'Error scheduling tasks');
      console.error('Error scheduling tasks:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Search tasks
  const searchTasks = async (query) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`/api/tasks/search?q=${query}`);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.msg || 'Error searching tasks');
      console.error('Error searching tasks:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Clear errors
  const clearError = () => setError(null);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        currentTask,
        scheduledTasks,
        loading,
        error,
        fetchTasks,
        getTask,
        createTask,
        updateTask,
        deleteTask,
        fetchScheduledTasks,
        scheduleTasks,
        searchTasks,
        clearError
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export default TaskProvider; 