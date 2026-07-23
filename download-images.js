import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_JSON = path.join(__dirname, "IMAGES.json");
const OUTPUT_DIR = path.join(__dirname, "output");
const DELAY_MS = 500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseUrl(url) {
  if (url.includes("/documents/")) {
    return url.split("/").pop().split("?")[0];
  }
  const hc = url.match(/article_attachments\/(\d+)/);
  if (hc) {
    return hc[1]; 
  }
  return "unknown";
}

async function download(url, destination) {
  fs.mkdirSync(destination, { recursive: true });

  const dlUrl = url.includes("?") ? url : url + "?download=true";

  const res = await fetch(dlUrl, {
    headers: { "User-Agent": "Mozilla/5.0" },
    redirect: "follow",
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const disposition = res.headers.get("content-disposition");
  let filename;
  const match = disposition?.match(/filename="?([^";\n]+)"?/);
  if (match) {
    filename = match[1].trim();
  } else {
    filename = url.split("/").pop().split("?")[0] || "unknown";
  }

  if (!/\.\w+$/.test(filename)) {
    filename += ".png";
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(path.join(destination, filename), buffer);
  return buffer.length;
}

async function main() {
  const entries = JSON.parse(fs.readFileSync(IMAGES_JSON, "utf8"));

  const toDownload = entries.filter(
    (e) =>
      e.url.includes("support.liferay.com") || e.url.startsWith("/documents/"),
  );

  console.log(`Total entries: ${entries.length}`);
  console.log(`To download: ${toDownload.length}\n`);

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < toDownload.length; i++) {
    let { url, path: dir } = toDownload[i];
    const id = parseUrl(url);
    const destination = path.join(OUTPUT_DIR, dir, id);
    const prefix = `[${i + 1}/${toDownload.length}]`;

    if (!url.includes("support.liferay.com")) {
      url = `https://support.liferay.com${url}`;
    }

    try {
      const bytes = await download(url, destination);
      console.log(`${prefix} OK (${bytes}B): ${dir}${id}/`);
      ok++;
    } catch (err) {
      console.error(`${prefix} FAIL: ${dir}${id}/ — ${err.message}`);
      fail++;
    }

    if (i < toDownload.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\nDone. ${ok} ok, ${fail} failed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
