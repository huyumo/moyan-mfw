import { readFileSync } from 'fs';
import matter from 'gray-matter';

export interface MarkdownSection {
  level: number;
  title: string;
  content: string;
  children: MarkdownSection[];
  frontMatter?: Record<string, any>;
}

export interface ParsedMarkdown {
  frontMatter: Record<string, any>;
  sections: MarkdownSection[];
  rawContent: string;
}

export function parseMarkdown(filePath: string): ParsedMarkdown {
  const raw = readFileSync(filePath, 'utf-8');
  const { data: frontMatter, content } = matter(raw);
  const sections = parseSections(content);
  return { frontMatter, sections, rawContent: content };
}

function parseSections(content: string): MarkdownSection[] {
  const normalized = content.replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n');
  const root: MarkdownSection[] = [];
  const stack: { level: number; section: MarkdownSection }[] = [];
  let currentContent: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();

      if (stack.length > 0) {
        stack[stack.length - 1].section.content = currentContent.join('\n').trim();
      }
      currentContent = [];

      const section: MarkdownSection = { level, title, content: '', children: [] };

      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack.length > 0) {
        stack[stack.length - 1].section.children.push(section);
      } else {
        root.push(section);
      }

      stack.push({ level, section });
    } else {
      currentContent.push(line);
    }
  }

  if (stack.length > 0) {
    stack[stack.length - 1].section.content = currentContent.join('\n').trim();
  }

  return root;
}

export function flattenSections(sections: MarkdownSection[]): Array<{
  title: string;
  content: string;
  level: number;
  path: string;
}> {
  const result: Array<{ title: string; content: string; level: number; path: string }> = [];

  function walk(sections: MarkdownSection[], parentPath: string = '') {
    for (const section of sections) {
      const path = parentPath ? `${parentPath} > ${section.title}` : section.title;
      if (section.content.trim()) {
        result.push({ title: section.title, content: section.content, level: section.level, path });
      }
      walk(section.children, path);
    }
  }

  walk(sections);
  return result;
}

export function extractCodeBlocks(content: string): Array<{
  language: string;
  code: string;
}> {
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks: Array<{ language: string; code: string }> = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    blocks.push({ language: match[1] || 'text', code: match[2].trim() });
  }
  return blocks;
}
