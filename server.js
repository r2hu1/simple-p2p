const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const path = require("path")

// Store active rooms and their participants
const rooms = {};

// Middleware to serve static files (if needed)
app.use(express.static("public"));
app.get("/",(req,res)=>{
    res.sendFile(path.join(__dirname, "app", "home.html"));
});

// Event handling for Socket.IO
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle room creation
  socket.on("createRoom", (roomName) => {
    if (rooms[roomName]) {
      socket.emit("error", { message: "Room already exists." });
      return;
    }
    rooms[roomName] = [];
    console.log(`Room created: ${roomName}`);
    socket.emit("roomCreated", roomName);
  });

  // Handle joining a room
  socket.on("joinRoom", (roomName) => {
    if (!rooms[roomName]) {
      socket.emit("error", { message: "Room does not exist." });
      return;
    }
    if (rooms[roomName].length >= 4) {
      socket.emit("error", { message: "Room is full." });
      return;
    }

    // Add user to the room
    rooms[roomName].push(socket.id);
    socket.join(roomName);
    console.log(`User ${socket.id} joined room: ${roomName}`);

    // Notify the room of the new participant
    io.to(roomName).emit("userJoined", {
      userId: socket.id,
      participants: rooms[roomName],
    });
  });

  // Handle file sharing
  socket.on("shareFile", ({ roomName, file }) => {
    if (!rooms[roomName]) {
      socket.emit("error", { message: "Room does not exist." });
      return;
    }

    // Broadcast the file to all participants in the room
    socket.to(roomName).emit("receiveFile", { sender: socket.id, file });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);

    // Remove user from any rooms they were part of
    for (const roomName in rooms) {
      const index = rooms[roomName].indexOf(socket.id);
      if (index !== -1) {
        rooms[roomName].splice(index, 1);

        // Notify remaining participants
        io.to(roomName).emit("userLeft", {
          userId: socket.id,
          participants: rooms[roomName],
        });

        // Delete the room if empty
        if (rooms[roomName].length === 0) {
          delete rooms[roomName];
          console.log(`Room deleted: ${roomName}`);
        }
      }
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
