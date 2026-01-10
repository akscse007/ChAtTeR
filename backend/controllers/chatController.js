const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");

// ---------------- ACCESS / CREATE ONE TO ONE CHAT ----------------
const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).send("UserId not provided");
  }

  let isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password")
    .populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name pic email",
  });

  if (isChat.length > 0) {
    return res.send(isChat[0]);
  }

  const chatData = {
    chatName: "sender",
    isGroupChat: false,
    users: [req.user._id, userId],
  };

  const createdChat = await Chat.create(chatData);
  const fullChat = await Chat.findById(createdChat._id).populate(
    "users",
    "-password"
  );

  res.status(200).json(fullChat);
});

// ---------------- FETCH ALL CHATS ----------------
const fetchChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({
    users: { $elemMatch: { $eq: req.user._id } },
  })
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    .populate("latestMessage")
    .sort({ updatedAt: -1 });

  const populatedChats = await User.populate(chats, {
    path: "latestMessage.sender",
    select: "name pic email",
  });

  res.status(200).json(populatedChats);
});

// ---------------- CREATE GROUP CHAT ----------------
const createGroupChat = asyncHandler(async (req, res) => {
  let { users, name } = req.body;

  if (!users || !name) {
    return res.status(400).json({ message: "Please fill all fields" });
  }

  if (typeof users === "string") {
    users = JSON.parse(users);
  }

  if (!Array.isArray(users) || users.length < 2) {
    return res
      .status(400)
      .json({ message: "At least 2 users required" });
  }

  users.push(req.user._id);

  const groupChat = await Chat.create({
    chatName: name,
    users,
    isGroupChat: true,
    groupAdmin: req.user._id,
  });

  const fullGroupChat = await Chat.findById(groupChat._id)
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  res.status(200).json(fullGroupChat);
});

// ---------------- RENAME GROUP (ADMIN ONLY) ----------------
const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  if (chat.groupAdmin.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only admin can rename the group");
  }

  chat.chatName = chatName;
  await chat.save();

  const updatedChat = await Chat.findById(chatId)
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  res.json(updatedChat);
});

// ---------------- ADD USER (ADMIN ONLY, NO DUPLICATES) ----------------
const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  if (chat.groupAdmin.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only admin can add users");
  }

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { $addToSet: { users: userId } },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  res.json(updatedChat);
});

// ---------------- REMOVE USER (ADMIN ONLY, ADMIN SAFE) ----------------
const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  if (chat.groupAdmin.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only admin can remove users");
  }

  if (chat.groupAdmin.toString() === userId.toString()) {
    res.status(400);
    throw new Error("Admin cannot remove themselves");
  }

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { $pull: { users: userId } },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  res.json(updatedChat);
});

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};
