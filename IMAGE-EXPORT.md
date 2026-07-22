# Image Migration Plan

## Image Map

`IMAGES.json` — array of `{url, path}` objects. Generated from all JSON files under `output/`.

- **65 internal `/documents/` URLs** — downloadable from support.liferay.com
- **37 `help.liferay.com` URLs** — inaccessible, strip `<img>` tags
- **3 other external URLs** (`issues.liferay.com`, `webfx.com`, `slack-edge.com`) — also inaccessible, strip

## Current State

14 files across the export contain `<img src="...">` tags:

| Content Type | Files w/ Images | Internal `/documents/` URLs | External `help.liferay.com` URLs |
|---|---|---|---|
| course | 4 | 5 | 3 |
| docs | 4 | 2 | 4 |
| tbd | 6 | 46 | 2 |
| knowledge-base | 0 | 0 | 0 |

- 93 unique non-empty `src` attributes total (across translations of the same article)
- 53 are internal Liferay document paths (`/documents/d/customer-portal/...`) — **these are the only ones to download**
- ~39 are external `help.liferay.com/hc/article_attachments/...` URLs — **inaccessible, discard the `<img>` tags**
- 1 empty `src=""` (broken/placeholder — strip it)

## Image Types

### 1. Internal Liferay Document URLs
Pattern: `/documents/d/customer-portal/{id-or-name}`
These are hosted on support.liferay.com's document library. They need to be downloaded from `https://support.liferay.com/documents/d/customer-portal/{path}`.

### 2. External Article Attachment URLs
Pattern: `https://help.liferay.com/hc/article_attachments/{id}`
**These are inaccessible and should be discarded.** Strip the `<img>` tags from the content. Keep the JSON file intact — only remove the image reference.

### 3. Other External URLs
Patterns: `issues.liferay.com`, `webfx.com`, `slack-edge.com`
**Also inaccessible.** Same treatment — strip the `<img>` tags.

## Plan

### Step 1: Extract and Inventory

Done — see `IMAGES.map`.

### Step 2: Strip Inaccessible Images

Remove all `<img>` tags where `src` points to `help.liferay.com`, `issues.liferay.com`, `webfx.com`, `slack-edge.com`, or is empty. Keep the JSON file — only strip the image element from the HTML content.

### Step 3: Download Remaining Images

Only internal Liferay document URLs need downloading. Create `output/images/raw/` as a temporary staging directory.

```bash
# Pseudocode
for each unique /documents/ URL in manifest:
    download to output/images/raw/{filename}
    record downloaded path in manifest
```

- Internal `/documents/` URLs: `curl -L "https://support.liferay.com/documents/d/customer-portal/{path}" -o output/images/raw/{filename}`
- Deduplicate by URL — translations of the same article share the same image URLs, so we only download once.

### Step 4: Route Images by Destination

#### Course → Confluence
- **No export needed.** Course content is fed to Claude by the Enablement Team. The images can remain as external URLs in the HTML or be stripped. Confluence will handle embedding if URLs are kept as-is.
- Action: Strip `<img>` tags or leave as-is. No image file handling required.

#### Docs → liferay-learn repo (Markdown)
- Images should be stored in the liferay-learn repo alongside the MD files.
- Move downloaded images from `output/images/raw/` to `liferay-learn/customer-portal/images/`.
- Update the `src` attribute in the generated Markdown to use relative paths: `![alt](images/filename.ext)`.
- Naming convention: use the original filename or a hash to avoid collisions.

#### Knowledge Base → KB Object on Learn (D&M)
- Images must be uploaded to Liferay's Document and Media library.
- Upload each image from `output/images/raw/` via the D&M API or manually.
- Update the `content` field's HTML to point to the new D&M-hosted URL before posting the KB Object.
- Pattern: `<img src="/documents/{groupId}/{dmmEntryId}/...">` or the full D&M URL.

#### TBD → Likely Docs
- Same treatment as Docs: store in liferay-learn repo as relative image paths in MD.
- If any TBD content ends up as KB, follow the KB/D&M route instead.

### Step 5: Rewrite `src` Attributes

After images are hosted in their final location, update the source content:

| Original `src` | Destination | New `src` |
|---|---|---|
| `/documents/d/customer-portal/...` | Docs (MD) | `images/filename.ext` (relative) |
| `/documents/d/customer-portal/...` | KB (D&M) | D&M URL after upload |
| `https://help.liferay.com/hc/...` | Any | **Strip the `<img>` tag** |
| `issues.liferay.com` / `webfx.com` / `slack-edge.com` | Any | **Strip the `<img>` tag** |
| `src=""` | Any | **Strip the `<img>` tag** |
| Any | Course (Confluence) | No change needed (or strip) |

### Step 5: Cleanup

After all content is migrated and images are verified:
1. Delete `output/images/raw/` (temporary staging).
2. Keep `output/images/manifest.json` as a record of what was migrated.

## Open Questions

- Do the `/documents/d/customer-portal/...` paths require authentication to download? If so, we may need a session cookie or API token from support.liferay.com.
- For KB/D&M upload: what site/group ID should be used? The images need to live in the same site as the KB Objects.
- The Atlassian video URL in one file (`api.media.atlassian.com/...`) — is this a video embed, not an image? May need special handling.
