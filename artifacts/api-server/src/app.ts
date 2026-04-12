import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";

const app: Express = express();

/** Comma-separated origins; defaults include local CRM dev and hayyah.me. */
function corsAllowlist(): string[] {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (raw) {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "https://hayyah.me",
    "https://www.hayyah.me",
  ];
}

const allowlist = corsAllowlist();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowlist.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "Accept"],
    maxAge: 86_400,
    optionsSuccessStatus: 204,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
