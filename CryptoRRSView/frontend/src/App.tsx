/**
 * File: frontend/src/App.tsx
 * Purpose: Main React application with routing for Viewer, Analyze, and Graph.
 */

import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Viewer from "./pages/Viewer";
import Analyze from "./pages/Analyze";
import Graph from "./pages/Graph";

function App() {
  return (
    <Router>

      <div className="min-h-screen bg-gray-50">
        <nav className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 flex items-center justify-between shadow-md">
          <div className="text-xl font-bold tracking-wide">📊 RSS Viewer 2</div>
          <div className="flex gap-6">
            <Link
              to="/"
              className="px-3 py-2 rounded-lg hover:bg-yellow-400 hover:text-black transition-colors duration-300 font-medium"
            >
              Viewer
            </Link>
            <Link
              to="/analyze"
              className="px-3 py-2 rounded-lg hover:bg-yellow-400 hover:text-black transition-colors duration-300 font-medium"
            >
              Analyze
            </Link>
            <Link
              to="/graph"
              className="px-3 py-2 rounded-lg hover:bg-yellow-400 hover:text-black transition-colors duration-300 font-medium"
            >
              Graph
            </Link>
          </div>
        </nav>
        <div className="p-6">
          <Routes>
            <Route path="/" element={<Viewer />} />
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/graph" element={<Graph />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
