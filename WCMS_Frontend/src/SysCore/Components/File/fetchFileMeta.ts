import type{ FileMeta, ResolveManyRequest, ResolveManyResponse } from "./FileResolver_Data";

export const fetchFileMetaMap = async (
  ids: string[],
  locale?: string
): Promise<Record<string, FileMeta>> => {
  if (ids.length === 0) return {};
  const body: ResolveManyRequest = { ids, locale };
  const res = await fetch("/Service/File/ResolveMany", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`ResolveMany failed: ${res.status}`);
  const data = (await res.json()) as ResolveManyResponse;
  const map: Record<string, FileMeta> = {};
  for (const item of data.results) map[item.id] = item;
  return map;
};
