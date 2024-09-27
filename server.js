// Load environment variables from .env file
require('dotenv').config();

const cors = require('cors');
const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const refreshToken = process.env.REFRESH_TOKEN;
let accessToken; // Declare accessToken here to maintain its state across requests

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Set the views directory

// Use CORS middleware
app.use(cors());

function escapeXML(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/'/g, "&apos;")
        .replace(/"/g, "&quot;");
}

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

// Middleware to fetch currently playing track
async function fetchCurrentlyPlaying(req, res, next) {
    await refreshAccessToken(); // Refresh access token before making a request
    if (!accessToken) {
        return res.status(401).send('Access token is required');
    }

    try {
        const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (response.status === 200) {
            req.currentTrack = response.data.item; // Attach currently playing track to the request
        } else {
            req.currentTrack = null; // No currently playing track
        }
    } catch (error) {
        console.error('Error fetching currently playing track:', error);
        req.currentTrack = null; // Handle error by setting currentTrack to null
    }

    next(); // Proceed to the next middleware or route handler
}

// Apply middleware to all routes
app.use(fetchCurrentlyPlaying);

// Route for the home page
app.get('/other', (req, res) => {
    res.render('index', { accessToken, currentTrack: req.currentTrack });
});

// Route to fetch currently playing track as JSON
app.get('/currently-playing', (req, res) => {
    if (!req.currentTrack) {
        return res.status(204).send('No track is currently playing.');
    }
    res.json(req.currentTrack); // Return track information as JSON
});

// Route to serve live track information in SVG format
// Route to serve live track information in SVG format
app.get('/', async (req, res) => {
    await refreshAccessToken(); // Make sure access token is refreshed

    try {
        const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        // Handle the case where no song is currently playing
        if (response.status === 204 || !response.data) {
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
                    <title id="titleId">No song currently playing</title>
                    <style>
                        .header {
                            font: 600 20px 'Segoe UI', Ubuntu, Sans-Serif;
                            fill: #2aa889;
                            animation: fadeInAnimation 0.8s ease-in-out forwards;
                        }
                        .stat {
                            font: 600 16px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif;
                            fill: #99d1ce;
                        }
                        .card-bg {
                            stroke: #960606;
                            fill: #0c1014;
                        }
                        @keyframes fadeInAnimation {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                    </style>
                    <rect class="card-bg" x="0.5" y="0.5" height="99%" width="399" stroke-opacity="1" />
                    <g transform="translate(25, 25)">
                        <text class="header" data-testid="header">No song is currently playing</text>
                    </g>
                </svg>
            `;

            // Return the SVG response for no song playing
            res.set('Content-Type', 'image/svg+xml');
            res.send(svg);
            return;
        }

        const track = response.data.item; // Extract track information if a song is playing

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
                <title id="titleId">${escapeXML(track.name)}, Artist: ${escapeXML(track.artists[0].name)}</title>
                <desc id="descId">Album: ${escapeXML(track.album.name)}, Duration: ${Math.floor(track.duration_ms / 60000)}:${((track.duration_ms % 60000) / 1000).toFixed(0).padStart(2, '0')}</desc>
                <style>
                    .header {
                        font: 600 20px 'Segoe UI', Ubuntu, Sans-Serif;
                        fill: #2aa889;
                        animation: fadeInAnimation 0.8s ease-in-out forwards;
                    }
                    .stat {
                        font: 600 16px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif;
                        fill: #99d1ce;
                    }
                    .card-bg {
                        stroke: #960606;
                        fill: #0c1014;
                    }
                    @keyframes fadeInAnimation {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                </style>

                <rect
                    class="card-bg"
                    x="0.5"
                    y="0.5"
                    height="99%"
                    width="399"
                    stroke-opacity="1"
                />

                <g transform="translate(25, 25)">
                    <text class="header" data-testid="header">Currently Playing</text>
                </g>

                <!-- Adjusted Album Cover -->
                <image href="${track.album.images[0].url}" x="50" y="60" width="300" height="300" preserveAspectRatio="xMidYMid slice" />

                <!-- Track Information -->
                <g transform="translate(25, 380)">
                    <text class="stat bold" x="0" y="20">Track:</text>
                    <text class="stat bold" x="70" y="20" data-testid="track">${escapeXML(track.name)}</text>
                </g>
                <g transform="translate(25, 420)">
                    <text class="stat bold" x="0" y="20">Artist:</text>
                    <text class="stat bold" x="70" y="20" data-testid="artist">${escapeXML(track.artists[0].name)}</text>
                </g>
                <g transform="translate(25, 460)">
                    <text class="stat bold" x="0" y="20">Album:</text>
                    <text class="stat bold" x="70" y="20" data-testid="album">${escapeXML(track.album.name)}</text>
                </g>
            <g transform="translate(25, 500)">
    <text class="stat bold" x="0" y="20">Duration:</text>
    <text class="stat bold" x="80" y="20" data-testid="duration">${Math.floor(track.duration_ms / 60000)}:${((track.duration_ms % 60000) / 1000).toFixed(0).padStart(2, '0')}</text>
</g>

            </svg>
        `;

        // Set the content type to XML for SVG
        res.set('Content-Type', 'image/svg+xml');
        res.send(svg);

    } catch (error) {
        console.error('Error fetching track info:', error);
        res.status(500).send('Error fetching track info.');
    }
});



// Route to render pretty page
app.get('/pretty', (req, res) => {
    const clientId = process.env.SPOTIFY_CLIENT_ID || 'YOUR_CLIENT_ID_HERE'; // Fallback for local testing
    res.render('pretty', { clientId, currentTrack: req.currentTrack }); // Pass currentTrack to the EJS template
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
