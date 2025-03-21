import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Snackbar,
  Tooltip
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  CreditCard as CreditCardIcon
} from '@mui/icons-material';
import { BudgetContext } from '../../context/BudgetContext';

const BudgetForm = () => {
  const { createBudget, updateBudget, getBudget, addBudgetItem, deleteBudgetItem, loading, error, clearError } = useContext(BudgetContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [budget, setBudget] = useState({
    title: '',
    totalAmount: '',
    items: []
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [itemFormData, setItemFormData] = useState({
    name: '',
    cost: '',
    value: ''
  });
  const [itemFormErrors, setItemFormErrors] = useState({});
  const [openItemDialog, setOpenItemDialog] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch budget data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchBudgetData = async () => {
        const budgetData = await getBudget(id);
        if (budgetData) {
          setBudget({
            title: budgetData.title,
            totalAmount: budgetData.totalAmount,
            items: budgetData.items || []
          });
        }
      };
      
      fetchBudgetData();
    }
    
    return () => clearError();
  }, [id, isEditMode, getBudget, clearError]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBudget({ ...budget, [name]: value });
    
    // Clear validation error when user types
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  // Handle item form input changes
  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setItemFormData({ ...itemFormData, [name]: value });
    
    // Clear validation error when user types
    if (itemFormErrors[name]) {
      setItemFormErrors({ ...itemFormErrors, [name]: '' });
    }
  };

  // Validate budget form
  const validateBudgetForm = () => {
    const errors = {};
    
    if (!budget.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!budget.totalAmount) {
      errors.totalAmount = 'Total amount is required';
    } else if (isNaN(budget.totalAmount) || parseFloat(budget.totalAmount) <= 0) {
      errors.totalAmount = 'Total amount must be a positive number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate item form
  const validateItemForm = () => {
    const errors = {};
    
    if (!itemFormData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!itemFormData.cost) {
      errors.cost = 'Cost is required';
    } else if (isNaN(itemFormData.cost) || parseFloat(itemFormData.cost) <= 0) {
      errors.cost = 'Cost must be a positive number';
    }
    
    if (!itemFormData.value) {
      errors.value = 'Value is required';
    } else if (isNaN(itemFormData.value) || parseFloat(itemFormData.value) <= 0) {
      errors.value = 'Value must be a positive number';
    }
    
    setItemFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateBudgetForm()) {
      return;
    }
    
    setSaving(true);
    
    try {
      const budgetData = {
        ...budget,
        totalAmount: parseFloat(budget.totalAmount)
      };
      
      if (isEditMode) {
        await updateBudget(id, budgetData);
        setSuccessMessage('Budget updated successfully');
      } else {
        const newBudget = await createBudget(budgetData);
        setSuccessMessage('Budget created successfully');
        if (newBudget && newBudget._id) {
          setTimeout(() => navigate(`/budgets/${newBudget._id}`), 1500);
        } else {
          setTimeout(() => navigate('/budgets'), 1500);
        }
      }
    } catch (err) {
      console.error('Error saving budget:', err);
    } finally {
      setSaving(false);
    }
  };

  // Open item dialog for adding or editing
  const openAddItemDialog = () => {
    setItemFormData({ name: '', cost: '', value: '' });
    setItemFormErrors({});
    setEditingItemIndex(null);
    setOpenItemDialog(true);
  };

  // Open dialog for editing an existing item
  const openEditItemDialog = (index) => {
    const item = budget.items[index];
    setItemFormData({
      name: item.name,
      cost: item.cost.toString(),
      value: item.value.toString()
    });
    setItemFormErrors({});
    setEditingItemIndex(index);
    setOpenItemDialog(true);
  };

  // Close item dialog
  const handleCloseItemDialog = () => {
    setOpenItemDialog(false);
  };

  // Add or update an item
  const handleSaveItem = () => {
    if (!validateItemForm()) {
      return;
    }
    
    const newItem = {
      name: itemFormData.name,
      cost: parseFloat(itemFormData.cost),
      value: parseFloat(itemFormData.value)
    };
    
    let updatedItems;
    
    if (editingItemIndex !== null) {
      // Update existing item
      updatedItems = [...budget.items];
      updatedItems[editingItemIndex] = newItem;
    } else {
      // Add new item
      updatedItems = [...budget.items, newItem];
    }
    
    setBudget({ ...budget, items: updatedItems });
    setOpenItemDialog(false);
  };

  // Delete an item
  const handleDeleteItem = (index) => {
    const updatedItems = [...budget.items];
    updatedItems.splice(index, 1);
    setBudget({ ...budget, items: updatedItems });
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate total cost of all items
  const calculateTotalCost = () => {
    return budget.items.reduce((sum, item) => sum + item.cost, 0);
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <IconButton 
          onClick={() => navigate('/budgets')}
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Edit Budget' : 'Create New Budget'}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper elevation={3} sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Budget Title"
                name="title"
                value={budget.title}
                onChange={handleChange}
                error={!!formErrors.title}
                helperText={formErrors.title}
                disabled={loading || saving}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Amount"
                name="totalAmount"
                type="number"
                value={budget.totalAmount}
                onChange={handleChange}
                error={!!formErrors.totalAmount}
                helperText={formErrors.totalAmount}
                disabled={loading || saving}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Budget Items</Typography>
              <Button 
                variant="outlined" 
                startIcon={<AddIcon />}
                onClick={openAddItemDialog}
                disabled={loading || saving}
              >
                Add Item
              </Button>
            </Box>
            
            {budget.items.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell align="right">Cost</TableCell>
                      <TableCell align="right">Value</TableCell>
                      <TableCell align="right">Value/Cost Ratio</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {budget.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">{formatCurrency(item.cost)}</TableCell>
                        <TableCell align="right">{item.value}</TableCell>
                        <TableCell align="right">
                          {(item.value / item.cost).toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit Item">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => openEditItemDialog(index)}
                              disabled={loading || saving}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Item">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteItem(index)}
                              disabled={loading || saving}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={1} sx={{ fontWeight: 'bold' }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(calculateTotalCost())}
                      </TableCell>
                      <TableCell colSpan={3} />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography color="text.secondary">
                  No items added yet. Click "Add Item" to start building your budget.
                </Typography>
              </Box>
            )}
            
            {budget.items.length > 0 && (
              <Box sx={{ mt: 2, p: 2, bgcolor: budget.totalAmount && calculateTotalCost() > budget.totalAmount ? 'error.lightest' : 'background.paper', borderRadius: 1 }}>
                <Typography variant="body2" color={budget.totalAmount && calculateTotalCost() > budget.totalAmount ? 'error' : 'text.secondary'}>
                  {budget.totalAmount ? (
                    calculateTotalCost() > budget.totalAmount ? (
                      `Warning: Total cost exceeds budget by ${formatCurrency(calculateTotalCost() - budget.totalAmount)}`
                    ) : (
                      `Remaining budget: ${formatCurrency(budget.totalAmount - calculateTotalCost())}`
                    )
                  ) : 'Set a total budget amount to see remaining budget'}
                </Typography>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/budgets')}
              disabled={saving}
              startIcon={<CloseIcon />}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || saving}
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {saving ? 'Saving...' : isEditMode ? 'Update Budget' : 'Create Budget'}
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Item Dialog */}
      <Dialog open={openItemDialog} onClose={handleCloseItemDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItemIndex !== null ? 'Edit Item' : 'Add Item'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Item Name"
                  name="name"
                  value={itemFormData.name}
                  onChange={handleItemChange}
                  error={!!itemFormErrors.name}
                  helperText={itemFormErrors.name}
                  required
                  autoFocus
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cost"
                  name="cost"
                  type="number"
                  value={itemFormData.cost}
                  onChange={handleItemChange}
                  error={!!itemFormErrors.cost}
                  helperText={itemFormErrors.cost}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Value (1-10)"
                  name="value"
                  type="number"
                  inputProps={{ min: 1, max: 10, step: 0.5 }}
                  value={itemFormData.value}
                  onChange={handleItemChange}
                  error={!!itemFormErrors.value}
                  helperText={itemFormErrors.value || 'Rate how important this item is to you (1-10)'}
                  required
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseItemDialog}>
            Cancel
          </Button>
          <Button onClick={handleSaveItem} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage('')}
        message={successMessage}
      />
    </Box>
  );
};

export default BudgetForm; 