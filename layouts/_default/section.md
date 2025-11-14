# {{ .Title }}

```json metadata
{
  "title": "{{ .Title }}",
  "description": "{{ .Description }}",
  "categories": {{ .Params.categories | jsonify }}
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