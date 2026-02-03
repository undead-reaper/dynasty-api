import { wsArcjet } from "@/arcjet";
import type { CommentarySelectSchema } from "@/drizzle/schemas/commentaries";
import type { MatchSelectSchema } from "@/drizzle/schemas/matches";
import type { Request } from "express";
import type { Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import type z from "zod";

interface WebSocketWithAlive extends WebSocket {
  isAlive: boolean;
  subscriptions: Set<string>;
}

const matchSubscribers = new Map<string, Set<WebSocket>>();

const subscribeToMatch = (matchId: string, ws: WebSocket) => {
  if (!matchSubscribers.has(matchId)) {
    matchSubscribers.set(matchId, new Set());
  }
  matchSubscribers.get(matchId)?.add(ws);
};

const unsubscribeFromMatch = (matchId: string, ws: WebSocket) => {
  const subscribers = matchSubscribers.get(matchId);
  if (subscribers) {
    subscribers.delete(ws);
    if (subscribers.size === 0) {
      matchSubscribers.delete(matchId);
    }
  }
};

const cleanupSubscriptions = (ws: WebSocket) => {
  const wsWithSubs = ws as WebSocketWithAlive;
  for (const matchId of wsWithSubs.subscriptions) {
    unsubscribeFromMatch(matchId, ws);
  }
};

const broadcastToMatch = (matchId: string, payload: any) => {
  const subscribers = matchSubscribers.get(matchId);
  if (subscribers && subscribers.size !== 0) {
    const message = JSON.stringify(payload);
    for (const client of subscribers) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }
};

const handleMessage = (ws: WebSocket, data: WebSocket.Data) => {
  const wsWithSubs = ws as WebSocketWithAlive;
  try {
    const message = JSON.parse(data.toString());
    if (message.type === "subscribe" && Number.isInteger(message.matchId)) {
      subscribeToMatch(message.matchId, ws);
      wsWithSubs.subscriptions.add(message.matchId);
      sendJson(ws, { type: "subscribed", matchId: message.matchId });
    } else if (
      message.type === "unsubscribe" &&
      Number.isInteger(message.matchId)
    ) {
      unsubscribeFromMatch(message.matchId, ws);
      wsWithSubs.subscriptions.delete(message.matchId);
      sendJson(ws, { type: "unsubscribed", matchId: message.matchId });
    }
  } catch (error) {
    sendJson(ws, { type: "error", error: "Invalid JSON" });
  }
};

const sendJson = (ws: WebSocket, payload: any) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
};

const broadcastToAll = (wss: WebSocketServer, payload: any) => {
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
        wsAlive.subscriptions = new Set();
        sendJson(wsAlive, { type: "welcome" });
        wsAlive.on("message", (data) => handleMessage(wsAlive, data));
        wsAlive.on("error", () => {
          wsAlive.terminate();
        });
        wsAlive.on("close", () => {
          cleanupSubscriptions(wsAlive);
        });
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
    broadcastToAll(wss, { type: "match_created", data: match });
  };
  const broadCastCommentary = (
    matchId: string,
    commentary: z.infer<typeof CommentarySelectSchema>,
  ) => {
    broadcastToMatch(matchId, { type: "commentary", data: commentary });
  };
  return { broadCastMatchCreated, broadCastCommentary };
};
