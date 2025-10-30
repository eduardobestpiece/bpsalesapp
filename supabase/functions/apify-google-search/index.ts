// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type RequestBody = {
  query: string;
  maxResults?: number; // default 50
  country?: string; // e.g. "us"
  languageCode?: string; // e.g. "pt"
  resultsPerPage?: number; // default 100 (actor supports up to 100)
  redflags?: { value: string; type: "term" | "domain" }[];
};

interface ApifyRunResponse {
  data: {
    id: string;
    status: string;
    defaultDatasetId: string;
  };
}

const APIFY_BASE = "https://api.apify.com/v2";
const ACTOR = "apify~google-search-scraper"; // maintained by Apify

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.search = ""; // strip params
    u.hash = "";
    return u.toString();
  } catch {
    return url.split("?")[0];
  }
}

function filterByRedflags(items: any[], redflags: NonNullable<RequestBody["redflags"]>) {
  if (!redflags || redflags.length === 0) return items;
  return items.filter((it) => {
    const title = (it.title || "").toLowerCase();
    const description = (it.description || "").toLowerCase();
    const url = String(it.url || "");
    return !redflags.some((rf) => {
      if (rf.type === "term") {
        const v = rf.value.toLowerCase();
        return title.includes(v) || description.includes(v);
      }
      if (rf.type === "domain") {
        return url.includes(rf.value);
      }
      return false;
    });
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = Deno.env.get("APIFY_TOKEN");
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing APIFY_TOKEN env" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const query = body.query?.trim();
  if (!query) {
    return new Response(JSON.stringify({ error: "query is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const resultsPerPage = Math.min(Math.max(body.resultsPerPage ?? 100, 1), 100);
  const maxResults = Math.min(Math.max(body.maxResults ?? 50, 1), 1000);
  const maxPagesPerQuery = Math.max(1, Math.ceil(maxResults / resultsPerPage));

  const actorInput = {
    queries: query,
    resultsPerPage,
    maxPagesPerQuery,
    aiMode: "aiModeOff",
    focusOnPaidAds: false,
    searchLanguage: body.languageCode ?? "",
    languageCode: body.languageCode ?? "",
    countryCode: body.country ?? "",
    includeUnfilteredResults: false,
    saveHtml: false,
    saveHtmlToKeyValueStore: false,
    includeIcons: false,
  };

  // 1) Start run
  const startRes = await fetch(`${APIFY_BASE}/acts/${ACTOR}/runs?token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(actorInput),
  });
  if (!startRes.ok) {
    const txt = await startRes.text();
    return new Response(JSON.stringify({ error: "Failed to start Apify actor", details: txt }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
  const startJson = (await startRes.json()) as ApifyRunResponse;
  const runId = startJson?.data?.id;
  if (!runId) {
    return new Response(JSON.stringify({ error: "Apify run id missing" }), { status: 502, headers: { "Content-Type": "application/json" } });
  }

  // 2) Poll run status
  let status = "RUNNING";
  let datasetId = startJson?.data?.defaultDatasetId;
  for (let i = 0; i < 120; i++) { // up to ~60s (500ms * 120)
    const runRes = await fetch(`${APIFY_BASE}/runs/${runId}?token=${token}`);
    const runJson = await runRes.json();
    status = runJson?.data?.status ?? status;
    datasetId = runJson?.data?.defaultDatasetId ?? datasetId;
    if (status === "SUCCEEDED" || status === "FAILED" || status === "ABORTED") break;
    await new Promise((r) => setTimeout(r, 500));
  }

  if (status !== "SUCCEEDED" || !datasetId) {
    return new Response(JSON.stringify({ error: "Apify run did not succeed", status }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3) Fetch dataset items
  const itemsRes = await fetch(`${APIFY_BASE}/datasets/${datasetId}/items?clean=true&format=json&limit=${maxResults}&token=${token}`);
  if (!itemsRes.ok) {
    const txt = await itemsRes.text();
    return new Response(JSON.stringify({ error: "Failed to fetch dataset items", details: txt }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
  const items = (await itemsRes.json()) as any[];

  // 4) Filter and dedupe
  const filtered = body.redflags && body.redflags.length > 0 ? filterByRedflags(items, body.redflags) : items;
  const seen = new Set<string>();
  const deduped = [] as any[];
  for (const it of filtered) {
    const normalized = normalizeUrl(String(it.url || it.link || ""));
    if (!normalized) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    deduped.push({
      title: it.title ?? "",
      description: it.description ?? it.snippet ?? "",
      url: it.url ?? it.link ?? "",
      normalized_url: normalized,
      page: it.page ?? 1,
    });
    if (deduped.length >= maxResults) break;
  }

  return new Response(JSON.stringify({ results: deduped }), {
    headers: { "Content-Type": "application/json" },
  });
});


