import { Router } from "express";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const router = Router();

const TASKS_URL = "https://hayyah.me/api/v1/tasks";

async function curlGet(url: string, token: string): Promise<{ status: number; data: string }> {
  const { stdout } = await execFileAsync("curl", [
    "-s",
    "-o", "-",
    "-w", "\n__STATUS__%{http_code}",
    "-X", "GET",
    url,
    "-H", `Authorization: Bearer ${token}`,
    "-H", "Accept: application/json",
  ]);
  const splitIdx = stdout.lastIndexOf("\n__STATUS__");
  const data = stdout.slice(0, splitIdx);
  const status = parseInt(stdout.slice(splitIdx + "\n__STATUS__".length), 10) || 502;
  return { status, data };
}

router.get("/tasks", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized", error_description: "Missing bearer token." });
    return;
  }
  const token = auth.slice(7);

  try {
    const { status, data } = await curlGet(TASKS_URL, token);
    console.log(`[tasks] GET → ${status}`);

    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      parsed = { error: "parse_error", error_description: data };
    }

    res.status(status).json(parsed);
  } catch (err) {
    console.error("[tasks] error:", err);
    res.status(502).json({ error: "proxy_error", error_description: "Could not reach tasks API." });
  }
});

export default router;
