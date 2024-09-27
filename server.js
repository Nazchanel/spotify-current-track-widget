// Load environment variables from .env file
require('dotenv').config();

const cors = require('cors');
const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Set the views directory

// Use CORS middleware
app.use(cors());

// Route for the home page
app.get('/other', (req, res) => {
    const accessToken = process.env.ACCESS_TOKEN; // Get access token from environment variable
    res.render('index', { accessToken });
});

// Route to fetch currently playing track as JSON
app.get('/currently-playing', async (req, res) => {
    const accessToken = process.env.ACCESS_TOKEN; // Use your stored access token

    if (!accessToken) {
        return res.status(401).send('Access token is required');
    }

    try {
        const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.status === 200) {
            res.json(response.data.item); // Return track information as JSON
        } else {
            res.status(400).send('Failed to fetch track info.');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching track info.');
    }
});

// Route to serve live track information in SVG format
app.get('/', async (req, res) => {
    const accessToken = process.env.ACCESS_TOKEN; // Use your stored access token

    if (!accessToken) {
        return res.status(401).send('Access token is required');
    }

    try {
        const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (response.status === 200) {
            const track = response.data.item;

            // Create the SVG string with album cover
            const svg = `
                <svg
                    width="400"
                    height="600"
                    viewBox="0 0 400 600"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    role="img"
                    aria-labelledby="descId"
                >
                    <title id="titleId">${track.name}, Artist: ${track.artists[0].name}</title>
                    <desc id="descId">Album: ${track.album.name}, Duration: ${Math.floor(track.duration_ms / 60000)}:${((track.duration_ms % 60000) / 1000).toFixed(0).padStart(2, '0')}</desc>
                    <style>
                        .header {
                            font: 600 20px 'Segoe UI', Ubuntu, Sans-Serif;
                            fill: #2aa889;
                            animation: fadeInAnimation 0.8s ease-in-out forwards;
                        }
                        .stat {
                            font: 600 16px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif; fill: #99d1ce;
                        }
                        .stagger {
                            opacity: 0;
                            animation: fadeInAnimation 0.3s ease-in-out forwards;
                        }
                        .icon {
                            fill: #599cab;
                            display: block;
                        }
                        .card-bg {
                            stroke: #960606;
                            fill: #0c1014;
                        }
                        /* Animations */
                        @keyframes fadeInAnimation {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                    </style>

                    <rect
                        class="card-bg"
                        x="0.5"
                        y="0.5"
                        rx="20"
                        height="99%"
                        width="399"
                        stroke-opacity="1"
                    />

                    <g transform="translate(25, 25)">
                        <text class="header" data-testid="header">Currently Playing</text>
                    </g>

                    <!-- Album Cover -->
                    <image href="${track.album.images[0].url}" x="50" y="60" width="300" height="300" clip-path="url(#clip)" />
                    <defs>
                        <clipPath id="clip">
                            <rect width="300" height="300" />
                        </clipPath>
                    </defs>

                    <!-- Track Information -->
                    <g transform="translate(25, 380)">
                        <text class="stat bold" x="0" y="20">Track:</text>
                        <text class="stat bold" x="70" y="20" data-testid="track">${track.name}</text>
                    </g>
                    <g transform="translate(25, 420)">
                        <text class="stat bold" x="0" y="20">Artist:</text>
                        <text class="stat bold" x="70" y="20" data-testid="artist">${track.artists[0].name}</text>
                    </g>
                    <g transform="translate(25, 460)">
                        <text class="stat bold" x="0" y="20">Album:</text>
                        <text class="stat bold" x="70" y="20" data-testid="album">${track.album.name}</text>
                    </g>
                    <g transform="translate(25, 500)">
                        <text class="stat bold" x="0" y="20">Duration:</text>
                        <text class="stat bold" x="70" y="20" data-testid="duration">${Math.floor(track.duration_ms / 60000)}:${((track.duration_ms % 60000) / 1000).toFixed(0).padStart(2, '0')}</text>
                    </g>
                </svg>
            `;

            // Set the content type to XML for SVG
            res.set('Content-Type', 'image/svg+xml');
            res.send(svg);
        } else {
            res.status(400).send('Failed to fetch track info.');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching track info.');
    }
});

// Route to render pretty page
app.get('/pretty', async (req, res) => {
    const clientId = process.env.SPOTIFY_CLIENT_ID || 'YOUR_CLIENT_ID_HERE'; // Fallback for local testing
    res.render('pretty', { clientId }); // Pass clientId to the EJS template
}); // Fixed closing bracket here

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
