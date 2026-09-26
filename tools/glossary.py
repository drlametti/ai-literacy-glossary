#!/usr/bin/env python3
"""Convert the glossary between its Markdown source and data/glossary.json.

    python3 tools/glossary.py to-json      # glossary.md -> data/glossary.json
    python3 tools/glossary.py to-markdown  # data/glossary.json -> glossary.md
    python3 tools/glossary.py check        # report differences, write nothing

glossary.md is the file to edit by hand. data/glossary.json is what the site
loads; it is generated, so edits made there directly will be overwritten the
next time the Markdown is converted.
"""

import collections
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
MD_PATH = ROOT / "glossary.md"
JSON_PATH = ROOT / "data" / "glossary.json"

PREAMBLE = """# Critical AI Literacy — Glossary source

Edit this file, then ask Claude to push it. Everything the terminology map
shows comes from here.

**Adding a term:** copy an existing block and change the parts you need.

- `id` is the permanent address of the term. It appears in deep links such as
  `...ai-literacy-glossary/#hallucination`, so once a term is published, do not
  change its id — any links you gave students would break. Renaming the term's
  heading is fine; the id can stay as it is.
- `group` must be one of the keys in the Groups table below.
- `connects` lists the other terms it links to, by id, separated by commas.
  Listing a connection on either term is enough — the two directions are the
  same line on the map.
- The definition is everything after the bulleted fields, and is used exactly
  as written. You can wrap it over several lines; they are joined back into one
  paragraph.

Mentions of other glossary terms inside a definition become clickable
automatically, so there is no need to mark them up. "AI" on its own is
deliberately never linked.
"""


def clean(value):
    """Strip whitespace and any surrounding backticks from a field value."""
    return value.strip().strip("`").strip()


def slug_ok(value):
    return bool(re.fullmatch(r"[a-z0-9][a-z0-9-]*", value))


# --------------------------------------------------------------------------
# Markdown -> data
# --------------------------------------------------------------------------

def parse_markdown(text):
    groups = collections.OrderedDict()
    terms = []
    pairs = set()

    # Groups table: | key | label | colour |
    in_groups = False
    for line in text.splitlines():
        if re.match(r"^##\s+Groups\s*$", line):
            in_groups = True
            continue
        if in_groups:
            if line.startswith("##"):
                break
            if not line.strip().startswith("|"):
                continue
            cells = [clean(c) for c in line.strip().strip("|").split("|")]
            if len(cells) < 3:
                continue
            if cells[0].lower() in ("key", "") or set(cells[0]) <= {"-", ":"}:
                continue
            groups[cells[0]] = {"label": cells[1], "color": cells[2]}

    # Term blocks: "### Name" followed by bulleted fields then the definition.
    blocks = re.split(r"^###\s+", text, flags=re.M)[1:]
    for block in blocks:
        lines = block.splitlines()
        name = lines[0].strip()
        fields = {}
        body = []
        reading_fields = True
        for line in lines[1:]:
            match = re.match(r"^\s*[-*]\s*(id|group|connects)\s*:(.*)$", line, re.I)
            if reading_fields and match:
                fields[match.group(1).lower()] = match.group(2)
                continue
            if reading_fields and not line.strip():
                continue
            reading_fields = False
            body.append(line)

        # Join wrapped lines back into a single paragraph.
        definition = " ".join(l.strip() for l in body if l.strip())
        definition = re.sub(r"\s{2,}", " ", definition).strip()

        term_id = clean(fields.get("id", ""))
        terms.append({
            "id": term_id,
            "name": name,
            "group": clean(fields.get("group", "")),
            "definition": definition,
        })

        for other in fields.get("connects", "").split(","):
            other = clean(other)
            if other:
                pairs.add(tuple(sorted((term_id, other))))

    links = [list(p) for p in sorted(pairs)]
    terms.sort(key=lambda t: t["id"])
    return collections.OrderedDict(
        [("groups", groups), ("terms", terms), ("links", links)]
    )


def validate(data):
    errors, warnings = [], []
    seen = set()
    for term in data["terms"]:
        where = term["id"] or term["name"]
        if not term["id"]:
            errors.append('Term "%s" has no id.' % term["name"])
        elif not slug_ok(term["id"]):
            errors.append('Term "%s": id must be lowercase letters, numbers and '
                          "hyphens." % where)
        elif term["id"] in seen:
            errors.append('Duplicate id "%s".' % term["id"])
        seen.add(term["id"])

        if not term["name"]:
            errors.append('Term "%s" has no name.' % where)
        if not term["definition"]:
            errors.append('Term "%s" has no definition.' % where)
        if term["group"] not in data["groups"]:
            errors.append('Term "%s" has group "%s", which is not in the Groups '
                          "table." % (where, term["group"]))

    degree = {t["id"]: 0 for t in data["terms"]}
    for a, b in data["links"]:
        for end in (a, b):
            if end not in seen:
                errors.append('Connection ["%s", "%s"] refers to unknown id "%s".'
                              % (a, b, end))
        if a == b:
            errors.append('Term "%s" is connected to itself.' % a)
        if a in degree:
            degree[a] += 1
        if b in degree:
            degree[b] += 1

    for term_id, count in degree.items():
        if count == 0:
            warnings.append('Term "%s" has no connections, so it will float '
                            "alone on the map." % term_id)
    return errors, warnings


# --------------------------------------------------------------------------
# data -> files
# --------------------------------------------------------------------------

def dump_json(data):
    out = json.dumps(data, indent=2, ensure_ascii=False)
    # Keep the hand-written formatting: one line per link pair and per group.
    out = re.sub(r'\[\s+"([a-z0-9-]+)",\s+"([a-z0-9-]+)"\s+\]', r'["\1", "\2"]', out)
    out = re.sub(r'\{\s+"label": ("(?:[^"\\]|\\.)*"),\s+"color": ("(?:[^"\\]|\\.)*")\s+\}',
                 r'{ "label": \1, "color": \2 }', out)
    return out + "\n"


def dump_markdown(data):
    neighbours = collections.defaultdict(set)
    for a, b in data["links"]:
        neighbours[a].add(b)
        neighbours[b].add(a)

    parts = [PREAMBLE, "\n## Groups\n\n",
             "| Key | Label | Colour |\n| --- | --- | --- |\n"]
    for key, group in data["groups"].items():
        parts.append("| `%s` | %s | `%s` |\n" % (key, group["label"], group["color"]))

    parts.append("\n## Terms\n")
    for term in sorted(data["terms"], key=lambda t: t["id"]):
        connects = ", ".join("`%s`" % n for n in sorted(neighbours[term["id"]]))
        parts.append("\n### %s\n\n" % term["name"])
        parts.append("- id: `%s`\n" % term["id"])
        parts.append("- group: `%s`\n" % term["group"])
        parts.append("- connects: %s\n\n" % (connects or "_none_"))
        parts.append("%s\n" % term["definition"])
    return "".join(parts)


def load_json():
    return json.loads(JSON_PATH.read_text(), object_pairs_hook=collections.OrderedDict)


def report(errors, warnings):
    for w in warnings:
        print("  warning: %s" % w)
    for e in errors:
        print("  ERROR:   %s" % e)
    return not errors


def main():
    command = sys.argv[1] if len(sys.argv) > 1 else "to-json"

    if command == "to-markdown":
        MD_PATH.write_text(dump_markdown(load_json()))
        print("Wrote %s" % MD_PATH.name)
        return 0

    data = parse_markdown(MD_PATH.read_text())
    errors, warnings = validate(data)
    ok = report(errors, warnings)
    if not ok:
        print("\nNothing written. Fix the errors above and run again.")
        return 1

    new = dump_json(data)

    if command == "check":
        current = JSON_PATH.read_text()
        if new == current:
            print("glossary.md and data/glossary.json agree "
                  "(%d terms, %d connections)."
                  % (len(data["terms"]), len(data["links"])))
            return 0
        print("glossary.md would change data/glossary.json.")
        return 1

    JSON_PATH.write_text(new)
    print("Wrote %s — %d terms, %d connections."
          % (JSON_PATH.relative_to(ROOT), len(data["terms"]), len(data["links"])))
    return 0


if __name__ == "__main__":
    sys.exit(main())
