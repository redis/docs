# {{ .Title }}

```json metadata
{
  "title": {{ .Title | jsonify }},
  "description": {{ (.Params.description | default .Description) | plainify | replaceRE "\\s+" " " | strings.TrimSpace | jsonify }},
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
  "tableOfContents": {{ partial "toc-from-markdown.html" . }},
  "codeExamples": {{ partial "code-examples-json.html" . }}
}
```

{{- /* Process content with shared partial (shortcode expansion, HTML unescaping, etc.) */ -}}
{{- $content := partial "process-markdown-content.html" (dict "RawContent" .RawContent "Site" .Site "Page" .) -}}

{{- /* The leading newlines are emitted explicitly rather than left as literal blank
       lines in this template, because the trim markers above would swallow them: the
       content would then start on the same line as the metadata block's closing fence.
       A closing fence may be followed only by whitespace, so it would stop closing
       anything and the rest of the page would be read as part of the code block. */ -}}
{{ printf "\n\n%s" $content }}
