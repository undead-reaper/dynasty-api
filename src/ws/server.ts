import { wsArcjet } from "@/arcjet";
import type { MatchSelectSchema } from "@/drizzle/schemas/matches";
import type { Request } from "express";
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
  server.on("upgrade", async (request, socket) => {
    try {
      const decision = await wsArcjet.protect(request);
      if (decision.isDenied()) {
        if (decision.reason.isRateLimit()) {
          socket.write("HTTP/1.1 429 Too Many Requests");
          return socket.destroy();
        } else {
          socket.write("HTTP/1.1 401 Unauthorized");
          return socket.destroy();
        }
      }
    } catch (error) {
      console.error("WS Upgrade Protection Error:", error);
      socket.write("HTTP/1.1 500 Internal Server Error");
      return socket.destroy();
    }
  });
  wss.on("connection", async (ws: WebSocket, req: Request) => {
    try {
      const decision = await wsArcjet.protect(req);
      if (decision.isDenied()) {
        const code = decision.reason.isRateLimit() ? 1013 : 1008;
        const reason = decision.reason.isRateLimit()
          ? "Rate limit exceeded"
          : "Unauthorized";
        return ws.close(code, reason);
      } else {
        const wsAlive = ws as WebSocketWithAlive;
        wsAlive.isAlive = true;
        wsAlive.on("pong", () => {
          wsAlive.isAlive = true;
        });
        sendJson(wsAlive, { type: "welcome" });
        wsAlive.on("error", console.error);
      }
    } catch (error) {
      console.error("Error during WebSocket connection setup:", error);
      return ws.close(1011, "Internal server error");
    }
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
