import { Injectable, Logger } from '@nestjs/common';
import { CatalogItem, CatalogProvider } from '../catalog.interface';

@Injectable()
export class EvergreenProvider implements CatalogProvider {
  name = 'evergreen';
  private readonly logger = new Logger(EvergreenProvider.name);

  constructor(
    private readonly feedUrl: string,
    private readonly libraryCode: string,
  ) {}

  async fetchNewArrivals(count: number = 10): Promise<CatalogItem[]> {
    try {
      const date = new Date();
      date.setDate(date.getDate() - 7); // last 7 days
      const dateStr = date.toISOString().split('T')[0];
      const url = `${this.feedUrl}/opac/extras/feed/freshmeat/atom/biblio/import/${count}/${dateStr}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Feed returned ${response.status}`);

      const xml = await response.text();
      return this.parseAtomFeed(xml);
    } catch (err) {
      this.logger.error('Failed to fetch Evergreen feed', err);
      return [];
    }
  }

  async search(query: string, count: number = 10): Promise<CatalogItem[]> {
    try {
      const url = `${this.feedUrl}/opac/extras/opensearch/1.1/${this.libraryCode}/atom-full/keyword/?searchTerms=${encodeURIComponent(query)}&count=${count}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Search returned ${response.status}`);
      const xml = await response.text();
      return this.parseAtomFeed(xml);
    } catch (err) {
      this.logger.error('Failed to search Evergreen', err);
      return [];
    }
  }

  private parseAtomFeed(xml: string): CatalogItem[] {
    const items: CatalogItem[] = [];

    // Extract all <atom:entry> or <entry> blocks
    const entryRegex = /<(?:atom:)?entry[^>]*>([\s\S]*?)<\/(?:atom:)?entry>/g;
    let match;

    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1];
      const item = this.parseEntry(entry);
      if (item) items.push(item);
    }

    return items;
  }

  private parseEntry(entry: string): CatalogItem | null {
    try {
      const title = this.extractTag(entry, 'title');
      if (!title) return null;

      const author = this.extractTag(entry, 'name');
      const summary = this.extractTag(entry, 'summary');
      const published = this.extractTag(entry, 'published');

      // Extract all subjects from category terms
      const subjects: string[] = [];
      const categoryRegex = /<category[^>]+term="([^"]+)"/g;
      let catMatch;
      while ((catMatch = categoryRegex.exec(entry)) !== null) {
        const term = catMatch[1].trim();
        if (term && !term.match(/^\d+$/)) {
          subjects.push(term);
        }
      }

      // Extract ISBN from dc:identifier
      let isbn: string | undefined;
      const identifierRegex = /<dc:identifier>URN:ISBN:([^<]+)<\/dc:identifier>/g;
      const isbnMatch = identifierRegex.exec(entry);
      if (isbnMatch) {
        isbn = isbnMatch[1].trim().replace(/-/g, '');
      }

      // Extract BIBID for sourceId
      const bibidMatch = /URN:BIBID:(\d+)/.exec(entry);
      const sourceId = bibidMatch ? bibidMatch[1] : '';

      // Extract external URL (Overdrive etc)
      const urlMatch = /<dc:identifier>(https?:\/\/[^<]+)<\/dc:identifier>/.exec(entry);
      const externalUrl = urlMatch ? urlMatch[1] : undefined;

      // Fetch cover from Open Library if we have an ISBN
      const coverUrl = isbn
        ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`
        : undefined;

      return {
        title: this.cleanTitle(title),
        author: author ? this.cleanAuthor(author) : undefined,
        isbn,
        summary: summary || undefined,
        subjects: subjects.length > 0 ? subjects : undefined,
        coverUrl,
        publishedDate: published || undefined,
        externalUrl,
        sourceId,
        source: 'evergreen',
      };
    } catch {
      return null;
    }
  }

  private extractTag(xml: string, tag: string): string | null {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = regex.exec(xml);
    return match ? match[1].trim() : null;
  }

  private cleanTitle(title: string): string {
    // Remove trailing slash and extra whitespace common in MARC-derived titles
    return title.replace(/\s*\/\s*$/, '').replace(/\s+/g, ' ').trim();
  }

  private cleanAuthor(author: string): string {
    // Strip URLs and MARC relator terms
    return author
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\(CARDINAL\)\d+/g, '')
      .replace(/,\s*author\./g, '')
      .replace(/,\s*\d{4}-(\d{4})?\.?/g, '')
      .trim();
  }
}