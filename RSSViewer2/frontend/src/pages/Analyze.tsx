/**
 * File: frontend/src/pages/Analyze.tsx
 * Purpose: Analyze page displaying sentiment data with filters by date, source, and security_name.
 */

import { useEffect, useState } from "react";

interface Sentiment {
  security_name: string;
  source: string;
  date: string;
  predict_short_term: number;
  predict_mid_term: number;
  predict_long_term: number;
}

interface SourceCount {
  source: string;
  count: number;
}

interface SecurityCount {
  security_name: string;
  count: number;
}

function Analyze() {
  const [data, setData] = useState<Sentiment[]>([]);
  const [sources, setSources] = useState<SourceCount[]>([]);
  const [securities, setSecurities] = useState<SecurityCount[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedSecurities, setSelectedSecurities] = useState<string[]>([]);

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Modal state
  const [showSourceModal, setShowSourceModal] = useState<boolean>(false);
  const [showSecurityModal, setShowSecurityModal] = useState<boolean>(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    fetch(`${backendUrl}/api/sentiment/sources`)
      .then(res => res.json())
      .then(setSources)
      .catch(err => console.error("Error fetching sources:", err));

    fetch(`${backendUrl}/api/sentiment/securities`)
      .then(res => res.json())
      .then(setSecurities)
      .catch(err => console.error("Error fetching securities:", err));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (startDate) params.append("start", startDate);
    if (endDate) params.append("end", endDate);
    if (selectedSources.length) params.append("sources", selectedSources.join(","));
    if (selectedSecurities.length) params.append("securities", selectedSecurities.join(","));

    fetch(`${backendUrl}/api/sentiment?${params.toString()}`)
      .then(res => res.json())
      .then(d => Array.isArray(d) ? setData(d) : setData([]))
      .catch(err => console.error("Error fetching sentiment:", err));
  }, [startDate, endDate, selectedSources, selectedSecurities]);

  const toggleSelection = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Sentiment Analysis</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block font-semibold">Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="border rounded p-1 w-full"
          />
        </div>
        <div>
          <label className="block font-semibold">End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="border rounded p-1 w-full"
          />
        </div>
      </div>


      {/* Filter Buttons */}
      <div className="mb-6 flex gap-4">
        {/* Source Filter Button */}
        <button
          onClick={() => setShowSourceModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Source Filter
        </button>
        {/* Security Filter Button */}
        <button
          onClick={() => setShowSecurityModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Security Filter
        </button>
      </div>

      {/* Source Filter Modal */}
      {showSourceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl mb-4 font-semibold">Select Sources</h2>
            <div className="flex flex-wrap gap-2">
              {sources.map(s => (
                <button
                  key={s.source}
                  onClick={() => toggleSelection(setSelectedSources, s.source)}
                  className={`px-3 py-1 rounded border ${
                    selectedSources.includes(s.source)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {s.source} ({s.count})
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowSourceModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Filter Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl mb-4 font-semibold">Select Securities</h2>
            <div className="flex flex-wrap gap-2">
              {securities.map(s => (
                <button
                  key={s.security_name}
                  onClick={() => toggleSelection(setSelectedSecurities, s.security_name)}
                  className={`px-3 py-1 rounded border ${
                    selectedSecurities.includes(s.security_name)
                      ? "bg-green-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {s.security_name} ({s.count})
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowSecurityModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <table className="min-w-full border border-gray-300 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">Date</th>
            <th className="border px-2 py-1">Security</th>
            <th className="border px-2 py-1">Source</th>
            <th className="border px-2 py-1">Predict Short</th>
            <th className="border px-2 py-1">Predict Mid</th>
            <th className="border px-2 py-1">Predict Long</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="border px-2 py-1">{new Date(row.date).toLocaleString()}</td>
              <td className="border px-2 py-1">{row.security_name}</td>
              <td className="border px-2 py-1">{row.source}</td>
              <td className="border px-2 py-1">{row.predict_short_term}</td>
              <td className="border px-2 py-1">{row.predict_mid_term}</td>
              <td className="border px-2 py-1">{row.predict_long_term}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Analyze;
