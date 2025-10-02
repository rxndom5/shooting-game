const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static(__dirname));

let players = {}; // { socketId: {color, alive} }

io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    socket.on("join", (color) => {
        players[socket.id] = { color, alive: true };
        io.emit("updatePlayers", players);
    });

    socket.on("shoot", (targetColor) => {
        console.log("Shoot:", targetColor);

        // Find the alive target player with that color
        let targetId = Object.keys(players).find(
            id => players[id].color === targetColor && players[id].alive
        );

        if (targetId) {
            // Mark them dead
            players[targetId].alive = false;

            // Notify *that specific player* they are eliminated
            io.to(targetId).emit("eliminated");

            // Update scoreboard for everyone
            io.emit("updatePlayers", players);

            // Check if the game is over
            checkGameOver();
        } else {
            console.log("No alive player with color", targetColor);
        }
    });

    socket.on("disconnect", () => {
        delete players[socket.id];
        io.emit("updatePlayers", players);
    });

    function checkGameOver() {
        const alivePlayers = Object.values(players).filter(p => p.alive);
        if (alivePlayers.length === 1) {
            io.emit("gameOver", alivePlayers[0].color);
        }
    }
});

http.listen(3000, '0.0.0.0', () => console.log("Server running on port 3000"));
