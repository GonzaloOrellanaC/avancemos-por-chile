import { readFile } from 'node:fs/promises';
import path from 'node:path';

const templateCache = new Map<string, string>();

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const loadTemplate = async (templateName: string) => {
  const cachedTemplate = templateCache.get(templateName);
  if (cachedTemplate) return cachedTemplate;

  const templatePath = path.join(process.cwd(), 'src', 'templates', `${templateName}.html`);
  const template = await readFile(templatePath, 'utf-8');
  templateCache.set(templateName, template);
  return template;
};

export const renderHtmlTemplate = async (
  templateName: string,
  variables: Record<string, string>,
) => {
  const template = await loadTemplate(templateName);

  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    const value = variables[key];
    return escapeHtml(value ?? '');
  });
};