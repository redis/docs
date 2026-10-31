// EXAMPLE: iris_playbook_limits
// HIDE_START
import { Playbook } from "@redis-iris/agent-playbook";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name}`);
  return value;
}

const playbook = new Playbook({
  serverURL: requiredEnv("PLAYBOOK_URL"),
  playbookId: requiredEnv("PLAYBOOK_ID"),
  apiKey: requiredEnv("PLAYBOOK_API_KEY"),
  retryConfig: { strategy: "none" },
});
console.log(await playbook.getPlaybookHealth());
// HIDE_END

// STEP_START playbook-error-type
const { PlaybookError } = await import("@redis-iris/agent-playbook/models/errors");
try {
  console.log(await playbook.getFaq(requiredEnv("PLAYBOOK_FAQ_ID")));
} catch (error) {
  if (error instanceof PlaybookError) {
    let problem: { type?: string } = {};
    try { problem = JSON.parse(error.body); } catch { /* The body may not be JSON. */ }
    console.error("Request failed:", error.statusCode, problem.type ?? "unknown");
  }
  throw error;
}
// STEP_END
