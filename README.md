# Migration Spike: Liferay Web Content → GitHub Markdown

## Goal

Write a script that migrates web content articles from a Liferay instance (Customer Portal) to their correct destinations. Articles are split into three tracks based on their **Content Type** (defined in the migration spreadsheet):

| Content Type | Destination | Export Format |
|---|---|---|
| Knowledge Base (KB) | Liferay Object Entries (via headless API) | JSON |
| Docs (anything starting with "Docs...") | `liferay-learn/docs` GitHub repo | Markdown |
| Course (Onboarding) | Confluence space | n/a (manual / Confluence workflow) |

---

## What We're Migrating

- Structured Content (Web Content) stored in Liferay's Web Content system
- Content is spread across **multiple folders** (folder IDs enumerated below)
- Articles may have **multiple language variants** (`en-US`, `es-ES`, `ja-JP`, `pt-BR`)

### Two Migration Tracks

**Full Migration** — export ALL articles in these folders (listed with their CP folder IDs):

| Section | Folders | Folder ID(s) | Flatten |
|---|---|---|---|
| Announcements | Product Releases, Customer Portal Upgrades | `26095490` | true |
| Getting Started | 3 subfolders under Customer Portal Help > Getting Started | `27408738` | true |
| Compatibility Matrix | 4 subfolders | `27461466` | true |
| Before Opening | All articles | `27494992` | false |
| LES | All LES documents | `27495252` | false |
| Security Alerts | All articles | `27461452` | false |
| Release Notes | 4 subfolders | `27495011`, `27495008`, `26936458` | false |

**Partial Migration** — export only selected articles from these folders (matched by URL list):

| Section | Folder ID(s) | Count | Flatten |
|---|---|---|---|
| DXP Activation | `27408742` | 7 of 16 | false |
| Administration | `27408740` | 1 of 2 | false |
| Overview | `27408744` | 1 of 5 | false |
| Team Members | `27408946` | 1 of 9 | false |
| Patching and Release | `27494982` | 6 of 9 | false | 
| Support FAQ | `27494989` | 2 of 11 | false |
| Security | `27111977` | 1 of 2 | false |

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
- `flatten=true` is required for some, not all. Consult the table. Without it responses come back empty
- Pagination: check `totalCount` in the response and loop pages as needed

**To list all top-level folders in a site:**
```
GET /o/headless-delivery/v1.0/sites/{siteId}/structured-content-folders?flatten=true&pageSize=-1
```
- `pageSize=-1` fetches all folders in one page (no pagination needed for folders)

**Known site IDs:**
- `siteId / groupId` for admin UI references: `2013383`

**To get a single article by its REST id:**
```
GET /o/headless-delivery/v1.0/structured-contents/{id}
```
Note: the REST `id` is NOT the classic `articleId` shown in Liferay's admin UI URLs — these can differ.

**To get a specific language variant**, pass the `Accept-Language` header:
```
GET /o/headless-delivery/v1.0/structured-content-folders/{folderId}/structured-contents?flatten=true
Accept-Language: es-ES
```
- `data` always returns a single string (the active language) — there is no single-call way to get all languages at once
- **Must make one full folder listing request per language** — fetch the entire folder's articles with `Accept-Language: es-ES` etc., then match articles across languages by `id`/`friendlyUrlPath`
- Use each article's `availableLanguages` array to know which language variants exist
- **Workflow:**
  1. Fetch folder with default `Accept-Language` (e.g. `en-US`) to get the baseline article list with `availableLanguages`
  2. For each other language in scope, re-fetch the **entire folder** with the language's `Accept-Language` header
  3. Only articles whose `availableLanguages` includes that language will contain translated content in that response

---

## Response Shape

### List endpoint (`items[]`)

Each item in the folder listing response (`items[]`) is a summary — see the **single article** shape below for the full picture.

### Single article endpoint

`GET /o/headless-delivery/v1.0/structured-contents/{id}` returns:

```json
{
  "id": 26096427,
  "key": "26096425",
  "title": "How to Change your Liferay Account Contact Information and Password",
  "friendlyUrlPath": "how-to-change-your-liferay-account-contact-information-and-password",
  "availableLanguages": ["en-US"],
  "dateCreated": "2025-09-16T22:57:47Z",
  "dateModified": "2026-03-20T22:27:31Z",
  "datePublished": "2021-01-09T00:09:00Z",
  "description": "",
  "externalReferenceCode": "360054766052",
  "siteId": 2013383,
  "structuredContentFolderId": 27408740,
  "contentStructureId": 25987956,
  "uuid": "d9a2ede4-7e37-aaae-6b51-9f0cb0c36050",
  "neverExpire": true,
  "numberOfComments": 0,
  "priority": 0,
  "subscribed": false,
  "creator": { "id": 2013333, "name": "Amos Fong", ... },
  "keywords": ["ja", "mt", "supportability", "change-password", "contact-information", "account-info"],
  "taxonomyCategoryBriefs": [
    {
      "taxonomyCategoryId": 25988264,
      "taxonomyCategoryName": "Customer Portal Help",
      "taxonomyCategoryReference": {
        "externalReferenceCode": "e591685b-2a50-23ad-38f1-07508043c8c6",
        "siteKey": "Customer Portal"
      }
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
      },
      "nestedContentFields": [],
      "repeatable": false
    },
    {
      "name": "Text72945361",
      "fieldReference": "category",
      "label": "Category",
      "dataType": "string",
      "inputControl": "text",
      "contentFieldValue": {
        "data": "25988291"
      }
    }
  ],
  "renderedContents": [
    {
      "contentTemplateId": "article",
      "contentTemplateName": "Article",
      "markedAsDefault": true,
      "renderedContentURL": "https://support.liferay.com/o/headless-delivery/v1.0/structured-contents/26096427/rendered-content-by-display-page/article"
    }
  ],
  "relatedContents": [],
  "customFields": [],
  "actions": {
    "get": { "method": "GET", "href": "https://support.liferay.com/o/headless-delivery/v1.0/structured-contents/26096427" },
    "get-rendered-content": { ... },
    "get-rendered-content-by-display-page": { ... }
  }
}
```

**The rich text / body content field:**
- `fieldReference: "content"` — this is the main article body
- Also match by `label` field starting with `"Content"` (e.g. `"label": "Content"`)
- `contentFieldValue.data` — an HTML string (CKEditor output)

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

The JSON file stores the full API response for that article (including raw HTML in the `contentFieldValue.data` field). This serves as the cache for the Extract stage.

---

## Filtering: URL List as Manifest

For **partial migration** folders, we are NOT exporting all articles — only those matching a known list of URLs. The URL list is the source of truth for what gets exported.

**Matching strategy:**
1. Pull all articles from each relevant folder (paginating as needed)
2. Match each article's `friendlyUrlPath` against the URL list (the last path segment of each URL)
3. Only export matched articles

Or we can just delete them manually. Here's the source of truth for articles to be exported: [docs](https://docs.google.com/spreadsheets/d/1iu9UYUeBUe7Ru6gvtZan8stwkeCARN0T_lYhNBukDv4/edit?pli=1&gid=0#gid=0)

---

## Content Type Routing

Each article in the migration spreadsheet has a **Content Type** column that determines where it ends up. This must be mapped from the article data — the Content Type isn't part of the Liferay API response, so we need a lookup table (e.g. a CSV/JSON mapping of `friendlyUrlPath` → `contentType`).

| Content Type | Route | Export Format | Action |
|---|---|---|---|
| `Knowledge Base` or `Knowledge Base; ...` | Liferay Object Entries | JSON | Export the article's HTML body and metadata as a JSON file. The JSON will later be mapped into the correct request body for the Object Entry headless API. |
| `Docs (TBD)`, `Docs (Reference)`, `Docs (Search)`, `Docs (NEW)`, `Docs (Patching Liferay)` | `liferay-learn/docs` | Markdown | Convert HTML → Markdown via Turndown and write `.md` files following the learn repo's directory structure. |
| `Course (Onboarding)` | Confluence | n/a | These are handled separately via the Confluence course workflow — not processed by this script. |
| `Knowledge Base; Course (Onboarding)` | Both | JSON + Confluence | Export JSON for Object Entry AND flag for Confluence course workflow. Two outputs needed. |

**Implementation notes:**
- The Content Type mapping file (e.g. `content-types.json`) is read by the script to route each article after extraction
- Compound values like `Knowledge Base; Course (Onboarding)` mean the article goes to **both** destinations
- KB articles are exported as **raw JSON** (no Markdown conversion) — the HTML body stays as-is for the Object Entry ingest
- Docs articles go through the full HTML → Markdown pipeline
- Pure Course articles are skipped by the export script; compound KB+Course articles get the JSON export and are flagged for Confluence

## Output

### Knowledge Base → JSON

KB articles are exported as JSON files — no Markdown conversion. The raw HTML body and metadata are preserved for Object Entry ingestion.

**File structure:**
```
/output
  /kb
    /en-US
      article-slug.json
    /es-ES
      article-slug.json
    /ja-JP
      article-slug.json
    /pt-BR
      article-slug.json
```

**JSON schema:**
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

This JSON maps into the headless API request body for Liferay Object Entries (exact mapping TBD).

### Docs → Markdown

Docs articles go through HTML → Markdown conversion (via Turndown) and are written as `.md` files with YAML frontmatter. These land in `liferay-learn/docs`.

**File structure:**
```
/output
  /docs
    /en-US
      article-slug.md
    /es-ES
      article-slug.md
    /ja-JP
      article-slug.md
    /pt-BR
      article-slug.md
```

**Frontmatter schema:**
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

### Course → Confluence

Course (Onboarding) articles are not processed by this script. They go into a Confluence space via the standard Confluence course workflow.

---

## Image Handling

TBD — need to determine:

- Whether images referenced in CKEditor HTML (`/documents/...`, `/o/...`) should be downloaded or left as-is
- If downloaded: what path convention to use relative to the output files
- Videos appear to be iframes pointing to YouTube — these should work as-is

---

## Script Architecture

The script follows a four-stage pipeline that routes articles by Content Type:

1. **Extract** — fetch from Liferay API, filter by URL list, collect raw HTML per language
2. **Route** — look up each article's Content Type from the mapping file; split into KB / Docs / Course / Both buckets
3. **Transform** — Docs: convert HTML → Markdown via Turndown, build frontmatter. KB: skip conversion, structure JSON output
4. **Write** — Docs: write `.md` files to `/output/docs/{lang}/`. KB: write `.json` files to `/output/kb/{lang}/`. KB+Course: write JSON AND flag for Confluence. Pure Course: skip

This separation means the extract step can be cached/re-run independently from transform/write without hitting the API again.

**Required input files:**
- `urls.json` — list of `friendlyUrlPath` values for partial migration
- `content-types.json` — mapping of `friendlyUrlPath` → Content Type (KB / Docs / Course)

## Open Questions (not yet confirmed)

- James Garcia's conversion script: what input format does it expect?
- KB JSON → Object Entry mapping: what's the exact headless API endpoint and request body shape for the target Object?
- Do Course articles need to be extracted from Liferay at all before going to Confluence, or is that handled entirely out of band?
- Images: download or leave hosted? If local, what path convention?