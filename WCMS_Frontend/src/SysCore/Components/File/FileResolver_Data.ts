export interface FileMeta {
  id: string;
  url: string;
  alt?: string | null;
  mime?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface ResolveManyRequest {
  ids: string[];
  locale?: string;
}

export interface ResolveManyResponse {
  results: FileMeta[];
  notFound?: string[];
}