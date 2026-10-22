// EXAMPLE: iris_playbook_quickstart_delete
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
const faqId = requiredEnv("PLAYBOOK_FAQ_ID");
// HIDE_END

// STEP_START playbook-quickstart-delete
await playbook.deleteFaq(faqId);
// STEP_END
