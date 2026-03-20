import { Injectable, Logger } from '@nestjs/common';
import { join } from 'path';
import { readFile } from 'fs/promises';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  async extractText(filename: string, mimetype: string): Promise<string | null> {
    const filePath = join(process.cwd(), 'uploads', filename);

    try {
      // Text files — just read directly
      if (mimetype.startsWith('text/')) {
        const text = await readFile(filePath, 'utf-8');
        return text.slice(0, 50000); // cap at 50k chars
      }

      // PDFs — use pdf-parse first, fall back to OCR
      if (mimetype === 'application/pdf') {
        return await this.extractPdfText(filePath);
      }

      // Word documents
      if (mimetype.includes('word') || mimetype.includes('officedocument.wordprocessingml')) {
        return await this.extractWordText(filePath);
      }

      // Images — use Tesseract OCR
      if (mimetype.startsWith('image/')) {
        return await this.extractImageText(filePath);
      }

      return null;
    } catch (err) {
      this.logger.error(`OCR failed for ${filename}`, err);
      return null;
    }
  }

  private async extractPdfText(filePath: string): Promise<string | null> {
    try {
      const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');
      const buffer = await readFile(filePath);
      const uint8Array = new Uint8Array(buffer);
      const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: any) => ('str' in item ? item.str : ''))
          .join(' ');
        fullText += pageText + '\n';
      }

      this.logger.log(`PDF text length: ${fullText.trim().length}`);

      if (fullText.trim().length > 50) {
        return fullText.slice(0, 50000);
      }

      // Fall back to OCR if no text extracted
      return await this.extractImageText(filePath);
    } catch (err) {
      this.logger.error(`PDF extraction failed: ${err.message}`);
      return null;
    }
  }

  private async extractWordText(filePath: string): Promise<string | null> {
    try {
      const mammoth = await import('mammoth');
      const buffer = await readFile(filePath);
      const result = await mammoth.extractRawText({ buffer });
      return result.value.slice(0, 50000) || null;
    } catch {
      return null;
    }
  }

  private async extractImageText(filePath: string): Promise<string | null> {
    try {
      const Tesseract = await import('tesseract.js');
      const worker = await Tesseract.createWorker('eng');
      const { data: { text } } = await worker.recognize(filePath);
      await worker.terminate();
      return text.trim().slice(0, 50000) || null;
    } catch {
      return null;
    }
  }
}