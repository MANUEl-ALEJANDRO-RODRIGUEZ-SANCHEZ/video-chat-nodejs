const express = require('express');
const socket = require('socket.io');

// App setup
const app = express();
const server = app.listen(4000, () => {
    console.log("Listening to requests on port 4000");
    console.log("http://localhost:4000");
});

// Static files
app.use(express.static('public'));

// Socket setup
const io = socket(server);
io.on('connection', (socket) => {
    console.log("Made socket connection", socket.id);

    // Handle signaling events
    socket.on('offer', (data) => {
        socket.broadcast.emit('offer', data); // Forward the offer to other users
    });

    socket.on('answer', (data) => {
        socket.broadcast.emit('answer', data); // Forward the answer
    });

    socket.on('candidate', (data) => {
        socket.broadcast.emit('candidate', data); // Forward ICE candidates
    });
});
