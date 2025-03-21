import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { blue, indigo } from '@mui/material/colors';
import { AuthProvider } from './context/AuthContext';
import TaskProvider from './context/TaskContext';
import BudgetProvider from './context/BudgetContext';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Profile from './components/auth/Profile';
import PrivateRoute from './components/routing/PrivateRoute';

// Task Components
import TaskList from './components/tasks/TaskList';
import TaskForm from './components/tasks/TaskForm';
import TaskDetail from './components/tasks/TaskDetail';

// Budget Components
import BudgetList from './components/budgets/BudgetList';
import BudgetForm from './components/budgets/BudgetForm';
import BudgetDetail from './components/budgets/BudgetDetail';

// Schedule Component
import Schedule from './components/schedule/Schedule';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: blue[600],
    },
    secondary: {
      main: indigo[500],
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <TaskProvider>
          <BudgetProvider>
            <Router>
              <Layout>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/" element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  } />
                  <Route path="/profile" element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  } />
                  
                  {/* Task Routes */}
                  <Route path="/tasks" element={
                    <PrivateRoute>
                      <TaskList />
                    </PrivateRoute>
                  } />
                  <Route path="/tasks/new" element={
                    <PrivateRoute>
                      <TaskForm />
                    </PrivateRoute>
                  } />
                  <Route path="/tasks/edit/:id" element={
                    <PrivateRoute>
                      <TaskForm />
                    </PrivateRoute>
                  } />
                  <Route path="/tasks/:id" element={
                    <PrivateRoute>
                      <TaskDetail />
                    </PrivateRoute>
                  } />
                  
                  {/* Budget Routes */}
                  <Route path="/budgets" element={
                    <PrivateRoute>
                      <BudgetList />
                    </PrivateRoute>
                  } />
                  <Route path="/budgets/new" element={
                    <PrivateRoute>
                      <BudgetForm />
                    </PrivateRoute>
                  } />
                  <Route path="/budgets/edit/:id" element={
                    <PrivateRoute>
                      <BudgetForm />
                    </PrivateRoute>
                  } />
                  <Route path="/budgets/:id" element={
                    <PrivateRoute>
                      <BudgetDetail />
                    </PrivateRoute>
                  } />
                  
                  {/* Schedule Route */}
                  <Route path="/schedule" element={
                    <PrivateRoute>
                      <Schedule />
                    </PrivateRoute>
                  } />
                </Routes>
              </Layout>
            </Router>
          </BudgetProvider>
        </TaskProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
