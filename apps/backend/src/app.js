const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const routes = require("./routes");
const { errorMiddleware } = require("./middleware/error");
const { env } = require("./config/env");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("tiny"));

app.use("/api", routes);
app.use(errorMiddleware);

module.exports = app;
