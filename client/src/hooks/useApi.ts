import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = "/api";

/**
 * @param endpoint  API path e.g. "/indexes"
 * @param pollInterval  Auto-refresh interval in ms (default 30 000 = 30s). Pass 0 to disable.
 */
export function useApi<T>(endpoint: string, pollInterval = 30_000) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}${endpoint}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "API error");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();

    if (pollInterval > 0) {
      intervalRef.current = setInterval(() => fetchData(true), pollInterval);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData, pollInterval]);

  return { data, loading, error, refetch: fetchData };
}
