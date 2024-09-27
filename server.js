// Load environment variables from .env file
require('dotenv').config();

const cors = require('cors');
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Set the views directory

// Serve static files from the public directory
app.use(express.static('public'));

// Use CORS middleware
app.use(cors());

// Route for the home page
app.get('/', (req, res) => {
    const clientId = process.env.SPOTIFY_CLIENT_ID || 'YOUR_CLIENT_ID_HERE'; // Fallback for local testing
    res.render('index', { clientId }); // Pass clientId to the EJS template
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
