import { makeAssistantToolUI } from '@assistant-ui/react';
import { AlertCircle, ExternalLink, Globe, Loader2 } from 'lucide-react';

export const SearchWebUI = makeAssistantToolUI<
  { query: string },
  { results: Array<{ title: string; url: string; description: string }> }
>({
  toolName: 'search_web',
  render: ({ args, result, status }) => {
    if (status.type === 'running') {
      return (
        <ToolCard>
          <Loader2 size={14} className="animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Searching: {args.query}
          </span>
        </ToolCard>
      );
    }

    if (status.type === 'incomplete') {
      return (
        <ToolCard>
          <AlertCircle size={14} className="text-destructive" />
          <span className="text-sm text-destructive">Search failed</span>
        </ToolCard>
      );
    }

    if (!result?.results?.length) {
      return (
        <ToolCard>
          <Globe size={14} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            No results for "{args.query}"
          </span>
        </ToolCard>
      );
    }

    return (
      <ToolCard>
        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Globe size={12} />
            <span>Search: {args.query}</span>
          </div>
          {result.results.map((r) => (
            <a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-1.5 text-xs hover:underline"
            >
              <ExternalLink size={10} className="shrink-0 mt-0.5" />
              <span className="truncate">{r.title}</span>
            </a>
          ))}
        </div>
      </ToolCard>
    );
  },
});

export const FetchUrlUI = makeAssistantToolUI<
  { url: string },
  { content?: string; error?: string }
>({
  toolName: 'fetch_url',
  render: ({ args, result, status }) => {
    const displayUrl = truncateUrl(args.url);

    if (status.type === 'running') {
      return (
        <ToolCard>
          <Loader2 size={14} className="animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Fetching: {displayUrl}
          </span>
        </ToolCard>
      );
    }

    if (status.type === 'incomplete' || result?.error) {
      return (
        <ToolCard>
          <AlertCircle size={14} className="text-destructive" />
          <span className="text-sm text-destructive">
            Failed to fetch {displayUrl}
          </span>
        </ToolCard>
      );
    }

    return (
      <ToolCard>
        <ExternalLink size={14} className="shrink-0 text-muted-foreground" />
        <a
          href={args.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:underline truncate"
        >
          Fetched: {displayUrl}
        </a>
      </ToolCard>
    );
  },
});

function ToolCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-1 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
      {children}
    </div>
  );
}

function truncateUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const path =
      parsed.pathname.length > 30
        ? `${parsed.pathname.slice(0, 30)}...`
        : parsed.pathname;
    return `${parsed.hostname}${path}`;
  } catch {
    return url.length > 50 ? `${url.slice(0, 50)}...` : url;
  }
}
