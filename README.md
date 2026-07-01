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

| Section | Folders | Folder ID(s) | Flatten |
|---|---|---|---|
| Announcements | Product Releases, Customer Portal Upgrades | `26095490` | true |
| Getting Started | 3 subfolders under Customer Portal Help > Getting Started | `27408738` | true |
| Compatibility Matrix | 4 subfolders | `27461466` | true |
| Before Opening | All articles | `27494992` | doesn't matter |
| LES | All LES documents | `27495252` | doesn't matter |
| Security Alerts | All articles | `27461452` | doesn't matter |
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

## Output: Local MD Files

Still figuring out how we should do the conversion to MD. I was just going to have AI make a rought conversion and let the Solution Engineers do what they will with it, since most of these already need a restructuring

I was also told James Garcia is creating a script to convert CKEditor Rich Text (HTML) to Markdown. I still need to coordinate with him on the expected input format.

---

## Image Handling

TBD - I still need to look and see exactly what's the best way to migrate the images used. Videos should be fine, because from what I've seen so far it's just a iframe poiting to a youtube video.

---

## Script Architecture

Keep the script as three clearly separated stages:

1. **Extract** — fetch from Liferay API, filter by URL list, collect raw HTML per language
2. **Transform** — convert HTML → Markdown via Turndown, build frontmatter
3. **Write** — write `.md` files to local output directory. For now we'll create a new directory on the `liferay-learn` repo. Something like `liferay-learn/customer-portal-content` followed by the structre previously mentioned.

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

- James Garcia's conversion script: what input format does it expect?