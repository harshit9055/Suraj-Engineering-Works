const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const path = require('path');
const multer = require('multer');

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Environment variables
const jwtSecret = process.env.JWT_SECRET;
const dbConnectionString = process.env.DB_CONNECTION_STRING;

// Check if environment variables are defined
if (!jwtSecret || !dbConnectionString) {
    console.error('JWT_SECRET or DB_CONNECTION_STRING is not defined in the environment variables.');
    process.exit(1);
}

const app = express();
const PORT = 5000;

// Custom authentication middleware
const authMiddleware = require('./authMiddleware');

// Middleware for parsing JSON bodies
app.use(express.json());

// Middleware to serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose.connect(dbConnectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// User model (Define your schema)
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    role: { type: String, required: true },
    profilePhoto: { type: String },
}));

// Middleware for logging requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Root route to serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Protected route
app.get('/dashboard', authMiddleware, (req, res) => {
    res.status(200).json({ message: 'Welcome to the employee dashboard' });
});

// Register route
app.post('/register', async (req, res) => {
    const { username, password, name, phone, email, age, gender, role } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword, name, phone, email, age, gender, role });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: '1h' });

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// API Endpoint to get user profile
app.get('/api/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            name: user.name,
            phone: user.phone,
            email: user.email,
            age: user.age,
            gender: user.gender,
            role: user.role,
            profilePhoto: user.profilePhoto
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// API Endpoint to update user profile
app.post('/api/updateProfile', authMiddleware, upload.single('profilePhoto'), async (req, res) => {
    const { name, phone, email, age, gender, role } = req.body;
    const profilePhoto = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = name;
        user.phone = phone;
        user.email = email;
        user.age = age;
        user.gender = gender;
        user.role = role;

        if (profilePhoto) user.profilePhoto = profilePhoto;

        await user.save();
        res.status(200).json({ message: 'Profile updated successfully!' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
