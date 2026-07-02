# Transform

## Overview

The content we're migrating from Customer Portal doesn't all go to the same place. Some articles are documentation, some are knowledge base entries, and some are onboarding courses. Each type needs to be handled differently and end up in a different system.

The export step (see EXPORT.md) pulls everything from Customer Portal and dumps it all into raw JSON files — one file per article per language, stored in a single directory. No routing, no conversion. Just the raw data.

Once the export is done, we use a mapping file called `content-types.json` as a lookup table to figure out what each article is. This file maps article titles (or friendly URL slugs) to their Content Type — things like "Knowledge Base", "Docs (Reference)", "Course (Onboarding)", or even compound types like "Knowledge Base; Course (Onboarding)".

NOTE: The `content-types.json` only contains the content for the "Partial export" files, not the "Full export" files.

From there, each article gets routed to a different transformation pipeline depending on its type. The rest of this document breaks down what happens for each one.

---

## Knowledge Base → JSON Object

TBD.

---

## Docs → Markdown (liferay-learn)

TBD.

---

## Course → Confluence

TBD.
