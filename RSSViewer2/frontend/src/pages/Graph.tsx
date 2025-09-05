/**
 * File: frontend/src/pages/Graph.tsx
 * Purpose: Display candlestick chart of securities (BTC/ETH) with selection and zoom/pan.
 */

import { useEffect, useState } from "react";
import Plot from "react-plotly.js";

interface SecurityData {
  security_name: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function Graph() {
  const [data, setData] = useState<SecurityData[]>([]);
  const [security, setSecurity] = useState<string>("BTC");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/securities/${security}`)
      .then(res => res.json())
// Ensure response is valid array
      .then(d => {
        if (Array.isArray(d)) {
          setData(d);
        } else {
          console.error("Invalid data response:", d);
          setData([]);
        }
      })
      .catch(err => console.error("Error fetching securities:", err));
  }, [security]);

  const dates = data.map(d => d.date);
  const open = data.map(d => d.open);
  const high = data.map(d => d.high);
  const low = data.map(d => d.low);
  const close = data.map(d => d.close);

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Candlestick Chart</h1>
      
      <div className="mb-4">
        <label className="mr-2 font-semibold">Select Security:</label>
        <select
          value={security}
          onChange={(e) => setSecurity(e.target.value)}
          className="border p-1 rounded"
        >
          <option value="BTC">BTC</option>
          <option value="ETH">ETH</option>
        </select>
      </div>


      <Plot
        {...({
          data: [
            {
              x: dates,
              open,
              high,
              low,
              close,
              type: "candlestick",
              xaxis: "x",
              yaxis: "y",
            },
          ],
          layout: {
            dragmode: "zoom",
            margin: { r: 10, t: 25, b: 40, l: 60 },
            showlegend: false,
            xaxis: {
              rangeslider: { visible: false },
              title: "Date",
            },
            yaxis: {
              autorange: true,
              title: "Price",
            },
          },
          config: {
            responsive: true,
            displayModeBar: true,
          },
// Expand visualization full width and taller height
          style: { width: "100%", height: "900px" },
        } as any)}
      />
    </div>
  );
}

export default Graph;
