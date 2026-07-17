import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

@Pipe({
  name: 'markdown',
  standalone: true,
})
export class MarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return '';
    const parsedHtml = marked.parse(value, { async: false }) as string;
    const cleanHtml = DOMPurify.sanitize(parsedHtml);
    return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
  }
}
