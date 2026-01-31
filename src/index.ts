import { securityMiddleware } from "@/arcjet";
import { serverEnv } from "@/env/server";
import { matchRouter } from "@/routes/matches";
import { attachWebSocketServer } from "@/ws/server";
import express from "express";
import http from "http";

const PORT = Number(serverEnv.PORT);
const HOST = serverEnv.HOST;

const app = express();
const server = http.createServer(app);

app.use(express.json());

app.get("/", (_, res) => {
  res.status(200).json({ message: "Welcome to the Dynasty API" });
});

app.use(securityMiddleware());
app.use("/matches", matchRouter);
const { broadCastMatchCreated } = attachWebSocketServer(server);
app.locals.broadCastMatchCreated = broadCastMatchCreated;

app.get("/ping", (_, res) => {
  res.status(200).json({ message: "pong" });
});

server.listen(PORT, HOST, () => {
  const baseUrl =
    HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
  const wsUrl = baseUrl.replace("http", "ws");
  console.log(`Server is running at ${baseUrl}`);
  console.log(`WebSocket server is running at ${wsUrl}/ws`);
});
