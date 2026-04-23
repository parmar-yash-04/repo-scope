const KEY = "reposcope:recent";

export interface RecentItem {
  owner: string;
  name: string;
  ts: number;
}

export function getRecent(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function pushRecent(owner: string, name: string) {
  if (typeof window === "undefined") return;
  const list = getRecent().filter((x) => !(x.owner === owner && x.name === name));
  list.unshift({ owner, name, ts: Date.now() });
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 8)));
}
