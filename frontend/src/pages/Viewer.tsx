/**
 * File: frontend/src/pages/Viewer.tsx
 * Purpose: Show RSS news with lazy loading, source filter, and sort options.
 */

import { useEffect, useState } from "react";

interface NewsItem {
  id: number;
  source: string;
  title: string;
  description: string;
  published: string;
  link: string;
}

interface SourceInfo {
  source: string;
  count: number;
}

function Viewer() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [page, setPage] = useState(1);
  const [sources, setSources] = useState<SourceInfo[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [order, setOrder] = useState("desc");
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchSources();
  }, []);

  useEffect(() => {
    setNews([]);
    setPage(1);
    fetchNews(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSources, order]);

  const fetchSources = async () => {
    const apiUrl = import.meta.env.VITE_BACKEND_URL || `http://localhost:${import.meta.env.VITE_BACKEND_PORT || "3387"}`;
    console.log("[Frontend] Fetching sources from", apiUrl + "/api/sources");
    try {
      const res = await fetch(apiUrl + "/api/sources");
      if (!res.ok) {
        throw new Error(`Failed to fetch sources: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
    setSources(data);
    setSelectedSources(data.map((s:any) => s.source)); // By default select all sources
    console.log(`[Frontend] ✅ Loaded ${data.length} sources (default all selected)`);
    } catch (err) {
      console.error("[Frontend] ❌ Error fetching sources:", err);
      alert("Failed to load sources. Please check connection to backend.");
    }
  };

  const fetchNews = async (pageNum: number, replace = false) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: pageNum.toString(),
      limit: "10",
      order,
    });
    if (selectedSources.length > 0) {
      params.append("sources", selectedSources.join(","));
    }
    const apiUrl = import.meta.env.VITE_BACKEND_URL || `http://localhost:${import.meta.env.VITE_BACKEND_PORT || "3387"}`;
    console.log("[Frontend] Fetching news from", apiUrl + "/api/news?" + params.toString());
    try {
      const res = await fetch(`${apiUrl}/api/news?${params}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch news: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setNews(replace ? data.items : [...news, ...data.items]);
      console.log(`[Frontend] ✅ Loaded ${data.items.length} news items (total ${data.total})`);
      setTotal(data.total);
    } catch (err) {
      console.error("[Frontend] ❌ Error fetching news:", err);
      alert("Failed to load news. Please check connection to backend.");
    } finally {
      setLoading(false);
    }
  };

  const [total, setTotal] = useState(0);

  const handleSourceChange = (src: string) => {
    if (selectedSources.includes(src)) {
      setSelectedSources(selectedSources.filter((s) => s !== src));
    } else {
      setSelectedSources([...selectedSources, src]);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNews(nextPage);
  };

  return (
    <div>
      <h1 className="text-2xl mb-4">News Viewer</h1>

      <div className="mb-4 flex gap-4">
        <div>
          <label className="font-bold">Sort by:</label>
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="ml-2 border px-2"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
        <div className="flex flex-col">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-gray-200 px-2 py-1 rounded text-sm mb-2"
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
          {showFilters && (
            <table className="border-collapse border border-gray-400 text-sm">
              <thead>
                <tr>
                  <th className="border border-gray-400 p-1">Select</th>
                  <th className="border border-gray-400 p-1">Source</th>
                  <th className="border border-gray-400 p-1">Entries</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.source}>
                    <td className="border border-gray-400 p-1 text-center">
                      <input
                        type="checkbox"
                        checked={selectedSources.includes(s.source)}
                        onChange={() => handleSourceChange(s.source)}
                      />
                    </td>
                    <td className="border border-gray-400 p-1">{s.source}</td>
                    <td className="border border-gray-400 p-1 text-right">{s.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="mb-2 text-sm text-gray-600">
        Showing {news.length} of {total} entries
      </div>

      <ul>
        {news.map((item) => (
          <li key={item.id} className="border-b py-2">
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="font-bold">
              {item.title}
            </a>
            <p className="text-sm">{item.description}</p>
            <p className="text-xs text-gray-500">
              {item.source} |{" "}
              {item.published
                ? new Date(item.published).toLocaleString()
                : "Unknown date"}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <button
          onClick={handleLoadMore}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      </div>
    </div>
  );
}

export default Viewer;
