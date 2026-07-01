# Migration Spike: Liferay Web Content → GitHub Markdown

## Goal

Write a script that migrates web content articles from a Liferay instance (Customer Portal) to local `.json` files. These local files are the intermediate format — the final destination is the `liferay-learn` GitHub repo, but structure/naming conventions for that are TBD pending confirmation from the team.

---

## What We're Migrating

- Structured Content (Web Content) stored in Liferay's Web Content system
- Content is spread across **multiple folders** (folder IDs enumerated below)
- Articles may have **multiple language variants** (`en-US`, `es-ES`, `ja-JP`, `pt-BR`)

### Two Migration Tracks

**Full Migration** — export ALL articles in these folders (listed with their CP folder IDs):

| Section | Folders | Folder ID(s) |
|---|---|---|
| Announcements | Product Releases, Customer Portal Upgrades | `26095490` |
| Getting Started | 3 subfolders under Customer Portal Help > Getting Started | `27408738` |
| Compatibility Matrix | 4 subfolders | `27461466` |
| Before Opening | All articles | `27494992` |
| LES | All LES documents | `27495252` |
| Security Alerts | All articles | `27461452` |
| Release Notes | 4 subfolders | `26208992`, `26936456` |

**Partial Migration** — export only selected articles from these folders (matched by URL list):

| Section | Folder ID(s) | Count |
|---|---|---|
| DXP Activation | `27408742` | 7 of 16 |
| Administration | `27408740` | 1 of 2 |
| Overview | `27408744` | 1 of 5 |
| Team Members | `27408946` | 1 of 9 |
| Patching and Release | `27494982` | 6 of 9 |
| Support FAQ | *(missing — folder ID TBD)* | 2 of 11 |
| Security | `27111977` | 1 of 2 |

**Matching strategy for partial migration:**
1. Pull all articles from each relevant folder (paginating as needed)
2. Match each article's `friendlyUrlPath` against the URL list (the last path segment of each URL)
3. Only export matched articles

The URL list should be stored as a plain text or JSON file (e.g. `urls.txt` or `urls.json`) that the script reads at startup.

---

## Liferay API

**Base URL:** `https://support.liferay.com`

**Auth:** Token

**Working endpoint to list articles by folder:**
```
GET /o/headless-delivery/v1.0/structured-content-folders/{folderId}/structured-contents?flatten=true&page=1&pageSize=100
```
- `flatten=true` is required — without it responses come back empty/malformed
- Pagination: check `totalCount` in the response and loop pages as needed
- To enumerate child folders of a folder: `GET /o/headless-delivery/v1.0/structured-content-folders/{folderId}/structured-content-folders`

**To list all top-level folders in a site:**
```
GET /o/headless-delivery/v1.0/sites/{siteId}/structured-content-folders?flatten=true&pageSize=-1
```
- `pageSize=-1` fetches all folders in one page (no pagination needed for folders)

**Known site IDs:**
- `siteId` for folder/content API calls: `2013383` (used in `/o/headless-delivery/v1.0/sites/{siteId}/...`)
- `siteId / groupId` for admin UI references: `23484947`
- Sample `folderId`: `45382069`

**To get a single article by its REST id:**
```
GET /o/headless-delivery/v1.0/structured-contents/{id}?flatten=true
```
Note: the REST `id` maps to `resourcePrimKey`, NOT the classic `articleId` shown in Liferay's admin UI URLs — these can differ.

**To get a specific language variant**, pass the `Accept-Language` header:
```
GET /o/headless-delivery/v1.0/structured-content-folders/{folderId}/structured-contents?flatten=true
Accept-Language: es-ES
```
- `data` always returns a single string (the active language) — there is no single-call way to get all languages at once
- Must make one request per language per folder
- Use each article's `availableLanguages` array to know which locales to fetch

---

## Response Shape

Each item in `items[]` looks like this:

```json
{
  "id": 26096555,
  "key": "26096553",
  "title": "[LES] How to use a load balancer with Elasticsearch?",
  "friendlyUrlPath": "les-how-to-use-a-load-balancer-with-elasticsearch",
  "availableLanguages": ["en-US", "es-ES", "ja-JP", "pt-BR"],
  "dateCreated": "2025-09-16T22:57:54Z",
  "dateModified": "2026-03-10T22:31:11Z",
  "datePublished": "2019-10-03T11:55:00Z",
  "externalReferenceCode": "360034748091",
  "siteId": 2013383,
  "structuredContentFolderId": 27495252,
  "keywords": ["elasticsearch", "search", "dxp-7-2"],
  "taxonomyCategoryBriefs": [
    {
      "taxonomyCategoryId": 25988273,
      "taxonomyCategoryName": "Liferay Enterprise Search"
    }
  ],
  "contentFields": [
    {
      "name": "content27681514",
      "fieldReference": "content",
      "label": "Content",
      "dataType": "string",
      "contentFieldValue": {
        "data": "<h2>...</h2><p>...</p>"
      }
    },
    {
      "name": "Text72945361",
      "fieldReference": "category",
      "label": "Category",
      "dataType": "string",
      "inputControl": "text",
      "contentFieldValue": {
        "data": "25988273"
      }
    }
  ]
}
```

**The rich text / body content field:**
- `fieldReference: "content"` — this is the main article body
- Also match by `name` field starting with `"content"` (e.g. `"name": "content27681514"` — the suffix varies per article type)
- `contentFieldValue.data` — an HTML string (CKEditor output)
- Must be converted to Markdown (see below)

---

## HTML → Markdown Conversion

The content field stores **CKEditor HTML**, not Markdown. It must be converted using **Turndown** (npm: `turndown`) with the **GFM plugin** (`turndown-plugin-gfm`) for tables and strikethrough support.

```js
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
td.use(gfm);
const markdown = td.turndown(htmlString);
```

**Known CKEditor quirks to handle:**
- Inline `style="..."` attributes (color, font-family) — Turndown strips these, which is acceptable; we lose CSS styling but that's expected and accepted
- `data-aura-rendered-by` attributes — noise from Liferay's rendering layer, Turndown will ignore these as unknown attributes (fine)
- Internal image paths like `/documents/...` or `/o/...` — these won't resolve outside Liferay; flag them or log a warning per article but don't block export
- Inline `<span style="font-family: Courier New">` used for code — consider a Turndown rule to convert these to backtick code spans

---

## Filtering: URL List as Manifest

For **partial migration** folders, we are NOT exporting all articles — only those matching a known list of URLs. The URL list is the source of truth for what gets exported.

**Matching strategy:**
1. Pull all articles from each relevant folder (paginating as needed)
2. Match each article's `friendlyUrlPath` against the URL list (the last path segment of each URL)
3. Only export matched articles

The URL list should be stored as a plain text or JSON file (e.g. `urls.txt` or `urls.json`) that the script reads at startup.

---

## Intermediate JSON Export

Before converting to Markdown, export articles as JSON — one file per article per language. This is the raw extract that can be cached/reviewed independently.

**File structure:**
```
/output
  /{FolderName}
    /{ArticleName}
      /en-US
        ArticleName.json
      /es-ES
        ArticleName.json
      /ja-JP
        ArticleName.json
      /pt-BR
        ArticleName.json
```

The JSON file stores the full API response for that article (including raw HTML in the `contentFieldValue.data` field). This serves as the cache for the Extract stage, allowing Transform to be re-run without hitting the API.

---

## Output: Local MD Files

Each exported article becomes a `.md` file with **YAML frontmatter** carrying all metadata needed for the eventual GitHub/Liferay-Learn load step.

**Filename:** use `friendlyUrlPath` as the filename, e.g. `les-how-to-use-a-load-balancer-with-elasticsearch.md`

**File structure (TBD — pending team confirmation):**
```
/output
  /en-US
    article-slug.md
  /es-ES
    article-slug.md
  /ja-JP
    article-slug.md
```
One subfolder per language, one file per article per language.

**Frontmatter schema:**
```yaml
---
liferay_id: 26096555
liferay_key: "26096553"
external_reference_code: "360034748091"
title: "[LES] How to use a load balancer with Elasticsearch?"
friendly_url_path: "les-how-to-use-a-load-balancer-with-elasticsearch"
site_id: 2013383
folder_id: 27495252
language: "en-US"
available_languages: ["en-US", "es-ES", "ja-JP", "pt-BR"]
date_created: "2025-09-16T22:57:54Z"
date_modified: "2026-03-10T22:31:11Z"
date_published: "2019-10-03T11:55:00Z"
keywords: ["elasticsearch", "search", "dxp-7-2"]
taxonomy_category: "Liferay Enterprise Search"
taxonomy_category_id: 25988273
---

Article body in Markdown here...
```

---

## Image Handling

Internal image paths in CKEditor content look like `/documents/...` or `/o/...` — these won't resolve outside Liferay. For now:
- Log a warning per article containing external image references
- Do not block the export
- If images need to be downloaded, they should be fetched via the Liferay API and stored alongside the markdown (exact strategy TBD)

---

## James Garcia's Conversion Script

James Garcia is separately creating a script to convert CKEditor Rich Text (HTML) to Markdown. If his script accepts the intermediate JSON format described above, we can skip the Turndown step in this script and produce JSON instead of MD. Coordinate with him on the expected input format.

---

## Script Architecture

Keep the script as three clearly separated stages:

1. **Extract** — fetch from Liferay API, filter by URL list, collect raw HTML per language
2. **Transform** — convert HTML → Markdown via Turndown, build frontmatter
3. **Write** — write `.md` files to local output directory

This separation means the extract step can be cached/re-run independently from transform/write without hitting the API again.

**Environment variables** (use a `.env` file):
```
LIFERAY_BASE_URL=https://support.liferay.com
LIFERAY_EMAIL=you@example.com
LIFERAY_PASSWORD=yourpassword
SITE_ID=2013383
FOLDER_IDS=26095490,27408738,27461466,27494992,27495252,27461452,26208992,26936456,27408742,27408740,27408744,27408946,27494982,27111977   # comma-separated
URL_LIST_PATH=./urls.json
OUTPUT_DIR=./output
LANGUAGES=en-US,es-ES,ja-JP,pt-BR
```

---

## Open Questions (not yet confirmed)

- Exact file/folder structure expected by the `liferay-learn` repo (waiting on team)
- Whether all language variants are in scope or just `en-US`
- Whether the output MD goes back into Liferay Web Content on a different site, or directly into GitHub, or both — current assumption is GitHub/liferay-learn only

- Images: download and serve locally, or keep them hosted on Liferay? If local, what path convention?
- Support FAQ folder ID is missing — need to find it
- James Garcia's conversion script: what input format does it expect? If JSON, we can skip Turndown in this script
- SiteId discrepancy: folder/content API calls use `2013383`, but the admin UI references `23484947` — confirm this is correct