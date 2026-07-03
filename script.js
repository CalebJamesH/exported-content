#!/usr/bin/env node
/**
 * Walks output/{content-type}/{folder-name}/en/*.json, and for every file whose
 * "availableLanguages" includes ACCEPT_LANGUAGE, fetches the localized version
 * via actions.get.href (with an Accept-Language header) and writes it to the
 * same path with the "en" folder swapped for LOCALE.
 *
 * Run once per language: edit LOCALE / ACCEPT_LANGUAGE below and re-run.
 *
 * Requires Node 18+ (for global fetch). Run with: node fetch-locale.js
 */

import fs from "fs";
import path from "path";

// ---- CONFIG: change these two per run --------------------------------------
const LOCALE = "es";              // destination folder name
const ACCEPT_LANGUAGE = "es-ES";  // value to check in availableLanguages + send as header
// -----------------------------------------------------------------------------

const ROOT = "output";
const SKIP_EXISTING = true; // set false to re-fetch/overwrite files that already exist
const REQUEST_DELAY_MS = 200; // polite delay between requests
const DEBUG = true; // set false to quiet down the per-file logging

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Recursively find every *.json file that lives inside a directory literally
// named "en", no matter how deep it is under root (output/**/en/**/*.json).
function findEnFiles(root) {
  const results = [];
  if (!fs.existsSync(root)) {
    console.log(`[ERROR] Root path does not exist: ${path.resolve(root)}`);
    return results;
  }

  function walk(dir, insideEn) {
    let entries;
    try {
      entries = fs.readdirSync(dir);
    } catch (e) {
      console.log(`  [ERROR] Could not read directory ${dir}: ${e.message}`);
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      let stat;
      try {
        stat = fs.statSync(fullPath);
      } catch (e) {
        console.log(`  [ERROR] Could not stat ${fullPath}: ${e.message}`);
        continue;
      }

      if (stat.isDirectory()) {
        if (DEBUG) console.log(`  [DIR]  ${fullPath}${insideEn || entry === "en" ? "  (inside en)" : ""}`);
        walk(fullPath, insideEn || entry === "en");
      } else if (insideEn && entry.endsWith(".json")) {
        if (DEBUG) console.log(`  [FOUND] ${fullPath}`);
        results.push(fullPath);
      }
    }
  }

  walk(root, false);
  return results;
}

// Swap the "en" path segment for LOCALE, keep everything else identical
function targetPathFor(enPath) {
  const parts = enPath.split(path.sep).map((part) => (part === "en" ? LOCALE : part));
  return parts.join(path.sep);
}

async function main() {
  const enFiles = findEnFiles(ROOT);
  console.log(`Found ${enFiles.length} English files under ${ROOT}/`);

  let fetched = 0;
  let skipped = 0;
  let missingLang = 0;
  let errors = 0;

  for (const enPath of enFiles) {
    let data;
    try {
      data = JSON.parse(fs.readFileSync(enPath, "utf-8"));
    } catch (e) {
      console.log(`  [ERROR] Could not read/parse ${enPath}: ${e.message}`);
      errors++;
      continue;
    }

    const available = data.availableLanguages || [];
    if (!available.includes(ACCEPT_LANGUAGE)) {
      if (DEBUG) console.log(`  [SKIP] ${enPath} — availableLanguages: [${available.join(", ")}] (no ${ACCEPT_LANGUAGE})`);
      missingLang++;
      continue;
    }

    const url = data.actions && data.actions.get && data.actions.get.href;
    if (!url) {
      console.log(`  [WARN] No actions.get.href in ${enPath}, skipping`);
      errors++;
      continue;
    }

    const outPath = targetPathFor(enPath);

    if (SKIP_EXISTING && fs.existsSync(outPath)) {
      if (DEBUG) console.log(`  [SKIP] ${outPath} already exists`);
      skipped++;
      continue;
    }

    let localized;
    try {
      const resp = await fetch(url, {
        headers: { "Accept-Language": ACCEPT_LANGUAGE },
      });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
      }
      localized = await resp.json();
    } catch (e) {
      console.log(`  [ERROR] Fetch failed for ${url}: ${e.message}`);
      errors++;
      continue;
    }

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(localized, null, 2), "utf-8");
    console.log(`  [OK] ${enPath}  ->  ${outPath}`);
    fetched++;

    await sleep(REQUEST_DELAY_MS);
  }

  console.log("\nDone.");
  console.log(`  Fetched:        ${fetched}`);
  console.log(`  Skipped (existing): ${skipped}`);
  console.log(`  No ${ACCEPT_LANGUAGE} available: ${missingLang}`);
  console.log(`  Errors:         ${errors}`);
}

main();