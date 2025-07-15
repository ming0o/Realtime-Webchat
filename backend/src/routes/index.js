const express = require("express");
const router = express.Router();

const userRoutes = require("./users");
const chatRoomRoutes = require("./chatRooms");
const messageRoutes = require("./messages");

router.use("/users", userRoutes);
router.use("/chat-rooms", chatRoomRoutes);
router.use("/messages", messageRoutes);

module.exports = router;
