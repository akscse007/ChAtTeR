const express = require("express");
const http = require("http");
const cors = require("cors");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

connectDB();

const app = express();

/* 🔑 IMPORTANT FOR RENDER */
app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:3000",
  "https://chatter-frontend-cqvl.onrender.com",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

/* 🔑 SOCKET.IO MUST BE CREATED BEFORE listen */
const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: allowedOrigins,
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
      .emit("message received", newMessageReceived);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});
