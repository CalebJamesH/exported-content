# Image Migration Plan

## What's Done

All web content and images from `support.liferay.com` have been exported and organized locally under `output/`:

```
output/
├── course/
├── knowledge-base/
├── docs/
└── tbd/
```

## What's Left

Move the exported content and images to their correct destinations.

---

## TBD

### Content
We won't touch the TBD content for now — it includes web content (Platform changelog and Services changelog) that may go into the comparison tool.

### Images
TBD. Depends on where/what the content ends up being.

---

## Course

### Content
Course content goes into **Confluence**. Contact James Garcia for specifics on where exactly.

- Strip all HTML — extract raw text from content fields and add it to the Confluence page
- Structure is TBD (one page per JSON file? unclear — confirm with James Garcia)
- Styles don't matter — no need for proper headings, paragraphs, etc.
- All that matters is the raw data for Claude to generate courses from

### Images
Confirm with James Garcia whether we need to keep these.

---

## Knowledge Base

### Content
Knowledge base content will be stored in **Liferay Learn as an Object**. We'll need to map current web-content fields to the knowledge-article object, but most content should transfer cleanly from the content field.

### Images
1. POST images to **Docs & Media**
2. Retrieve the ID from the POST response
3. Update `<img src="/documents/...{id}">` tags with the new ID

---

## Docs

### Content
Docs go to the **liferay-learn** repo under a new `customer-portal` directory, converted to **Markdown**. Only rough structure is needed — the Enablement team will adjust formatting as needed.

### Images
Move images into the `liferay-learn` repo under `customer-portal/`. Check the existing structure for the correct path convention.

---

## Tickets

Maybe one ticket per content type? Each ticket would handle both images and content for that type.
