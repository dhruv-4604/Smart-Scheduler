# SmartPlanner Scheduler - Backend

A Task and Budget Management System with intelligent algorithms for task scheduling and budget optimization.

## Features

### Task Scheduler
- Create, read, update, and delete tasks
- Set priorities, deadlines, and estimated durations
- Intelligent scheduling using job scheduling algorithms:
  - Earliest Deadline First (EDF)
  - Priority-based Scheduling
  - Shortest Job First (SJF)
  - Smart Scheduling (weighted combination)

### Budget Planner
- Create, read, update, and delete budgets
- Add items with cost and value metrics
- Optimize budget allocation using 0/1 Knapsack algorithm
- Support for category constraints in budget optimization

## Technologies Used

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication
- **bcrypt** - Password hashing

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
2. Navigate to the backend folder:
   ```
   cd backend
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a .env file with the following variables:
   ```
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

### Running the Server

Development mode:
```
npm run dev
```

Production mode:
```
npm start
```

## API Endpoints

### Authentication
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login and get token
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update user profile

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/schedule` - Schedule tasks using algorithms

### Budgets
- `GET /api/budgets` - Get all budgets
- `GET /api/budgets/:id` - Get budget by ID
- `POST /api/budgets` - Create new budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget
- `POST /api/budgets/:id/items` - Add item to budget
- `DELETE /api/budgets/:id/items/:itemId` - Remove item from budget
- `POST /api/budgets/:id/optimize` - Optimize budget using knapsack algorithm

## Algorithms

### Task Scheduling
Located in `src/utils/algorithms/jobScheduling.js`

### Budget Optimization (Knapsack)
Located in `src/utils/algorithms/knapsack.js`

### Binary Search (for frontend search functionality)
Located in `src/utils/algorithms/binarySearch.js` 