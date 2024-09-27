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

// Serve static files from the public directory
app.use(express.static('public'));

// Use CORS middleware
app.use(cors());

// Route for the home page
app.get('/', (req, res) => {
    const accessToken = process.env.ACCESS_TOKEN; // Get access token from environment variable
    res.render('index', { accessToken });
});
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

// Route to serve the canvas image
app.get('/currently-playing-image', async (req, res) => {
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

            // Serve a simple HTML page with canvas rendering
            res.send(`
                <!DOCTYPE html>
                <html>
                <body>
                    <canvas id="trackCanvas" width="400" height="200"></canvas>
                    <script>
                        const canvas = document.getElementById('trackCanvas');
                        const context = canvas.getContext('2d');

                        async function drawTrackInfo() {
                            const response = await fetch('/currently-playing');
                            const track = await response.json();

                            context.fillStyle = '#282828'; // Background color
                            context.fillRect(0, 0, canvas.width, canvas.height);
                            context.fillStyle = '#ffffff'; // Text color
                            context.font = '20px Arial';
                            context.fillText('Track: ' + track.name, 20, 40);
                            context.fillText('Artist: ' + track.artists[0].name, 20, 80);
                            context.fillText('Album: ' + track.album.name, 20, 120);
                        }

                        // Call the function every 5 seconds to update the canvas
                        setInterval(drawTrackInfo, 5000); // Update every 5 seconds

                        // Initial call to draw track info
                        drawTrackInfo();
                    </script>
                </body>
                </html>
            `);
        } else {
            res.status(400).send('Failed to fetch track info.');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching track info.');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
