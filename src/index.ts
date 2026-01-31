import { matchRouter } from "@/routes/matches";
import express from "express";

const app = express();
const port = 8080;

app.use(express.json());

app.get("/", (_, res) => {
  res.status(200).json({ message: "Welcome to the Dynasty API" });
});

app.use("/matches", matchRouter);

app.get("/ping", (_, res) => {
  res.status(200).json({ message: "pong" });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
