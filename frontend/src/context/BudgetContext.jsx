import { createContext, useState, useCallback, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

export const BudgetContext = createContext();

export const BudgetProvider = ({ children }) => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useContext(AuthContext);

  // Clear error
  const clearError = () => setError(null);

  // Configure axios headers
  const config = useCallback(() => {
    return {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    };
  }, [token]);

  // Get all budgets
  const getBudgets = useCallback(async () => {
    clearError();
    setLoading(true);
    
    try {
      const res = await axios.get('/api/budgets', config());
      setBudgets(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to fetch budgets');
      console.error('Error fetching budgets:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [config]);

  // Get a single budget
  const getBudget = useCallback(async (id) => {
    clearError();
    setLoading(true);
    
    try {
      const res = await axios.get(`/api/budgets/${id}`, config());
      return res.data;
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to fetch budget');
      console.error('Error fetching budget:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [config]);

  // Create a budget
  const createBudget = useCallback(async (budgetData) => {
    clearError();
    setLoading(true);
    
    try {
      const res = await axios.post('/api/budgets', budgetData, config());
      setBudgets([...budgets, res.data]);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create budget');
      console.error('Error creating budget:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [budgets, config]);

  // Update a budget
  const updateBudget = useCallback(async (id, budgetData) => {
    clearError();
    setLoading(true);
    
    try {
      const res = await axios.put(`/api/budgets/${id}`, budgetData, config());
      
      // Update budgets state
      setBudgets(
        budgets.map(budget => (budget._id === id ? res.data : budget))
      );
      
      return res.data;
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update budget');
      console.error('Error updating budget:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [budgets, config]);

  // Delete a budget
  const deleteBudget = useCallback(async (id) => {
    clearError();
    setLoading(true);
    
    try {
      await axios.delete(`/api/budgets/${id}`, config());
      
      // Remove the deleted budget from state
      setBudgets(budgets.filter(budget => budget._id !== id));
      
      return true;
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to delete budget');
      console.error('Error deleting budget:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [budgets, config]);

  // Add a budget item
  const addBudgetItem = useCallback(async (budgetId, itemData) => {
    clearError();
    setLoading(true);
    
    try {
      const res = await axios.post(
        `/api/budgets/${budgetId}/items`,
        itemData,
        config()
      );
      
      // Update budgets state
      setBudgets(
        budgets.map(budget => (budget._id === budgetId ? res.data : budget))
      );
      
      return res.data;
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to add budget item');
      console.error('Error adding budget item:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [budgets, config]);

  // Update a budget item
  const updateBudgetItem = useCallback(async (budgetId, itemId, itemData) => {
    clearError();
    setLoading(true);
    
    try {
      const res = await axios.put(
        `/api/budgets/${budgetId}/items/${itemId}`,
        itemData,
        config()
      );
      
      // Update budgets state
      setBudgets(
        budgets.map(budget => (budget._id === budgetId ? res.data : budget))
      );
      
      return res.data;
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update budget item');
      console.error('Error updating budget item:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [budgets, config]);

  // Delete a budget item
  const deleteBudgetItem = useCallback(async (budgetId, itemId) => {
    clearError();
    setLoading(true);
    
    try {
      const res = await axios.delete(
        `/api/budgets/${budgetId}/items/${itemId}`,
        config()
      );
      
      // Update budgets state
      setBudgets(
        budgets.map(budget => (budget._id === budgetId ? res.data : budget))
      );
      
      return res.data;
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to delete budget item');
      console.error('Error deleting budget item:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [budgets, config]);

  return (
    <BudgetContext.Provider
      value={{
        budgets,
        loading,
        error,
        clearError,
        getBudgets,
        getBudget,
        createBudget,
        updateBudget,
        deleteBudget,
        addBudgetItem,
        updateBudgetItem,
        deleteBudgetItem
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};

export default BudgetProvider; 