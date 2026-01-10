const express = require("express");
const http = require("http");
const cors = require("cors");

// Load env only in development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// ---------------- CONNECT DB ----------------
connectDB();

// ---------------- APP INIT ----------------
const app = express();

// ---------------- CORS (🔥 THIS FIXES SIGNUP / LOGIN) ----------------
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://chatter-frontend-cqvl.onrender.com",
    ],
    credentials: true,
  })
);

// ---------------- BODY PARSERS ----------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------- API ROUTES ----------------
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// ---------------- HEALTH CHECK ----------------
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ---------------- ERROR HANDLING ----------------
app.use(notFound);
app.use(errorHandler);

// ---------------- SERVER ----------------
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});

// ---------------- SOCKET.IO ----------------
const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: [
      "http://localhost:3000",
      "https://chatter-frontend-cqvl.onrender.com",
    ],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  socket.on("setup", (userData) => {
    if (!userData?._id) return;
    socket.join(userData._id.toString());
    socket.emit("connected");
  });

  socket.on("join chat", (roomId) => {
    if (!roomId) return;
    socket.join(roomId.toString());
  });

  socket.on("typing", (roomId) => {
    socket.in(roomId.toString()).emit("typing");
  });

  socket.on("stop typing", (roomId) => {
    socket.in(roomId.toString()).emit("stop typing");
  });

  socket.on("new message", (newMessageReceived) => {
    const chat = newMessageReceived?.chat;
    if (!chat?._id) return;

    socket
      .in(chat._id.toString())
      .emit("message recieved", newMessageReceived);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});
