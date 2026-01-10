const express = require("express");
const {
  allUsers,
  registerUser,
  authUser,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @route   POST /api/user
 * @desc    Register new user
 * @access  Public
 */
router.post("/", registerUser);

/**
 * @route   POST /api/user/login
 * @desc    Login user
 * @access  Public
 */
router.post("/login", authUser);

/**
 * @route   GET /api/user?search=
 * @desc    Search users
 * @access  Protected
 */
router.get("/", protect, allUsers);

module.exports = router;
