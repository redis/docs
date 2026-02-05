# {{ .Title }}

```json metadata
{
  "title": "{{ .Title }}",
  "description": "{{ .Description }}",
  "categories": {{ .Params.categories | jsonify }}{{ if .Params.arguments }},
  "arguments": {{ .Params.arguments | jsonify }}{{ end }}{{ if .Params.syntax_fmt }},
  "syntax_fmt": {{ .Params.syntax_fmt | jsonify }}{{ end }}{{ if .Params.complexity }},
  "complexity": {{ .Params.complexity | jsonify }}{{ end }}{{ if .Params.group }},
  "group": {{ .Params.group | jsonify }}{{ end }}{{ if .Params.command_flags }},
  "command_flags": {{ .Params.command_flags | jsonify }}{{ end }}{{ if .Params.acl_categories }},
  "acl_categories": {{ .Params.acl_categories | jsonify }}{{ end }}{{ if .Params.since }},
  "since": {{ .Params.since | jsonify }}{{ end }}{{ if .Params.arity }},
  "arity": {{ .Params.arity | jsonify }}{{ end }}{{ if .Params.key_specs }},
  "key_specs": {{ .Params.key_specs | jsonify }}{{ end }}{{ if .Params.topics }},
  "topics": {{ .Params.topics | jsonify }}{{ end }}{{ if .Params.relatedPages }},
  "relatedPages": {{ .Params.relatedPages | jsonify }}{{ end }}{{ if .Params.scope }},
  "scope": {{ .Params.scope | jsonify }}{{ end }},
  "tableOfContents": {{ partial "toc-json-regex.html" . }},
  "codeExamples": {{ partial "code-examples-json.html" . }}
}
```

{{ $content := .RawContent }}

{{/* Add legend for code examples at the beginning if content contains clients-example shortcodes */}}
{{ if findRE "clients-example" $content }}
{{ $legendAdded := false }}
{{ if not $legendAdded }}
{{ $content = printf "## Code Examples Legend\n\nThe code examples below show how to perform the same operations in different programming languages and client libraries:\n\n- **Redis CLI**: Command-line interface for Redis\n- **C# (Synchronous)**: StackExchange.Redis synchronous client\n- **C# (Asynchronous)**: StackExchange.Redis asynchronous client\n- **Go**: go-redis client\n- **Java (Synchronous - Jedis)**: Jedis synchronous client\n- **Java (Asynchronous - Lettuce)**: Lettuce asynchronous client\n- **Java (Reactive - Lettuce)**: Lettuce reactive/streaming client\n- **JavaScript (Node.js)**: node-redis client\n- **PHP**: Predis client\n- **Python**: redis-py client\n- **Rust (Synchronous)**: redis-rs synchronous client\n- **Rust (Asynchronous)**: redis-rs asynchronous client\n\nEach code example demonstrates the same basic operation across different languages. The specific syntax and patterns vary based on the language and client library, but the underlying Redis commands and behavior remain consistent.\n\n---\n\n%s" $content }}
{{ $legendAdded = true }}
{{ end }}
{{ end }}

{{/* Fix relrefs */}}
{{ $content := $content | replaceRE "\\{\\{< ?relref \"([^\"]+)\" ?>\\}\\}" "https://redis.io/docs/latest$1" }}

{{/* Fix images */}}
{{ $content := $content | replaceRE "\\{\\{< ?image filename=\"([^\"]+)\" ?>\\}\\}" "![$1](https://redis.io/docs/latest$1)" }}

{{/* Process clients-example shortcodes to include all languages */}}
{{ $content := partial "markdown-code-examples.html" (dict "RawContent" $content "Site" .Site) }}

{{/* Remove remaining shortcodes */}}
{{ $content := $content | replaceRE "\\{\\{< ?/?[^>]*>\\}\\}" "" }}
{{ $content := $content | replaceRE "\\{\\{% ?/?.*%\\}\\}" "" }}

{{/* Unescape HTML entities for plain text output */}}
{{ $content := $content | replaceRE "&#34;" "\"" }}
{{ $content := $content | replaceRE "&quot;" "\"" }}
{{ $content := $content | replaceRE "&lt;" "<" }}
{{ $content := $content | replaceRE "&gt;" ">" }}
{{ $content := $content | replaceRE "&amp;" "&" }}
{{ $content := $content | replaceRE "&#39;" "'" }}

{{ $content }}