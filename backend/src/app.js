const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const setupSwagger = require("./swagger");

const app = express();

app.use(cors());
app.use(express.json());
setupSwagger(app);

// 기본 상태 체크
app.get("/", (req, res) => {
    res.send("서버가 정상 작동하고 있습니다!");
});

app.use("/api", routes);

module.exports = app;
