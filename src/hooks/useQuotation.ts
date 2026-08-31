import { useEffect, useState } from 'react';
import { catalogApi } from '../api/endpoints';

// Fetched once per page load; null means "unavailable" (still loading, or
// the lookup failed) — callers degrade to native/BRL pricing rather than
// blocking on this. Same "off means off" pattern as AuthConfig.
export function useQuotation(): number | null {
  const [rate, setRate] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    catalogApi
      .quotation()
      .then((q) => {
        if (!cancelled) setRate(q.usdToBrlRate);
      })
      .catch(() => {
        if (!cancelled) setRate(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return rate;
}
