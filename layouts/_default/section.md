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
  "command_flags": {{ .Params.command_flags | jsonify }}{{ end }}
}
```

{{ $content := .RawContent }}

{{/* Fix relrefs */}}
{{ $content := $content | replaceRE "\\{\\{< ?relref \"([^\"]+)\" ?>\\}\\}" "https://redis.io/docs/latest$1" }}

{{/* Fix images */}}
{{ $content := $content | replaceRE "\\{\\{< ?image filename=\"([^\"]+)\" ?>\\}\\}" "![$1](https://redis.io/docs/latest$1)" }}

{{/* Remove all shortcodes */}}
{{ $content := $content | replaceRE "\\{\\{% ?/?.*%\\}\\}" "" }}
{{ $content := $content | replaceRE "\\{\\{< ?/?.*>\\}\\}" "" }}

{{ $content }}