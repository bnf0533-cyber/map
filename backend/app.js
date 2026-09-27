import express from "express";
import { createServer } from "http";
import cors from "cors";
import "dotenv/config";
import "./db/config.db.js";

import { initSocket } from "./utils/socket.js";
import authRoutes from "./routes/auth.routes.js";
import incidentRoutes from "./routes/incidents.routes.js";
import { errorHandler } from "./utils/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

const server = createServer(app);

// אתחול Socket.IO
initSocket(server);

// נתיב בריאות
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is alive" });
});

// רישום הנתיבים
app.use("/auth", authRoutes);
app.use("/incidents", incidentRoutes);

// טיפול בשגיאות
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});