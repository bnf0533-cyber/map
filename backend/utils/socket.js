import { Server } from "socket.io";

let io = null;

/**
 * אתחול שרת Socket.IO
 */
export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected via socket:", socket.id);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}

/**
 * קבלת מופע ה-io מכל מקום בשרת
 */
export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}

/**
 * פונקציות עזר לשידור אירועים לפי האפיון
 */
export function emitIncidentCreated(incident) {
  if (io) io.emit("incident:created", incident);
}

export function emitIncidentUpdated(incident) {
  if (io) io.emit("incident:updated", incident);
}

export function emitIncidentDeleted(id) {
  if (io) io.emit("incident:deleted", { id });
}
