# {{ .Title }}

```json metadata
{
  "title": {{ .Title | jsonify }},
  "description": {{ (.Params.description | default .Description) | plainify | replaceRE "\\s+" " " | strings.TrimSpace | jsonify }},
  "categories": {{ .Params.categories | jsonify }},
  "tableOfContents": {{ partial "toc-from-markdown.html" . }},
  "codeExamples": {{ partial "code-examples-json.html" . }}
}
```

{{- /* Process content with shared partial (shortcode expansion, HTML unescaping, etc.) */ -}}
{{- $content := partial "process-markdown-content.html" (dict "RawContent" .RawContent "Site" .Site "Page" .) -}}

{{ $content }}
