import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { createServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { setLogEmitter } from "./bot/botLogger.js";
import { setStatusEmitter } from "./bot/core.js";

const app: Express = express();
export const httpServer = createServer(app);

export const io = new SocketIOServer(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  path: "/api/socket.io",
});

io.on("connection", (socket) => {
  logger.info({ id: socket.id }, "Panel client connected");
  socket.on("disconnect", () => {
    logger.info({ id: socket.id }, "Panel client disconnected");
  });
});

setLogEmitter((entry) => {
  io.emit("log", entry);
});

setStatusEmitter((data: object) => {
  io.emit("bot-status", data);
});

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
