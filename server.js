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

// Route for the home page
app.get('/', (req, res) => {
    const clientId = process.env.SPOTIFY_CLIENT_ID || 'YOUR_CLIENT_ID_HERE'; // Fallback for local testing
    res.render('index', { clientId }); // Pass clientId to the EJS template
});

// Route for the widget
app.get('/widget', async (req, res) => {
    // Here you should obtain a valid access token
    const accessToken = req.query.access_token; // For simplicity, access token is passed as a query param

    // Validate accessToken
    if (!accessToken) {
        return res.status(401).send('Access token is required');
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Current Track Widget</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #121212;
                    color: #ffffff;
                    text-align: center;
                    padding: 20px;
                }
                h2 {
                    color: #1DB954; /* Spotify Green */
                }
                #widget {
                    background-color: #282828;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 20px auto;
                    max-width: 300px;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
                }
                img {
                    border-radius: 10px;
                    margin-top: 10px;
                }
            </style>
        </head>
        <body>
            <div id="widget">
                <h2>Currently Playing</h2>
                <p id="track-name">Track Name: N/A</p>
                <p id="artist-name">Artist: N/A</p>
                <p id="album-name">Album: N/A</p>
                <img id="album-cover" src="" alt="Album Cover" style="width:100%; height:auto;">
            </div>

            <script>
                const accessToken = '${accessToken}'; // Get the access token from the query parameters
                const updateTrackInfo = async () => {
                    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
                        headers: {
                            'Authorization': \`Bearer \${accessToken}\`
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data && data.item) {
                            document.getElementById('track-name').textContent = data.item.name;
                            document.getElementById('artist-name').textContent = data.item.artists[0].name;
                            document.getElementById('album-name').textContent = data.item.album.name;
                            document.getElementById('album-cover').src = data.item.album.images[0].url;
                        } else {
                            document.getElementById('track-name').textContent = 'Track Name: N/A';
                            document.getElementById('artist-name').textContent = 'Artist: N/A';
                            document.getElementById('album-name').textContent = 'Album: N/A';
                            document.getElementById('album-cover').src = '';
                        }
                    } else {
                        document.getElementById('track-name').textContent = 'Error fetching track';
                    }
                };

                setInterval(updateTrackInfo, 2000); // Poll every 2 seconds
            </script>
        </body>
        </html>
    `);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
