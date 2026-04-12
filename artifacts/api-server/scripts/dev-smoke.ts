import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const TIMEOUT_MS = 30_000;

const child = spawn(
  "node",
  ["--env-file=.env", "--import", "tsx", "./src/index.ts"],
  {
    cwd: apiRoot,
    env: {
      ...process.env,
      NODE_ENV: "development",
      NODE_OPTIONS: [process.env.NODE_OPTIONS, "--insecure-http-parser"]
        .filter(Boolean)
        .join(" "),
    },
    stdio: ["inherit", "pipe", "pipe"],
  },
);

const timer = setTimeout(() => {
  console.error("dev:smoke: timed out waiting for server");
  child.kill("SIGTERM");
  process.exit(1);
}, TIMEOUT_MS);

let stopped = false;
const onChunk = (chunk: Buffer) => {
  const text = chunk.toString();
  process.stdout.write(text);
  if (!stopped && text.includes("Server listening")) {
    stopped = true;
    clearTimeout(timer);
    child.kill("SIGTERM");
  }
};

child.stdout?.on("data", onChunk);
child.stderr?.on("data", onChunk);

child.on("exit", (code, signal) => {
  clearTimeout(timer);
  if (stopped && signal === "SIGTERM") {
    process.exit(0);
  }
  process.exit(code ?? 1);
});
