const express = require("express");
const {
  accessChat,
  fetchChats,
  createGroupChat,
  removeFromGroup,
  addToGroup,
  renameGroup,
} = require("../controllers/chatController"); // 🔥 FIXED NAME
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// One-to-one chat
router.route("/").post(protect, accessChat);
router.route("/").get(protect, fetchChats);

// Group chat
router.route("/group").post(protect, createGroupChat);
router.route("/rename").put(protect, renameGroup);
router.route("/groupremove").put(protect, removeFromGroup);
router.route("/groupadd").put(protect, addToGroup);

module.exports = router;
