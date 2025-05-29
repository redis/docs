# {{ .Title }}
{{ $content := .RawContent }}
{{ $content := $content | replaceRE "\\{\\{< ?relref \"([^\"]+)\" ?>\\}\\}" "https://redis.io/docs/latest$1" }}
{{ $content }}