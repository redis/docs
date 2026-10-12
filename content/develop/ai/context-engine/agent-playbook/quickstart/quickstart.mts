// Generated from quickstart.md; edit the page, then run examples.py --refresh-downloads.
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

const faqContent = {
  intents: ["Check a refund", "Find an existing refund"],
  attributes: { locale: "en-US", topic: "refund" },
  payload: { faq: {
    question: "How do I check the status of a refund?",
    answer: "Open the order in your order history and select Refund status. If no refund is listed, contact support with your order number.",
  } },
};
const draft = await playbook.createFaq({ content: faqContent });
const faqId = draft.entry.entryId;
const version = draft.version.version;
console.log(faqId, version, draft.entry.publication);

const stored = await playbook.getFaqVersion(faqId, version);
console.log(stored.content);

await playbook.publishFaq(faqId, { version });

const results = await playbook.searchFaqs({
  query: "Where can I see how my refund is progressing?",
  filter: { eq: { name: "locale", value: "en-US" } },
  limit: 5,
});
for (const match of results.matches) {
  if (match.faq) {
    console.log(match.entryId, match.version, match.score, match.faq.answer);
  }
}

const discovery = await playbook.discoverEntries({
  query: "Help a customer find their refund status",
  filter: { eq: { name: "topic", value: "refund" } },
});
console.log(JSON.stringify(discovery, null, 2));

const updatedContent = structuredClone(faqContent);
updatedContent.payload.faq.answer += " Support can check the current stage but cannot guarantee a bank posting date.";
const updated = await playbook.appendFaqVersion(faqId, { content: updatedContent });
console.log("Review this version:", updated.version.version, updated.version.content);

await playbook.publishFaq(faqId, { version: updated.version.version });
const updatedResults = await playbook.searchFaqs({
  query: "Where can I see how my refund is progressing?",
  filter: { eq: { name: "locale", value: "en-US" } },
  limit: 5,
});
for (const match of updatedResults.matches) {
  if (match.entryId === faqId && match.faq) {
    console.log("Published answer:", match.version, match.faq.answer);
  }
}
