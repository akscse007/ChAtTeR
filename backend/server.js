const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");
const http = require("http");

// Load env variables
dotenv.config();

// Connect to DB
connectDB();

const app = express();
app.use(express.json());

// API routes
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// ---------------- DEPLOYMENT ----------------
const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/frontend/build")));

  app.get("*", (req, res) =>
    res.sendFile(
      path.resolve(__dirname1, "frontend", "build", "index.html")
    )
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}
// ---------------- DEPLOYMENT ----------------

// Error handling
app.use(notFound);
app.use(errorHandler);

// Server
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}...`);
});

// ---------------- SOCKET.IO ----------------
const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  // User setup (optional, kept for future use)
  socket.on("setup", (userData) => {
    if (!userData || !userData._id) return;
    socket.join(userData._id.toString());
    socket.emit("connected");
  });

  // Join chat room
  socket.on("join chat", (roomId) => {
    if (!roomId) return;
    socket.join(roomId.toString());
    console.log("User joined chat room:", roomId);
  });

  // Typing indicators
  socket.on("typing", (roomId) => {
    socket.in(roomId.toString()).emit("typing");
  });

  socket.on("stop typing", (roomId) => {
    socket.in(roomId.toString()).emit("stop typing");
  });

  // ✅ OPTION B: MESSAGE DELIVERY VIA CHAT ROOM
  socket.on("new message", (newMessageRecieved) => {
    const chat = newMessageRecieved.chat;

    if (!chat || !chat._id) {
      console.log("Chat or chat._id missing");
      return;
    }

    socket
      .in(chat._id.toString())
      .emit("message recieved", newMessageRecieved);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});
