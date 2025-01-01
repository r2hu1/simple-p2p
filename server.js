const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const rooms = {};

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "app", "home.html"));
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle room creation
  socket.on("createRoom", (roomName) => {
    if (!roomName || typeof roomName !== "string") {
      socket.emit("error", { message: "Invalid room name." });
      return;
    }

    if (rooms[roomName]) {
      socket.emit("error", { message: "Room already exists." });
      return;
    }

    rooms[roomName] = [];
    console.log(`Room created: ${roomName}`);
    socket.emit("roomCreated", roomName);
  });

  socket.on("joinRoom", (roomName) => {
    if (!roomName || typeof roomName !== "string") {
      socket.emit("error", { message: "Invalid room name." });
      return;
    }

    if (!rooms[roomName]) {
      socket.emit("error", { message: "Room does not exist." });
      return;
    }

    if (rooms[roomName].length >= 4) {
      socket.emit("error", { message: "Room is full." });
      return;
    }

    rooms[roomName].push(socket.id);
    socket.join(roomName);
    console.log(`User ${socket.id} joined room: ${roomName}`);

    io.to(roomName).emit("userJoined", {
      userId: socket.id,
      participants: rooms[roomName],
    });

    socket.emit("joinSuccess", { roomName, participants: rooms[roomName] });
  });

  socket.on("shareFile", ({ roomName, file }) => {
    if (!roomName || !rooms[roomName]) {
      socket.emit("error", { message: "Room does not exist." });
      return;
    }

    if (!file) {
      socket.emit("error", { message: "No file provided." });
      return;
    }

    console.log(`File shared in room ${roomName} by user ${socket.id}`);
    socket.to(roomName).emit("receiveFile", { sender: socket.id, file });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);

    for (const roomName in rooms) {
      const index = rooms[roomName].indexOf(socket.id);
      if (index !== -1) {
        rooms[roomName].splice(index, 1);

        io.to(roomName).emit("userLeft", {
          userId: socket.id,
          participants: rooms[roomName],
        });

        if (rooms[roomName].length === 0) {
          delete rooms[roomName];
          console.log(`Room deleted: ${roomName}`);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3010;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
