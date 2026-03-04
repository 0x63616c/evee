import { tool } from 'ai';
import { search } from 'duck-duck-scrape';
import { z } from 'zod';

export const searchWeb = tool({
  description:
    'Search the web using DuckDuckGo. Returns titles, URLs, and descriptions.',
  inputSchema: z.object({
    query: z.string().describe('The search query'),
  }),
  execute: async ({ query }) => {
    const results = await search(query);
    if (results.noResults) {
      return { results: [] };
    }
    return {
      results: results.results.slice(0, 5).map((r) => ({
        title: r.title,
        url: r.url,
        description: r.rawDescription,
      })),
    };
  },
});
