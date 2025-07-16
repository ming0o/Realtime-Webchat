const express = require("express");
const router = express.Router();

const userRoutes = require("./users");
const chatRoomRoutes = require("./chatRooms");
const messageRoutes = require("./messages");
const macroRoutes = require("./macros");

router.use("/users", userRoutes);
router.use("/chat-rooms", chatRoomRoutes);
router.use("/messages", messageRoutes);
router.use("/macros", macroRoutes);

module.exports = router;
