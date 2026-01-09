const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");

// @description     Get all Messages
// @route           GET /api/message/:chatId
// @access          Protected
const allMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find({ chat: req.params.chatId })
    .populate("sender", "name pic email")
    .populate({
      path: "chat",
      populate: {
        path: "users",
        select: "name pic email",
      },
    });

  res.status(200).json(messages);
});

// @description     Create New Message
// @route           POST /api/message
// @access          Protected
const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    return res.status(400).json({ message: "Invalid data" });
  }

  // 1️⃣ Create message (DB write)
  const message = await Message.create({
    sender: req.user._id,
    content,
    chat: chatId,
  });

  // 2️⃣ Populate safely (NO execPopulate)
  const fullMessage = await Message.findById(message._id)
    .populate("sender", "name pic email")
    .populate({
      path: "chat",
      populate: {
        path: "users",
        select: "name pic email",
      },
    });

  // 3️⃣ Update latestMessage (non-blocking)
  await Chat.findByIdAndUpdate(chatId, {
    latestMessage: message._id,
  });

  // 4️⃣ Respond cleanly
  res.status(200).json(fullMessage);
});

module.exports = { allMessages, sendMessage };
