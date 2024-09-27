// Load environment variables from .env file
require('dotenv').config();

const cors = require('cors');
const express = require('express');
const path = require('path');
const axios = require('axios'); // Import axios for making HTTP requests

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Set the views directory

// Serve static files from the public directory
app.use(express.static('public'));

// Use CORS middleware
app.use(cors());

let accessToken = process.env.ACCESS_TOKEN;
const refreshToken = process.env.REFRESH_TOKEN;

// Function to refresh the access token
async function refreshAccessToken() {
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);
    params.append('client_id', process.env.SPOTIFY_CLIENT_ID);
    params.append('client_secret', process.env.SPOTIFY_CLIENT_SECRET);

    try {
        const response = await axios.post(tokenUrl, params);
        accessToken = response.data.access_token; // Update the access token
    } catch (error) {
        console.error('Error refreshing access token:', error);
    }
}

// Route for the home page
app.get('/', (req, res) => {
    const clientId = process.env.SPOTIFY_CLIENT_ID || 'YOUR_CLIENT_ID_HERE'; // Fallback for local testing
    res.render('index', { clientId }); // Pass clientId to the EJS template
});

// Route for getting currently playing track
app.get('/currently-playing', async (req, res) => {
    await refreshAccessToken(); // Refresh access token before making a request
    try {
        const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (response.status === 200) {
            res.json(response.data);
        } else {
            res.status(response.status).json({ error: 'Unable to fetch currently playing track' });
        }
    } catch (error) {
        console.error('Error fetching currently playing track:', error);
        res.status(500).json({ error: 'Error fetching currently playing track' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
