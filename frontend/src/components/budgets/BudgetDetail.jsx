import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  IconButton,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  PieChart as PieChartIcon,
  CreditCard as CreditCardIcon
} from '@mui/icons-material';
import { BudgetContext } from '../../context/BudgetContext';

const BudgetDetail = () => {
  const { getBudget, deleteBudget, loading, error } = useContext(BudgetContext);
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [budget, setBudget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  useEffect(() => {
    const fetchBudget = async () => {
      const budgetData = await getBudget(id);
      if (budgetData) {
        setBudget(budgetData);
      }
    };
    
    fetchBudget();
  }, [getBudget, id]);
  
  // Handle budget deletion
  const handleDelete = async () => {
    setDeleting(true);
    await deleteBudget(id);
    setDeleteDialogOpen(false);
    setDeleting(false);
    navigate('/budgets');
  };
  
  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Calculate total cost of all items
  const calculateTotalCost = () => {
    if (!budget || !budget.items || !budget.items.length) return 0;
    return budget.items.reduce((sum, item) => sum + item.cost, 0);
  };
  
  // Calculate percentage of budget used
  const calculateBudgetUtilization = () => {
    if (!budget || !budget.totalAmount) return 0;
    const totalCost = calculateTotalCost();
    return (totalCost / budget.totalAmount) * 100;
  };
  
  // Get color based on budget utilization
  const getUtilizationColor = (percentage) => {
    if (percentage >= 100) return 'error';
    if (percentage >= 75) return 'warning';
    return 'success';
  };
  
  // Sort items by value/cost ratio (descending)
  const getSortedItems = () => {
    if (!budget || !budget.items) return [];
    return [...budget.items].sort((a, b) => (b.value / b.cost) - (a.value / a.cost));
  };
  
  if (loading && !budget) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  
  if (!budget) {
    return <Alert severity="info">Budget not found</Alert>;
  }
  
  const totalCost = calculateTotalCost();
  const utilization = calculateBudgetUtilization();
  const utilizationColor = getUtilizationColor(utilization);
  const sortedItems = getSortedItems();
  
  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => navigate('/budgets')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {budget.title}
        </Typography>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Budget Overview
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Budget
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(budget.totalAmount)}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Allocated</span>
                <span>{Math.round(utilization)}% of budget</span>
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(totalCost)}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(utilization, 100)} 
                  color={utilizationColor}
                  sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                />
              </Box>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Remaining Budget
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ fontWeight: 'bold' }}
                color={budget.totalAmount - totalCost < 0 ? 'error.main' : 'inherit'}
              >
                {formatCurrency(budget.totalAmount - totalCost)}
              </Typography>
            </Box>
            
            {budget.createdAt && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Created on {formatDate(budget.createdAt)}
                </Typography>
                {budget.updatedAt && budget.updatedAt !== budget.createdAt && (
                  <Typography variant="body2" color="text.secondary">
                    Last updated on {formatDate(budget.updatedAt)}
                  </Typography>
                )}
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Optimization Analysis
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Budget Health
                </Typography>
                <Chip 
                  label={utilization >= 100 ? 'Over Budget' : utilization >= 90 ? 'Near Limit' : 'Healthy'} 
                  color={utilizationColor} 
                  size="small"
                />
              </Box>
              
              <Box sx={{ maxWidth: 500 }}>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  {budget.items && budget.items.length > 0 ? (
                    <>
                      You have {budget.items.length} item{budget.items.length !== 1 ? 's' : ''} in this budget.
                      {sortedItems.length > 0 && ` "${sortedItems[0].name}" has the best value for cost.`}
                    </>
                  ) : (
                    'This budget has no items yet.'
                  )}
                </Typography>
                
                {utilization > 100 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    This budget is over allocated by {formatCurrency(totalCost - budget.totalAmount)}.
                    Consider removing lower value items or increasing your budget.
                  </Alert>
                )}
                
                {utilization < 100 && utilization > 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    You still have {formatCurrency(budget.totalAmount - totalCost)} remaining in this budget.
                  </Alert>
                )}
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/budgets/edit/${id}`)}
              >
                Edit Budget
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Budget Items */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Budget Items
        </Typography>
        
        {budget.items && budget.items.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Cost</TableCell>
                  <TableCell align="right">Value (1-10)</TableCell>
                  <TableCell align="right">Value/Cost Ratio</TableCell>
                  <TableCell align="right">% of Budget</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedItems.map((item, index) => {
                  const valueRatio = item.value / item.cost;
                  const percentOfBudget = (item.cost / budget.totalAmount) * 100;
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell align="right">{formatCurrency(item.cost)}</TableCell>
                      <TableCell align="right">{item.value.toFixed(1)}</TableCell>
                      <TableCell 
                        align="right"
                        sx={{ 
                          fontWeight: 'bold',
                          color: valueRatio > 1 ? 'success.main' : valueRatio < 0.5 ? 'error.main' : 'warning.main'
                        }}
                      >
                        {valueRatio.toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        {percentOfBudget.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell colSpan={1} sx={{ fontWeight: 'bold' }}>Total</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(totalCost)}
                  </TableCell>
                  <TableCell colSpan={3} />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography color="text.secondary">
              No items added to this budget yet.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              sx={{ mt: 2 }}
              onClick={() => navigate(`/budgets/edit/${id}`)}
            >
              Add Budget Items
            </Button>
          </Box>
        )}
      </Paper>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Budget</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the budget "{budget.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BudgetDetail; 