// Deliberately not routed through ./client.ts's `api` helper — that one
// always attaches this app's own Bearer JWT to a relative /api/* path,
// wrong on both counts for a third-party, unauthenticated, absolute-URL
// call. GitHub's REST API sends Access-Control-Allow-Origin: * on public
// read endpoints (verified live), so a plain browser fetch works with no
// server-side proxy. See notes.md for the unauthenticated rate-limit
// tradeoff (60 requests/hour per IP) this accepts.

const GITHUB_ORG = 'tc2-fiap';

export interface CommitsAhead {
  aheadBy: number;
  commits: { sha: string; message: string }[];
}

// Repo name matches the service name exactly for every backend service.
// Returns null on any failure (unknown sha, rate-limited, offline) rather
// than throwing — this is a purely informational, best-effort check, never
// something that should break the page it's shown on.
export async function fetchCommitsAhead(repo: string, deployedSha: string): Promise<CommitsAhead | null> {
  if (!deployedSha || deployedSha === 'unknown') return null;

  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_ORG}/${repo}/compare/${deployedSha}...main`);
    if (!response.ok) return null;

    const data = await response.json();
    return {
      aheadBy: data.ahead_by,
      commits: (data.commits ?? []).map((c: { sha: string; commit: { message: string } }) => ({
        sha: c.sha,
        message: c.commit.message.split('\n')[0],
      })),
    };
  } catch {
    return null;
  }
}
