const socket = io();
let myColor = null;

const video = document.getElementById("camera");
const scoreboard = document.getElementById("scoreboard");
const canvas = document.createElement("canvas"); // hidden canvas
const ctx = canvas.getContext("2d");

document.getElementById("joinBtn").onclick = () => {
    myColor = document.getElementById("colorPicker").value;
    socket.emit("join", myColor);
    startCamera();
};

document.getElementById("shootBtn").onclick = () => {
    detectOtherColors();
};

document.getElementById("scoreboardBtn").onclick = () => {
    scoreboard.style.display = scoreboard.style.display === "block" ? "none" : "block";
};

socket.on("updatePlayers", (players) => {
    updateScoreboard(players);
});

socket.on("gameOver", (winnerColor) => {
    alert("Game Over! Winner: " + winnerColor);
});

function updateScoreboard(players) {
    scoreboard.innerHTML = "";
    for (let id in players) {
        let p = players[id];
        let statusClass = p.alive ? "alive" : "dead";
        scoreboard.innerHTML += `<div class="score-entry ${statusClass}" style="border-left: 5px solid ${p.color};">
            ${p.color.toUpperCase()} - ${p.alive ? "Alive" : "Dead"}
        </div>`;
    }
}

function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
            video.srcObject = stream;
            video.play();
        })
        .catch(err => {
            console.error("Camera error:", err);
            alert("Unable to access camera: " + err.message);
        });
}

function detectOtherColors() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const colorCounts = { red: 0, blue: 0, green: 0, yellow: 0 };

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (r > 150 && g < 100 && b < 100) colorCounts.red++;
        else if (b > 150 && r < 100 && g < 100) colorCounts.blue++;
        else if (g > 150 && r < 100 && b < 100) colorCounts.green++;
        else if (r > 150 && g > 150 && b < 100) colorCounts.yellow++;
    }

    // Find strongest color that is NOT player's own color
    let targetColor = Object.keys(colorCounts)
        .filter(c => c !== myColor)
        .reduce((a, b) => colorCounts[a] > colorCounts[b] ? a : b);

    console.log("Detected target color:", targetColor);
    socket.emit("shoot", targetColor);
}
