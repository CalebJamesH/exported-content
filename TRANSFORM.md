# Transform

## Overview

The content we're migrating from Customer Portal doesn't all go to the same place. Some articles are documentation, some are knowledge base entries, and some are onboarding courses. Each type needs to be handled differently and end up in a different system.

The export step (see EXPORT.md) pulls everything from Liferay and dumps it all into raw JSON files — one file per article per language, stored in a single directory. No routing, no conversion. Just the raw data.

Once the export is done, we use a mapping file called `content-types.json` to figure out what each article is. This file maps article titles (or friendly URL slugs) to their Content Type — things like "Knowledge Base", "Docs (Reference)", "Course (Onboarding)", or even compound types like "Knowledge Base; Course (Onboarding)".

From there, each article gets routed to a different transformation pipeline depending on its type. The rest of this document breaks down what happens for each one.

---

## Knowledge Base → JSON Object

KB articles get transformed from the raw Liferay API response into a new JSON format that matches the Liferay Object Entry schema. The table below maps the source fields to their target fields.

### Field Mapping

| Source (Liferay API) | Target (Object Entry) | Notes |
|---|---|---|
| `title` | `title`, `name` | title_i18n uses `en_US` format (not `en-US`) |
| `friendlyUrlPath` | `friendlyUrlPath` | |
| `contentFields[].contentFieldValue.data` where `fieldReference == "content"` | `content`, `content_i18n.{locale}` | Raw HTML body, unchanged |
| Same as above, stripped of HTML tags | `contentRawText` | Plain text version of the body |
| `keywords` | `keywords` | Direct copy |
| `creator.emailAddress` | `authorEmailAddress`, `authorEmailAddress_i18n.{locale}` | |
| — | `sourceTeam` | Needs to be determined (from folder context or mapping) |
| — | `defaultLanguageId` | Hardcode to `"en_US"` |
| — | `legacy` | `false` |
| — | `showDisclaimerMessage` | `false` |
| — | `ticketNumber` | Leave empty |
| — | `objectEntryFolderExternalReferenceCode` | Leave empty |

### Locale Note

The Object Entry format uses underscores: `en_US`, `es_ES`, `ja_JP`, `pt_BR`. The Liferay API uses hyphens: `en-US`. Convert when building `*_i18n` fields.

### Example

Source → Target mapping for a single-language article:

```
source.title           → target.title, target.name, target.title_i18n.en_US
source.friendlyUrlPath → target.friendlyUrlPath, target.friendlyUrlPath_i18n.en_US
source.description     → target.description_i18n.en_US
contentField.data      → target.content, target.content_i18n.en_US, target.contentRawText
source.keywords        → target.keywords
source.creator.name    → target.authorName, target.authorName_i18n.en_US
source.creator.email   → target.authorEmailAddress, target.authorEmailAddress_i18n.en_US
category field data    → target.knowledgeArticleType
                       → target.defaultLanguageId: "en_US"
                       → target.legacy: false
                       → target.showDisclaimerMessage: false
```

---

## Docs → Markdown (liferay-learn)

Docs get converted from HTML to Markdown and placed into the `liferay-learn/docs` repo. The exact path inside the repo where each article lands is shown below:

![Learn repo path structure](assets/learn-path.png)

### HTML → Markdown

Not exactly sure of the "how" and structure for the MD.


---

## Course → Confluence

As per James Garcia, courses need to be added as a page placed in a [confluence page](https://liferay.atlassian.net/wiki/spaces/LRSE/folder/5081628709/Customer+Portal+Resources) becuase that's the current workflow for courses.

How exactly, not sure. TBD.
