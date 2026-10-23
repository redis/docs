// EXAMPLE: iris_playbook_faqs
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

// STEP_START playbook-faq-create
const faqContent = {
  intents: ["Check a refund", "Find an existing refund"],
  attributes: { locale: "en-US", topic: "refund" },
  payload: { faq: {
    question: "How do I check the status of a refund?",
    answer: "Open the order in your order history and select Refund status. If no refund is listed, contact support with your order number.",
  } },
};
const draft = await playbook.createFaq({ content: faqContent, entryKey: "refund-status" });
const faqId = draft.entry.entryId;
const version = draft.version.version;
console.log(faqId, version, draft.entry.publication);
// STEP_END

// STEP_START playbook-faq-publish
const stored = await playbook.getFaqVersion(faqId, version);
console.log(stored.content);
// STEP_END

// STEP_START playbook-faq-publication
await playbook.publishFaq(faqId, { version });
// STEP_END

// STEP_START playbook-faq-search
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
// STEP_END

// STEP_START playbook-faq-update
const updatedContent = structuredClone(faqContent);
updatedContent.payload.faq.answer += " Support can check the current stage but cannot guarantee a bank posting date.";
const updated = await playbook.appendFaqVersion(faqId, { content: updatedContent });
console.log("Review this version:", updated.version.version, updated.version.content);
// STEP_END

// STEP_START playbook-faq-republish
await playbook.publishFaq(faqId, { version: updated.version.version });
// STEP_END

// STEP_START playbook-faq-rollback
await playbook.publishFaq(faqId, { version });
// STEP_END

// STEP_START playbook-faq-list
let faqCursor: string | undefined;
while (true) {
  const page = await playbook.listFaqs(
    "updatedAt", "desc", undefined, undefined, undefined, 50, faqCursor,
  );
  if (faqCursor === undefined) console.log("Total FAQs:", page.total ?? "unknown");
  for (const entry of page.faqs) console.log(entry.entryId, entry.latestVersion, entry.publication);
  faqCursor = page.nextCursor;
  if (faqCursor === undefined) break;
}
// STEP_END

// STEP_START playbook-faq-history
let faqVersionCursor: string | undefined;
while (true) {
  const page = await playbook.listFaqVersions(faqId, undefined, undefined, 50, faqVersionCursor);
  for (const item of page.versions) console.log(item.version, item.contentDigest, item.content);
  faqVersionCursor = page.nextCursor;
  if (faqVersionCursor === undefined) break;
}
// STEP_END

// STEP_START playbook-faq-lookup
const lookup = await playbook.lookupEntries({
  references: [{ entryId: faqId }, { entryKey: "refund-status" }],
});
console.log("Version limit:", lookup.maxVersions);
for (const result of lookup.results) {
  if ("found" in result) {
    const state = result.found.entry;
    console.log(state.entryId, state.versionCount, state.latest, state.publication);
  } else {
    console.log("Missing:", result.missing.reference);
  }
}
// STEP_END
