# Transform

Once articles are exported (see EXPORT.md), we need to decide what happens to each one based on its Content Type.

## Content Type Routing

The Content Type isn't in the API response — we need a mapping file (`content-types.json`) that matches each article's `friendlyUrlPath` to its Content Type.

| Content Type | Where it goes | Format | What to do |
|---|---|---|---|
| `Knowledge Base` | Liferay Object Entries | JSON | Keep the HTML body as-is. Export metadata + HTML as JSON. |
| `Knowledge Base; Course (Onboarding)` | Object Entries + Confluence | JSON | Same JSON export as KB, but also flag it for Confluence. |
| `Docs (TBD)`, `Docs (Reference)`, `Docs (Search)`, `Docs (NEW)`, `Docs (Patching Liferay)` | `liferay-learn/docs` | Markdown | Convert HTML to Markdown. Write `.md` files with frontmatter. |
| `Course (Onboarding)` | Confluence | — | Not handled here. Goes through the Confluence course workflow. |

## Knowledge Base → JSON

KB articles get exported as JSON. No Markdown conversion. The HTML body stays raw for the Object Entry API.

```
/output/kb/{lang}/article-slug.json
```

Schema:
```json
{
  "externalReferenceCode": "360054766052",
  "title": "Article Title",
  "friendlyUrlPath": "article-slug",
  "language": "en-US",
  "availableLanguages": ["en-US", "es-ES"],
  "htmlBody": "<h2>...</h2><p>...</p>",
  "category": "25988291",
  "folderId": 27408740,
  "keywords": ["tag1", "tag2"],
  "taxonomyCategoryBriefs": [ ... ],
  "dateCreated": "2025-09-16T22:57:47Z",
  "dateModified": "2026-03-20T22:27:31Z"
}
```

## Docs → Markdown

Docs articles get converted from HTML to Markdown using Turndown, then saved as `.md` files with YAML frontmatter.

```
/output/docs/{lang}/article-slug.md
```

Frontmatter:
```yaml
---
title: "Article Title"
friendly_url_path: "article-slug"
language: "en-US"
available_languages: ["en-US", "es-ES"]
site_id: 2013383
folder_id: 27408740
liferay_id: 26096427
external_reference_code: "360054766052"
keywords: ["tag1", "tag2"]
taxonomy_category: "Customer Portal Help"
taxonomy_category_id: 25988264
date_created: "2025-09-16T22:57:47Z"
date_modified: "2026-03-20T22:27:31Z"
date_published: "2021-01-09T00:09:00Z"
---

Article body in Markdown here...
```

## HTML → Markdown

Use Turndown with the GFM plugin:

```js
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
td.use(gfm);
const markdown = td.turndown(htmlString);
```

**Content field**: match by `fieldReference: "content"` or `label` starting with `"Content"`. The body is in `contentFieldValue.data`.

**CKEditor quirks:**
- Inline styles (color, font-family) — stripped by Turndown, that's fine
- `id` attributes on headings — strip or ignore
- `wysiwyg-color-*` classes — styling lost but content preserved
- `<span style="font-family: Courier New">` — consider converting to backtick code
- `<br>` inside list items — Turndown handles these
- Image paths like `/documents/...` or `/o/...` — won't work outside Liferay, log a warning
- `data-aura-rendered-by` — noise, ignored

## Image Handling

TBD. Videos (YouTube iframes) should work as-is. Internal Liferay image paths need a strategy — download them or leave them hosted.

## Open Questions

- James Garcia's conversion script: what format does it expect?
- KB JSON → Object Entry: what's the exact headless API endpoint and request body?
- Do Course articles get extracted at all before Confluence?
- Images: download or leave hosted?
