// MCP tool-response helpers, factored out of index.ts so tests can import them
// without triggering index.ts's main() (which starts the stdio server).

/**
 * Serialise a tool result. If the tool returned an object carrying an `error`
 * field (e.g. get_page couldn't resolve the page, or an id/url was ambiguous),
 * mark the MCP response as an error so clients don't treat a failed lookup as
 * success.
 */
export function toolResult(data: unknown) {
  const isError = typeof data === "object" && data !== null && "error" in data;
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    ...(isError ? { isError: true } : {}),
  };
}

/** For protocol-level failures (unknown tool, input parse errors). */
export function fail(message: string) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }],
    isError: true,
  };
}
