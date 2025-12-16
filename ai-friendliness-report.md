# AI-Friendliness Report: Redis Documentation

## Executive Summary

Redis has made excellent progress in supporting AI agents through the `llms.txt` index and Markdown documentation format. However, these resources are not easily discoverable by AI agents without explicit guidance. This report outlines why discovery is difficult and provides concrete recommendations to improve AI-friendliness across the Redis documentation ecosystem.

---

## The Discovery Problem

### What Happened

During implementation of a cache-aside tutorial, I (an AI agent) needed to validate documentation recommendations against official Redis sources. I used standard web-fetching approaches to access redis.io and redis-py documentation, but I did not discover:

1. **llms.txt** - A curated index of all documentation in Markdown format
2. **Markdown URL pattern** - All pages available via `.html.md` URLs (e.g., `https://redis.io/docs/latest/develop/data-types/json/index.html.md`)

These resources had to be pointed out explicitly by a human user.

### Root Cause Analysis

**Why I didn't find these resources:**

1. **No standard convention** - There's no industry-wide standard for how AI agents should discover AI-friendly documentation
2. **Default behavior** - I defaulted to fetching standard documentation URLs without looking for AI-specific alternatives
3. **No discoverable metadata** - The resources exist but aren't linked from:
   - robots.txt
   - HTML meta tags
   - HTTP headers
   - Well-known locations (like `.well-known/`)
   - Main documentation homepage
4. **Implicit knowledge** - The resources are documented somewhere, but not in a way that's obvious to an AI agent encountering the site for the first time

### The Broader Context

This is not a Redis-specific problem. The AI/LLM community hasn't yet established standard conventions for:
- How to advertise AI-friendly documentation formats
- Where to place resource indexes
- What metadata to include
- How to make discovery automatic vs. manual

---

## What Redis Is Doing Right

### Existing AI-Friendly Infrastructure

1. **llms.txt Index** (https://redis.io/llms.txt)
   - Comprehensive, curated list of all documentation pages
   - Organized by category (Core Docs, Commands, Development, Integrations, Operations)
   - Includes descriptions of each page
   - Specifically designed for LLMs and AI assistants

2. **Markdown Documentation Format**
   - All pages available as `.html.md` URLs
   - Much more suitable for AI agents than HTML
   - Consistent URL pattern makes it predictable

3. **Multi-language Examples**
   - JSON documentation includes Python, Node.js, Java, Go, C#, PHP examples
   - Helps AI agents understand implementation across languages

4. **Structured Organization**
   - Clear hierarchy (Develop → Data Types → JSON)
   - Consistent naming conventions
   - Logical grouping of related content

---

## Recommendations for Improved AI-Friendliness

### Priority 1: Quick Wins (Low Effort, High Impact)

#### 1.1 Add Comment to llms.txt

**Current state:** llms.txt exists but has no explanation

**Recommendation:** Add a header comment explaining its purpose:

```
# Redis Documentation for AI Agents and LLMs
# 
# This file provides a curated index of Redis documentation in Markdown format.
# 
# Usage:
# - Start with this file to discover available documentation
# - All pages are available in Markdown format via .html.md URLs
# - Example: https://redis.io/docs/latest/develop/data-types/json/index.html.md
#
# For more information, see: https://redis.io/docs/latest/develop/
```

**Why:** When an AI agent fetches llms.txt, it immediately understands the purpose and how to use it.

**Effort:** Minimal (add 10 lines of comments)

---

#### 1.2 Create .well-known/ai-documentation.json

**Recommendation:** Add a standardized metadata file at `https://redis.io/.well-known/ai-documentation.json`:

```json
{
  "documentation": {
    "index": "https://redis.io/llms.txt",
    "format": "markdown",
    "markdown_url_pattern": "{base_url}.html.md",
    "description": "Curated Markdown documentation for AI agents and LLMs"
  },
  "api_references": {
    "redis_py": {
      "url": "https://redis.readthedocs.io/en/stable/commands.html",
      "format": "html",
      "language": "python"
    }
  },
  "version": "1.0"
}
```

**Why:** Follows the `.well-known` convention (like `.well-known/robots.txt`, `.well-known/security.txt`). AI agents can check this standardized location for metadata.

**Effort:** Low (create one JSON file)

---

#### 1.3 Update robots.txt

**Recommendation:** Add a comment to robots.txt:

```
# For AI agents and LLMs: see https://redis.io/llms.txt for curated Markdown documentation
```

**Why:** Many AI agents check robots.txt first. A comment there is discoverable.

**Effort:** Minimal (add 1 line)

---

### Priority 2: Medium Effort, High Impact

#### 2.1 Add Meta Tags to Main Docs Homepage

**Recommendation:** Add to `https://redis.io/docs/latest/`:

```html
<meta name="ai-documentation" content="https://redis.io/llms.txt">
<meta name="ai-formats" content="markdown, json">
<link rel="ai-documentation" href="https://redis.io/llms.txt" type="text/plain">
```

**Why:** AI agents that parse HTML headers might discover these. Similar to how search engines use meta tags.

**Effort:** Low (add 3 lines to HTML template)

---

#### 2.2 Add HTTP Link Header

**Recommendation:** Add to HTTP response headers from redis.io:

```
Link: <https://redis.io/llms.txt>; rel="ai-documentation"; type="text/plain"
```

**Why:** Some AI agents check HTTP headers for metadata. This is a standard HTTP convention.

**Effort:** Medium (requires web server configuration)

---

#### 2.3 Create "For AI Agents" Documentation Page

**Recommendation:** Create `https://redis.io/docs/latest/ai-agent-resources/` with:

- Explanation of llms.txt and how to use it
- How to access Markdown versions of docs
- Best practices for AI agents using Redis documentation
- Links to API references and examples
- Guidance on error handling and common patterns
- Links to redis-py API reference

**Why:** Makes AI-friendly resources a first-class feature, not hidden.

**Effort:** Medium (write one documentation page)

---

### Priority 3: Long-Term, Strategic

#### 3.1 Add "For AI Agents" Section to Main Docs Homepage

**Recommendation:** Add a prominent section to the main documentation homepage:

```markdown
## For AI Agents and LLMs

If you're an AI agent or LLM looking to access Redis documentation:

- **Markdown Index**: [llms.txt](https://redis.io/llms.txt) - Curated list of all docs in Markdown format
- **Markdown Format**: All pages available as `.html.md` URLs
  - Example: `https://redis.io/docs/latest/develop/data-types/json/index.html.md`
- **API Reference**: [redis-py commands](https://redis.readthedocs.io/en/stable/commands.html)
- **Learn More**: [AI Agent Resources](https://redis.io/docs/latest/ai-agent-resources/)
```

**Why:** Explicit, discoverable, and sets expectations for AI agents.

**Effort:** Low (add one section to homepage)

---

#### 3.2 Advocate for Industry Standards

**Recommendation:** Document and share Redis's approach:

- Write a blog post about why Redis chose llms.txt and Markdown
- Share this approach with other projects
- Contribute to discussions about AI documentation standards
- Consider proposing a standard (e.g., through a GitHub discussion or RFC)

**Why:** Helps establish conventions that benefit the entire AI/LLM community.

**Effort:** Medium (requires community engagement)

---

## Implementation Roadmap

### Phase 1 (Week 1): Quick Wins
- [ ] Add comment header to llms.txt
- [ ] Create .well-known/ai-documentation.json
- [ ] Update robots.txt with comment
- [ ] Add meta tags to main docs homepage

**Expected Impact:** AI agents that check these locations will discover llms.txt

### Phase 2 (Week 2-3): Medium Effort
- [ ] Add HTTP Link header to responses
- [ ] Create "For AI Agents" documentation page
- [ ] Add section to main docs homepage

**Expected Impact:** AI agents will have clear, discoverable guidance on accessing documentation

### Phase 3 (Ongoing): Strategic
- [ ] Document the approach publicly
- [ ] Share with other projects
- [ ] Contribute to industry standards discussions

**Expected Impact:** Establish Redis as a leader in AI-friendly documentation

---

## Metrics for Success

After implementing these recommendations, success can be measured by:

1. **Discoverability**: AI agents can find llms.txt without human guidance
2. **Usage**: Increased adoption of Markdown documentation by AI tools
3. **Feedback**: Positive feedback from AI/LLM community
4. **Industry Impact**: Other projects adopt similar approaches

---

## Important Discovery: Accessibility Varies Across AI Clients

### The Problem

While Redis provides llms.txt and Markdown documentation files at `.html.md` URLs, **not all AI clients can access them equally**:

- ✅ Some AI agents (like Augment Agent) can fetch these files successfully
- ❌ Other AI clients (like ChatGPT's client app) cannot access them, even when provided direct links

### Root Causes

This inconsistency likely stems from:
1. **Different HTTP client implementations** - Various AI platforms use different HTTP libraries with different default behaviors
2. **User-Agent filtering** - Some servers may block requests based on User-Agent headers
3. **Rate limiting** - Different clients may hit rate limits at different thresholds
4. **CORS and access restrictions** - Implicit restrictions on who can access these resources
5. **Client-specific limitations** - Some clients may have restricted network access or proxy requirements

### Why This Matters

Even though Redis has built excellent AI-friendly infrastructure (llms.txt, Markdown URLs), **the infrastructure alone is not sufficient** if not all AI clients can reliably access it.

### Recommendation: Use MCP as the Universal Access Layer

The Redis MCP Server solves this problem by providing a **guaranteed, standardized access method** that works across all MCP-compatible clients:

- ✅ Works with Claude Desktop, VS Code, Augment, OpenAI Agents, and any MCP client
- ✅ No HTTP client compatibility issues
- ✅ No User-Agent filtering problems
- ✅ No rate limiting concerns for individual clients
- ✅ Structured, predictable responses

This is why the MCP server enhancements proposed in the companion document are so important: they provide a reliable, universal way for AI agents to access Redis documentation and examples.

---

## Conclusion

Redis has already invested in AI-friendly documentation infrastructure. These recommendations focus on making that infrastructure more discoverable and establishing conventions that benefit the broader AI community.

The key insight is that **having AI-friendly resources is only half the battle**—making them discoverable is equally important. By implementing these recommendations, Redis can become a model for how projects should support AI agents and LLMs.

**Addendum**: While llms.txt and Markdown files are valuable, they're not universally accessible to all AI clients due to HTTP client compatibility issues. The MCP server approach provides a guaranteed, standardized access method that works across all platforms, making it the most reliable way to serve AI agents.


