/// <reference lib="webworker" />

import { format } from 'prettier/standalone';
import parserTypeScript from 'prettier/parser-typescript';
import parserBabel from 'prettier/parser-babel';
import parserHtml from 'prettier/parser-html';
import parserCss from 'prettier/parser-postcss';
import parserJson from 'prettier/parser-json';
import parserMarkdown from 'prettier/parser-markdown';
import parserYaml from 'prettier/parser-yaml';

const parsers: Record<string, any> = {
  typescript: parserTypeScript,
  tsx: parserTypeScript,
  javascript: parserBabel,
  jsx: parserBabel,
  html: parserHtml,
  css: parserCss,
  scss: parserCss,
  less: parserCss,
  json: parserJson,
  markdown: parserMarkdown,
  md: parserMarkdown,
  yaml: parserYaml,
  yml: parserYaml,
};

self.onmessage = async (e: MessageEvent) => {
  const { id, type, payload } = e.data;

  try {
    if (type === 'format') {
      const { code, parser: parserName, options } = payload;
      const parser = parsers[parserName] || parserTypeScript;
      
      const formatted = await format(code, {
        parser: parserName,
        plugins: [parser],
        printWidth: 100,
        tabWidth: 2,
        useTabs: false,
        semi: true,
        singleQuote: true,
        trailingComma: 'es5',
        bracketSpacing: true,
        arrowParens: 'avoid',
        endOfLine: 'lf',
        ...options,
      });

      self.postMessage({ id, result: formatted });
    } else if (type === 'lint') {
      // Basic linting - could integrate ESLint here
      self.postMessage({ id, result: [] });
    } else if (type === 'transform') {
      // Code transformation
      self.postMessage({ id, result: payload.code });
    } else {
      self.postMessage({ id, error: `Unknown task type: ${type}` });
    }
  } catch (error: any) {
    self.postMessage({ id, error: error.message });
  }
};