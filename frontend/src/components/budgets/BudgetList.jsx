import { useState, useEffect, useContext } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  CreditCard as CreditCardIcon,
  Sort as SortIcon,
  Visibility as VisibilityIcon,
  PieChart as PieChartIcon
} from '@mui/icons-material';
import { BudgetContext } from '../../context/BudgetContext';
import moment from 'moment';

const BudgetList = () => {
  const { budgets, loading, error, fetchBudgets, deleteBudget } = useContext(BudgetContext);
  
  const [filteredBudgets, setFilteredBudgets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  useEffect(() => {
    if (budgets) {
      let filtered = [...budgets];
      
      // Apply search filter
      if (searchTerm) {
        filtered = filtered.filter(budget => 
          budget.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        const [field, direction] = sortBy.split('-');
        
        if (field === 'date') {
          const dateA = new Date(a.createdAt || a.updatedAt);
          const dateB = new Date(b.createdAt || b.updatedAt);
          return direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        
        if (field === 'amount') {
          return direction === 'asc' ? a.totalAmount - b.totalAmount : b.totalAmount - a.totalAmount;
        }
        
        if (field === 'title') {
          return direction === 'asc' 
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title);
        }
        
        if (field === 'items') {
          return direction === 'asc' 
            ? a.items.length - b.items.length
            : b.items.length - a.items.length;
        }
        
        return 0;
      });
      
      setFilteredBudgets(filtered);
    }
  }, [budgets, searchTerm, sortBy]);

  const handleDeleteBudget = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      setDeleteLoading(true);
      await deleteBudget(id);
      setDeleteLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return moment(date).format('MMM DD, YYYY');
  };

  const calculateUtilization = (budget) => {
    if (!budget.items || budget.items.length === 0) return 0;
    
    const totalCost = budget.items.reduce((sum, item) => sum + item.cost, 0);
    return Math.min(Math.round((totalCost / budget.totalAmount) * 100), 100);
  };

  const getUtilizationColor = (percentage) => {
    if (percentage >= 90) return 'error';
    if (percentage >= 70) return 'warning';
    return 'primary';
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Budgets
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ mr: 1 }}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button 
            component={RouterLink} 
            to="/budgets/new" 
            variant="contained" 
            startIcon={<AddIcon />}
          >
            New Budget
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {showFilters && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Filters & Sorting</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Search Budgets"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="Sort By"
                >
                  <MenuItem value="date-desc">Newest First</MenuItem>
                  <MenuItem value="date-asc">Oldest First</MenuItem>
                  <MenuItem value="amount-desc">Highest Amount</MenuItem>
                  <MenuItem value="amount-asc">Lowest Amount</MenuItem>
                  <MenuItem value="title-asc">Title (A-Z)</MenuItem>
                  <MenuItem value="title-desc">Title (Z-A)</MenuItem>
                  <MenuItem value="items-desc">Most Items</MenuItem>
                  <MenuItem value="items-asc">Least Items</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button 
                startIcon={<RefreshIcon />}
                onClick={() => {
                  setSearchTerm('');
                  setSortBy('date-desc');
                }}
              >
                Reset Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : filteredBudgets.length > 0 ? (
        <Grid container spacing={3}>
          {filteredBudgets.map(budget => {
            const utilization = calculateUtilization(budget);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={budget._id}>
                <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="h6" component={RouterLink} to={`/budgets/${budget._id}`} sx={{ textDecoration: 'none', color: 'inherit' }}>
                        {budget.title}
                      </Typography>
                      <Chip 
                        icon={<CreditCardIcon />} 
                        label={formatCurrency(budget.totalAmount)}
                        color="primary"
                        size="small"
                      />
                    </Box>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Box mb={2}>
                      <Typography variant="body2" gutterBottom sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Budget Utilization:</span>
                        <span>{utilization}%</span>
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={utilization} 
                        color={getUtilizationColor(utilization)}
                        sx={{ height: 8, borderRadius: 5 }}
                      />
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" mb={1.5}>
                      <Typography variant="body2" color="text.secondary">
                        {budget.items.length} Items
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Created: {formatDate(budget.createdAt || new Date())}
                      </Typography>
                    </Box>
                    
                    {budget.optimizedItems && budget.optimizedItems.length > 0 ? (
                      <Chip 
                        icon={<PieChartIcon />} 
                        label="Optimized"
                        color="success"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    ) : null}
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Tooltip title="View Budget">
                      <IconButton 
                        component={RouterLink} 
                        to={`/budgets/${budget._id}`}
                        size="small"
                        color="info"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Budget">
                      <IconButton 
                        component={RouterLink} 
                        to={`/budgets/${budget._id}/edit`}
                        size="small"
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Box flexGrow={1} />
                    <Tooltip title="Delete Budget">
                      <IconButton 
                        onClick={() => handleDeleteBudget(budget._id)}
                        size="small"
                        color="error"
                        disabled={deleteLoading}
                      >
                        {deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No budgets found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {searchTerm ? 'Try changing your search term' : 'Get started by creating your first budget'}
          </Typography>
          <Button 
            component={RouterLink} 
            to="/budgets/new" 
            variant="contained" 
            startIcon={<AddIcon />}
          >
            Create Budget
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default BudgetList; 