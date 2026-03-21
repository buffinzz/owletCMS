export interface CatalogItem {
  title: string;
  author?: string;
  isbn?: string;
  summary?: string;
  subjects?: string[];
  coverUrl?: string;
  publishedDate?: string;
  externalUrl?: string;
  sourceId: string;
  source: string;
}

export interface CatalogProvider {
  name: string;
  fetchNewArrivals(count: number): Promise<CatalogItem[]>;
  search(query: string, count: number): Promise<CatalogItem[]>;
}
