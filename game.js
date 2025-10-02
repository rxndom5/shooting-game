const socket = io();
let myColor = null;

const video = document.getElementById("camera");
const scoreboard = document.getElementById("scoreboard");
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
const gunshotSound = new Audio("sound/gun.mp3");

document.getElementById("joinBtn").onclick = () => {
    myColor = document.getElementById("colorPicker").value;
    socket.emit("join", myColor);
    startCamera();
};

document.getElementById("shootBtn").onclick = () => {
    gunshotSound.currentTime = 0; // rewind sound
    gunshotSound.play();
    detectOtherColors();
};


document.getElementById("scoreboardBtn").onclick = () => {
    scoreboard.style.display = (scoreboard.style.display === "block") ? "none" : "block";
};

document.getElementById("fullscreenBtn").onclick = () => {
    toggleFullScreen();
};

socket.on("updatePlayers", (players) => {
    updateScoreboard(players);
});

socket.on("gameOver", (winnerColor) => {
    alert("Game Over! Winner: " + winnerColor);
});

// 🚨 New event: when THIS player is eliminated
socket.on("eliminated", () => {
    alert("❌ You are eliminated!");
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
    if (!video.videoWidth || !video.videoHeight) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const centerX = Math.floor(canvas.width / 2);
    const centerY = Math.floor(canvas.height / 2);

    const sampleSize = 5;
    const imageData = ctx.getImageData(centerX - 2, centerY - 2, sampleSize, sampleSize);
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

    let targetColor = Object.keys(colorCounts)
        .filter(c => c !== myColor && colorCounts[c] > 0)
        .reduce((a, b) => colorCounts[a] > colorCounts[b] ? a : b, null);

    if (targetColor) {
        console.log("Detected target color:", targetColor);
        socket.emit("shoot", targetColor);
    } else {
        console.log("No valid target detected");
    }
}

function toggleFullScreen() {
    const doc = document.documentElement;
    if (!document.fullscreenElement) {
        if (doc.requestFullscreen) doc.requestFullscreen();
        else if (doc.webkitRequestFullscreen) doc.webkitRequestFullscreen();
        else if (doc.msRequestFullscreen) doc.msRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
    }
}
