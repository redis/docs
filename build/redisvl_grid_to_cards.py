#!/usr/bin/env python3
"""Convert MyST grid-card directives in upstream redisvl markdown to Hugo-friendly HTML cards.

Reads a source markdown file, strips upstream YAML frontmatter and `{toctree}` blocks,
replaces `::::{grid} N` ... `::::` blocks with HTML grids, and rewrites markdown link
targets to match the Hugo destination paths produced by redisvlscript.sh.
"""
import argparse
import re
from pathlib import Path

GRID_CLASSES = "grid grid-cols-1 md:grid-cols-2 gap-4 my-6"
CARD_CLASSES = (
    "block p-5 border border-redis-pen-300 rounded-lg "
    "hover:border-redis-red-500 hover:shadow-md transition-all duration-200 "
    "no-underline hover:no-underline"
)
STATIC_CARD_CLASSES = "p-5 border border-redis-pen-300 rounded-lg"


def convert_link(link, context):
    """Map an upstream link target to a Hugo-relative URL."""
    if link.startswith(("http://", "https://", "#", "/")):
        return link
    link = re.sub(r"\.(md|ipynb)$", "", link)
    link = re.sub(r"/index$", "", link)
    parts = ["" if p == "" else re.sub(r"^[0-9]+_", "", p) for p in link.split("/")]
    link = "/".join(parts)
    if context == "how_to_guides" and link.startswith("../"):
        rest = link[3:]
        if rest and not rest.startswith("cli"):
            link = rest
    elif context == "use_cases" and link.startswith("../"):
        rest = link[3:]
        if rest and rest not in ("getting_started", "installation", "cli"):
            link = "../how_to_guides/" + rest
    if link and not link.endswith("/"):
        link = link + "/"
    return link


def render_inline(text, context):
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)

    def link_repl(m):
        return f'<a href="{convert_link(m.group(2), context)}">{m.group(1)}</a>'

    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", link_repl, text)
    text = text.replace(" -- ", " — ")
    return text


def render_body(lines, context):
    out, paragraph, in_list = [], [], False

    def flush_paragraph():
        nonlocal paragraph
        if paragraph:
            out.append("<p>" + render_inline(" ".join(paragraph), context) + "</p>")
            paragraph = []

    for line in lines:
        line = line.rstrip()
        if line.startswith("- ") or line.startswith("* "):
            flush_paragraph()
            if not in_list:
                out.append("<ul>")
                in_list = True
            out.append("<li>" + render_inline(line[2:], context) + "</li>")
        elif not line.strip():
            flush_paragraph()
            if in_list:
                out.append("</ul>")
                in_list = False
        else:
            if in_list:
                out.append("</ul>")
                in_list = False
            paragraph.append(line)
    flush_paragraph()
    if in_list:
        out.append("</ul>")
    return "\n".join(out)


def parse_grid(lines, start_idx, context):
    cards = []
    i = start_idx + 1
    while i < len(lines) and lines[i].rstrip() != "::::":
        line = lines[i].rstrip()
        if line.startswith(":::{grid-item-card}"):
            title = line[len(":::{grid-item-card}"):].strip()
            link, body, footer, in_footer = None, [], [], False
            i += 1
            while i < len(lines) and lines[i].rstrip() != ":::":
                cline = lines[i].rstrip()
                if cline.startswith(":link:"):
                    link = cline[len(":link:"):].strip()
                elif cline.startswith(":link-type:") or cline.startswith(":gutter:"):
                    pass
                elif cline.strip() == "+++":
                    in_footer = True
                else:
                    (footer if in_footer else body).append(cline)
                i += 1
            while body and not body[0].strip():
                body.pop(0)
            while body and not body[-1].strip():
                body.pop()
            cards.append((title, link, body, footer))
        i += 1
    out = [f'<div class="{GRID_CLASSES}">']
    for title, link, body, footer in cards:
        body_html = render_body(body, context)
        footer_html = ""
        if footer:
            text = " ".join(l.strip() for l in footer if l.strip())
            if text:
                footer_html = f'<p class="text-sm opacity-75 mt-3">{render_inline(text, context)}</p>'
        title_html = render_inline(title, context)
        if link:
            href = convert_link(link, context)
            out.append(
                f'<a href="{href}" class="{CARD_CLASSES}">'
                f'<h3 class="mt-0 mb-2">{title_html}</h3>{body_html}{footer_html}</a>'
            )
        else:
            out.append(
                f'<div class="{STATIC_CARD_CLASSES}">'
                f'<h3 class="mt-0 mb-2">{title_html}</h3>{body_html}{footer_html}</div>'
            )
    out.append("</div>")
    return "\n".join(out), i



def strip_frontmatter(text):
    if text.startswith("---\n"):
        end = text.find("\n---\n", 4)
        if end != -1:
            return text[end + 5:]
    return text


def transform(text, context):
    text = strip_frontmatter(text)
    lines = text.splitlines()
    out, i = [], 0
    while i < len(lines):
        line = lines[i]
        stripped = line.rstrip()
        if stripped.startswith("::::{grid}"):
            html, end = parse_grid(lines, i, context)
            out.append(html)
            i = end + 1
            continue
        if stripped.startswith(":::{grid-item-card}") or stripped in (":::", "::::"):
            i += 1
            continue
        if stripped.startswith(":gutter:") or stripped.startswith(":link:") or stripped.startswith(":link-type:"):
            i += 1
            continue
        if stripped.startswith("```{toctree}"):
            i += 1
            while i < len(lines) and not lines[i].rstrip().startswith("```"):
                i += 1
            i += 1
            continue
        # Rewrite markdown links outside grid blocks too (tables, paragraphs).
        rewritten = re.sub(
            r"\[([^\]]+)\]\(([^)]+)\)",
            lambda m: f"[{m.group(1)}]({convert_link(m.group(2), context)})",
            line,
        )
        out.append(rewritten)
        i += 1
    return "\n".join(out).strip() + "\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", help="Path to upstream MyST markdown file")
    parser.add_argument("destination", help="Path to write the transformed Hugo markdown")
    parser.add_argument(
        "--context",
        choices=("concepts", "user_guide", "how_to_guides", "use_cases"),
        required=True,
        help="Page context controlling relative link rewriting",
    )
    args = parser.parse_args()
    text = Path(args.source).read_text(encoding="utf-8")
    Path(args.destination).write_text(transform(text, args.context), encoding="utf-8")


if __name__ == "__main__":
    main()
