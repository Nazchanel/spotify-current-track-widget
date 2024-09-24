const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'index.html');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading file');
            return;
        }
        const clientId = process.env.SPOTIFY_CLIENT_ID || 'YOUR_CLIENT_ID_HERE'; // Fallback for local testing
        const updatedData = data.replace('{client id}', clientId);
        res.send(updatedData);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

