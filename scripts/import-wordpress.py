#!/usr/bin/env python3
"""Export public WXR catalog metadata without media, users, or raw HTML."""
import argparse
from collections import Counter
from html import unescape
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
from urllib.parse import unquote, urlsplit, urlunsplit

IMAGE = "/images/rabbi-nasan-maimon.jpg"
BLOCKED = {"script", "style", "audio", "video", "iframe", "object", "embed", "source"}
URL = re.compile(r"(?:https?://|//|www\.)[^\s<>]+|(?:/?(?:wp-content|media|uploads)/)[^\s<>]+|\b[^\s<>]+\.(?:mp3|mp4|m4a|wav|ogg|webm|m3u8)(?:\?[^\s<>]*)?", re.I)
MEDIA = re.compile(r"\.(?:mp3|mp4|m4a|wav|ogg|webm|m3u8|pdf|jpg|jpeg|png|gif|svg)(?:$|/)", re.I)

class TextOnly(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.depth = 0
        self.parts = []
    def handle_starttag(self, tag, attrs):
        if tag in BLOCKED:
            if tag not in {"embed", "source"}:
                self.depth += 1
        elif not self.depth:
            self.parts.append(" ")
    def handle_endtag(self, tag):
        if tag in BLOCKED and tag not in {"embed", "source"}:
            self.depth = max(0, self.depth - 1)
        elif not self.depth:
            self.parts.append(" ")
    def handle_data(self, data):
        if not self.depth:
            self.parts.append(data)

def clean(value, limit=None):
    # Unescape first so encoded tags/URLs receive the same treatment.
    value = unescape(value or "")
    value = re.sub(r"\[(audio|video|embed|powerpress)\b[^\]]*\].*?\[/\1\]", " ", value, flags=re.I | re.S)
    value = re.sub(r"\[[^\]]*\]", " ", value)
    parser = TextOnly()
    parser.feed(value)
    value = URL.sub(" ", " ".join(parser.parts))
    value = " ".join(value.split())
    return value[:limit] if limit else value

def field(node, local):
    for child in node:
        if child.tag.rsplit("}", 1)[-1] == local:
            return child.text or ""
    return ""

def safe_page_url(raw):
    try:
        parsed = urlsplit(raw.strip())
        if parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.username or parsed.password:
            return ""
        if parsed.query or parsed.fragment or MEDIA.search(parsed.path):
            return ""
        if any(ord(c) < 32 for c in raw):
            return ""
        return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, "", ""))
    except ValueError:
        return ""

def normalized_slug(raw):
    value = unquote(raw)
    if not re.fullmatch(r"[\w-]+", value, flags=re.UNICODE):
        raise ValueError("Invalid slug: expected Unicode letters/numbers, underscore or hyphen without path characters.")
    return value

def run(source, destination):
    if destination.exists():
        raise ValueError("Output directory already exists; choose a new directory.")
    raw = source.read_bytes()
    if b"<!DOCTYPE" in raw.upper() or b"<!ENTITY" in raw.upper():
        raise ValueError("DTD/entity declarations are not accepted.")
    tree = ET.fromstring(raw)
    channel = tree.find("channel")
    if channel is None:
        raise ValueError("Expected a WordPress WXR RSS channel.")
    lessons, pages, collections = [], [], {}
    counts = Counter()
    unresolved = {"teachers": [], "collections": [], "legacyUrls": []}
    taxonomy_records = []
    seen = set()
    lesson_slugs = set()
    collection_slugs = {}
    for item in channel.findall("item"):
        counts["itemsSeen"] += 1
        kind = field(item, "post_type")
        if kind not in {"shiurim", "videos", "page"}:
            counts["excludedUnsupportedType"] += 1
            continue
        if field(item, "status") != "publish" or field(item, "post_password"):
            counts["excludedNonPublic"] += 1
            continue
        slug = normalized_slug(field(item, "post_name"))
        source_id = field(item, "post_id")
        if not slug or (kind, slug) in seen:
            counts["excludedMissingOrDuplicateSlug"] += 1
            continue
        seen.add((kind, slug))
        legacy = safe_page_url(field(item, "link"))
        if not legacy:
            unresolved["legacyUrls"].append({"sourceId": source_id, "postType": kind})
            counts["excludedUnsafeLegacyUrl"] += 1
            continue
        terms = [{"taxonomy": clean(c.get("domain", "")),
                  "slug": normalized_slug(c.get("nicename", "")), "name": clean(c.text or "")}
                 for c in item.findall("category")]
        taxonomy_records.append({"sourceId": source_id, "postType": kind, "slug": slug, "terms": terms})
        description = clean(field(item, "encoded"), 320)
        title = clean(field(item, "title"))
        if kind == "page":
            pages.append({"slug": slug, "title": title, "description": description, "legacyUrl": legacy, "taxonomy": terms})
            counts["pagesImported"] += 1
            continue
        if slug in lesson_slugs:
            raise ValueError("Duplicate lesson slug across exported post types; resolve the collision before importing.")
        lesson_slugs.add(slug)
        groups = [t for t in terms if t["taxonomy"] in {"courses", "series", "types"}]
        group = groups[0] if groups else None
        speakers = [t["name"] for t in terms if t["taxonomy"] == "authors" and t["name"]]
        speaker = ", ".join(speakers) if speakers else "Speaker to be confirmed"
        if not speakers:
            unresolved["teachers"].append({"sourceId": source_id, "slug": slug})
        if not group:
            unresolved["collections"].append({"sourceId": source_id, "slug": slug})
        for term in groups:
            key = (term["taxonomy"], term["slug"])
            previous_taxonomy = collection_slugs.get(term["slug"])
            if previous_taxonomy and previous_taxonomy != term["taxonomy"]:
                raise ValueError("Duplicate collection slug across taxonomies; resolve the collision before importing.")
            collection_slugs[term["slug"]] = term["taxonomy"]
            parsed = urlsplit(legacy)
            # Slugs are decoded for Next.js route params; URL encoding belongs
            # to the consumer when building links.
            if re.fullmatch(r"[\w-]+", term["slug"]):
                url = f"{parsed.scheme}://{parsed.netloc}/{term['taxonomy']}/{term['slug']}/"
                collections[key] = {"slug": term["slug"], "title": term["name"], "description": "", "image": IMAGE, "legacyUrl": url}
        topics = [t["name"] for t in terms if t["taxonomy"] in {"parshios", "parshas", "post_tag"}]
        lessons.append({"slug": slug, "title": title, "speaker": speaker,
                        "collection": group["name"] if group else "Uncategorized",
                        "topic": topics[0] if topics else "Torah",
                        "format": "Video" if kind == "videos" else "Audio",
                        "description": description, "legacyUrl": legacy, "image": IMAGE})
        counts["lessonsImported"] += 1
    catalog = {"lessons": lessons, "collections": list(collections.values()), "teachers": []}
    report = {"counts": dict(counts), "unresolved": unresolved,
              "taxonomy": taxonomy_records,
              "limitations": ["Public metadata only; no media, identities, entitlements, raw HTML, or postmeta imported.",
                              "Collection destinations are generated from taxonomy/slugs and require verification.",
                              "Placeholder portraits require speaker-specific mapping; snippets require editorial review."]}
    destination.mkdir(parents=True, exist_ok=False)
    for name, value in [("public-catalog.json", catalog), ("public-pages.json", pages), ("migration-report.json", report)]:
        (destination / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"counts": dict(counts), "output": str(destination)}, ensure_ascii=False))

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("wxr", type=Path)
    parser.add_argument("--output", type=Path, required=True, help="New output directory (must not exist)")
    args = parser.parse_args()
    try:
        run(args.wxr, args.output)
    except (ValueError, OSError, ET.ParseError) as exc:
        print(f"Import failed: {exc}", file=sys.stderr)
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
