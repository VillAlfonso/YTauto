import type {
  APIKey,
  ClusterResponse,
  DeepDiveResponse,
  DeepDiveSeed,
  Finding,
  GeneratedImagesResponse,
  ImageBrief,
  ImageBriefsResponse,
  OrganizeResponse,
  RoutesResponse,
  Script,
  Section,
  SectionsResponse,
  Story,
  TitlesResponse,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`${path}: ${r.status} ${t.slice(0, 200)}`);
  }
  return r.json();
}

async function getJSON<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`${path}: ${r.status} ${t.slice(0, 200)}`);
  }
  return r.json();
}

// ---- Content pipeline ----

export function runDeepDive(
  genre: string,
  count = 5,
  seed?: DeepDiveSeed,
): Promise<DeepDiveResponse> {
  return postJSON<DeepDiveResponse>("/api/content/deep-dive", { genre, count, seed });
}

export function runRoutes(title: string, count = 4): Promise<RoutesResponse> {
  return postJSON<RoutesResponse>("/api/content/routes", { title, count });
}

export function runOrganize(findings: Finding[]): Promise<OrganizeResponse> {
  return postJSON<OrganizeResponse>("/api/content/organize", { findings });
}

export function runScript(story: Story): Promise<Script> {
  return postJSON<Script>("/api/content/script", { story });
}

export function runClusters(script: string): Promise<ClusterResponse> {
  return postJSON<ClusterResponse>("/api/content/clusters", { script });
}

export function runTitles(idea: string, count = 5): Promise<TitlesResponse> {
  return postJSON<TitlesResponse>("/api/content/titles", { idea, count });
}

// ---- Prototype flow ----

export function runSection(script: string): Promise<SectionsResponse> {
  return postJSON<SectionsResponse>("/api/content/section", { script });
}

export function runImageBriefs(
  script: string,
  sections: Section[],
): Promise<ImageBriefsResponse> {
  return postJSON<ImageBriefsResponse>("/api/content/image-briefs", {
    script,
    sections,
  });
}

export function runGenerateImages(briefs: ImageBrief[]): Promise<GeneratedImagesResponse> {
  return postJSON<GeneratedImagesResponse>("/api/content/generate-images", { briefs });
}

// ---- API keys ----

export function fetchKeys(): Promise<APIKey[]> {
  return getJSON<APIKey[]>("/api/keys");
}

export function addKey(label: string, key: string): Promise<APIKey> {
  return postJSON<APIKey>("/api/keys", { label, key });
}

export async function deleteKey(id: string): Promise<void> {
  const r = await fetch(`${BASE}/api/keys/${encodeURIComponent(id)}`, {
    method: "DELETE",
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`delete key: ${r.status}`);
}

export function activateKey(id: string): Promise<APIKey> {
  return postJSON<APIKey>(`/api/keys/${encodeURIComponent(id)}/activate`, {});
}

export function deactivateKey(id: string): Promise<APIKey> {
  return postJSON<APIKey>(`/api/keys/${encodeURIComponent(id)}/deactivate`, {});
}

export function resetKey(id: string): Promise<APIKey> {
  return postJSON<APIKey>(`/api/keys/${encodeURIComponent(id)}/reset`, {});
}
