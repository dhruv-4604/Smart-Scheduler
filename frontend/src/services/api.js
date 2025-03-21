import axios from 'axios';

// Set base URL for all API requests
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create an axios instance with custom config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token to headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized responses
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      
      // Only redirect if not already on login/register page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Export the configured axios instance
export default apiClient;

// Authentication API calls
export const authAPI = {
  // Login user
  login: async (email, password) => {
    try {
      const response = await apiClient.post('/auth', { email, password });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Unable to connect to server' };
    }
  },
  
  // Register user
  register: async (userData) => {
    try {
      const response = await apiClient.post('/users', userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Unable to connect to server' };
    }
  },
  
  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/auth');
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Unable to connect to server' };
    }
  },
  
  // Update profile
  updateProfile: async (userData) => {
    try {
      const response = await apiClient.put('/users', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Unable to connect to server' };
    }
  },
  
  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await apiClient.put('/users/password', passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Unable to connect to server' };
    }
  },
  
  // Logout - just clear the token, no API call needed
  logout: () => {
    localStorage.removeItem('token');
  }
};

// Tasks API calls
export const tasksAPI = {
  // Get all tasks
  getTasks: async () => {
    try {
      const response = await apiClient.get('/tasks');
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Unable to connect to server' };
    }
  },
  
  // Get task by id
  getTask: async (id) => {
    try {
      const response = await apiClient.get(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Unable to connect to server' };
    }
  },
  
  // Create new task
  createTask: async (taskData) => {
    try {
      const response = await apiClient.post('/tasks', taskData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Unable to connect to server' };
    }
  },
  
  // Update task
  updateTask: async (id, taskData) => {
    try {
      const response = await apiClient.put(`/tasks/${id}`, taskData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Unable to connect to server' };
    }
  },
  
  // Delete task
  deleteTask: async (id) => {
    try {
      const response = await apiClient.delete(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Unable to connect to server' };
    }
  },
  
  // Get scheduled tasks
  getScheduledTasks: async () => {
    try {
      const response = await apiClient.get('/tasks/scheduled');
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Unable to connect to server' };
    }
  },
  
  // Schedule tasks
  scheduleTasks: async (data) => {
    try {
      const response = await apiClient.post('/tasks/schedule', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Unable to connect to server' };
    }
  },
  
  // Search tasks
  searchTasks: async (query) => {
    try {
      const response = await apiClient.get(`/tasks/search?q=${query}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Unable to connect to server' };
    }
  }
};

// Budgets API calls
export const budgetsAPI = {
  // Get all budgets
  getBudgets: async () => {
    try {
      const response = await apiClient.get('/budgets');
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Unable to connect to server' };
    }
  },
  
  // Get budget by id
  getBudget: async (id) => {
    try {
      const response = await apiClient.get(`/budgets/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Unable to connect to server' };
    }
  },
  
  // Create new budget
  createBudget: async (budgetData) => {
    try {
      const response = await apiClient.post('/budgets', budgetData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Unable to connect to server' };
    }
  },
  
  // Update budget
  updateBudget: async (id, budgetData) => {
    try {
      const response = await apiClient.put(`/budgets/${id}`, budgetData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Unable to connect to server' };
    }
  },
  
  // Delete budget
  deleteBudget: async (id) => {
    try {
      const response = await apiClient.delete(`/budgets/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Unable to connect to server' };
    }
  },
  
  // Optimize budget
  optimizeBudget: async (id, constraints) => {
    try {
      const response = await apiClient.post(`/budgets/${id}/optimize`, constraints);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Unable to connect to server' };
    }
  },
  
  // Add budget item
  addBudgetItem: async (budgetId, itemData) => {
    try {
      const response = await apiClient.post(`/budgets/${budgetId}/items`, itemData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Unable to connect to server' };
    }
  },
  
  // Update budget item
  updateBudgetItem: async (budgetId, itemId, itemData) => {
    try {
      const response = await apiClient.put(`/budgets/${budgetId}/items/${itemId}`, itemData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Unable to connect to server' };
    }
  },
  
  // Delete budget item
  deleteBudgetItem: async (budgetId, itemId) => {
    try {
      const response = await apiClient.delete(`/budgets/${budgetId}/items/${itemId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { msg: 'Unable to connect to server' };
    }
  }
}; 