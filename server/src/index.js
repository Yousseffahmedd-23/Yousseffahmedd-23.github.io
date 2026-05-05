const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config({ path: '../.env' });

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.json({ message: 'API is running...' });
});

// Routes
// app.use('/api/users', require('./routes/userRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
