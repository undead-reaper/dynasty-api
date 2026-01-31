import type { MatchSelectSchema } from "@/drizzle/schemas/matches";
import type { Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import type z from "zod";

interface WebSocketWithAlive extends WebSocket {
  isAlive: boolean;
}

const sendJson = (ws: WebSocket, payload: any) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
};

const broadcast = (wss: WebSocketServer, payload: any) => {
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(payload));
      } catch (error) {
        console.error("Error broadcasting to client:", error);
      }
    }
  }
};

export const attachWebSocketServer = (server: Server) => {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });
  wss.on("connection", (ws: WebSocket) => {
    const wsAlive = ws as WebSocketWithAlive;
    wsAlive.isAlive = true;
    wsAlive.on("pong", () => {
      wsAlive.isAlive = true;
    });
    sendJson(wsAlive, { type: "welcome" });
    wsAlive.on("error", console.error);
  });
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const wsAlive = ws as WebSocketWithAlive;
      if (!wsAlive.isAlive) {
        return wsAlive.terminate();
      }
      wsAlive.isAlive = false;
      wsAlive.ping();
    });
  }, 30000);
  wss.on("close", () => clearInterval(interval));
  const broadCastMatchCreated = (match: z.infer<typeof MatchSelectSchema>) => {
    broadcast(wss, { type: "match_created", data: match });
  };
  return { broadCastMatchCreated };
};
