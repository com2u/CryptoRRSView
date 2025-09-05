/**
 * File: backend/server.js
 * Purpose: Express server to serve RSS news from PostgreSQL with filtering and lazy loading.
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";

// Load root .env instead of backend folder .env
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });
// Connection pools for databases
const { Pool } = pkg;

// Pool for News (RSS)
const newsPool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});

// Pool for Graph (securities)
const graphPool = new Pool({
  user: process.env.STOCK_USER,
  host: process.env.STOCK_HOST,
  database: process.env.STOCK_DB,
  password: process.env.STOCK_PASSWORD,
  port: process.env.STOCK_PORT || 5433,
});

// Pool for Analyze (sentiment)
const analyzePool = new Pool({
  user: process.env.STOCKANALYZE_USER,
  host: process.env.STOCKANALYZE_HOST,
  database: process.env.STOCKANALYZE_DB,
  password: process.env.STOCKANALYZE_PASSWORD,
  port: process.env.STOCKANALYZE_PORT || 5432,
});

// Test connection for News DB
import { setTimeout as delay } from "timers/promises";

newsPool.connect()
  .then(client => {
    console.log(`[DB] ✅ Connected to News DB at ${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT} (DB: ${process.env.POSTGRES_DB})`);
    client.release();
  })
  .catch(err => {
    console.error("[DB] ❌ Failed to connect to News DB:", err.message);
    console.error(err.stack);
  });

// Debug log connection settings
console.log("[DB-CONFIG] News DB:", {
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  db: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER
});
console.log("[DB-CONFIG] Graph DB:", {
  host: process.env.STOCK_HOST,
  port: process.env.STOCK_PORT,
  db: process.env.STOCK_DB,
  user: process.env.STOCK_USER
});
console.log("[DB-CONFIG] Analyze DB:", {
  host: process.env.STOCKANALYZE_HOST,
  port: process.env.STOCKANALYZE_PORT,
  db: process.env.STOCKANALYZE_DB,
  user: process.env.STOCKANALYZE_USER
});

// Ensure required tables exist and log row counts
async function verifyTables() {
  try {
    // Check news table
    const newsCheck = await newsPool.query(
      "SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_name = 'news'"
    );
    if (newsCheck.rows[0].count === "1") {
      const newsCount = await newsPool.query("SELECT COUNT(*) AS cnt FROM news");
      console.log(`[DB] ✅ news table exists in News DB with ${newsCount.rows[0].cnt} rows`);
    } else {
      console.warn("[DB] ⚠️ news table is missing in News DB");
    }

    // Check securities table in Graph DB
    const secCheck = await graphPool.query(
      "SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_name = 'securities'"
    );
    if (secCheck.rows[0].count === "1") {
      const secCount = await graphPool.query("SELECT COUNT(*) AS cnt FROM securities");
      console.log(`[DB] ✅ securities table exists in Graph DB with ${secCount.rows[0].cnt} rows`);
    } else {
      console.warn("[DB] ⚠️ securities table is missing in Graph DB");
    }

    // Ensure sentiment table in Analyze DB
    await analyzePool.query(`
      CREATE TABLE IF NOT EXISTS sentiment (
        security_name VARCHAR(50) NOT NULL,
        source TEXT NOT NULL,
        date TIMESTAMPTZ NOT NULL,
        predict_short_term NUMERIC,
        predict_mid_term NUMERIC,
        predict_long_term NUMERIC,
        PRIMARY KEY (security_name, source, date)
      );`
    );
    const sentCheck = await analyzePool.query(
      "SELECT COUNT(*) AS cnt FROM sentiment"
    );
    console.log(`[DB] ✅ sentiment table ensured in Analyze DB with ${sentCheck.rows[0].cnt} rows`);
  } catch (err) {
    console.error("[DB] ❌ Error verifying tables:", err.message);
  }
}

verifyTables();

const app = express();

// Configure strict CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3386",
  "http://cryptorssview.ai-server.org",
  "http://cryptoapi.ai-server.org"
];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like from curl or mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.warn(`[CORS] ❌ Blocked origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Fetch news with pagination, filtering, and sorting
app.get("/api/news", async (req, res) => {
  try {
    const { page = 1, limit = 10, sources, order = "desc" } = req.query;
    const offset = (page - 1) * limit;

    let query = "SELECT * FROM news";
    const values = [];
    const conditions = [];

    if (sources) {
      const srcList = sources.split(",");
      conditions.push(`source = ANY($${values.length + 1})`);
      values.push(srcList);
    }

    if (conditions.length) query += " WHERE " + conditions.join(" AND ");

    query += ` ORDER BY fetched_at ${order === "asc" ? "ASC" : "DESC"}`;
    query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const countQuery = `SELECT COUNT(*) FROM news${conditions.length ? " WHERE " + conditions.join(" AND ") : ""}`;
// Use newsPool
    const countResult = await newsPool.query(countQuery, values.slice(0, values.length - 2));

    const result = await newsPool.query(query, values);
    // Use fetched_at instead of published for display
    const rows = result.rows.map(r => {
      let timestamp = null;
      if (r.fetched_at instanceof Date) {
        timestamp = r.fetched_at.toISOString();
      } else if (typeof r.fetched_at === "string") {
        const d = new Date(r.fetched_at);
        timestamp = isNaN(d.getTime()) ? null : d.toISOString();
      }
      return { ...r, published: timestamp };
    });
    res.json({ total: parseInt(countResult.rows[0].count, 10), items: rows });
  } catch (err) {
    console.error("[API] ❌ Error fetching /api/news:", err.message);
    console.error(err.stack);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

// Fetch list of all unique sources
app.get("/api/sources", async (req, res) => {
  try {
// Use newsPool
    const result = await newsPool.query("SELECT source, COUNT(*) as count FROM news GROUP BY source ORDER BY source ASC");
    res.json(result.rows.map(r => ({ source: r.source, count: parseInt(r.count, 10) })));
  } catch (err) {
    console.error("[API] ❌ Error fetching /api/sources:", err.message);
    console.error(err.stack);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

// Fetch sentiment data with filters (from stock database)
app.get("/api/sentiment", async (req, res) => {
  try {
    const { start, end, sources, securities } = req.query;
    let query = `SELECT security_name, source, date, predict_short_term, predict_mid_term, predict_long_term FROM sentiment`;
    const values = [];
    const conditions = [];

    if (start) {
      conditions.push(`date >= $${values.length + 1}`);
      values.push(start);
    }
    if (end) {
      conditions.push(`date <= $${values.length + 1}`);
      values.push(end);
    }
    if (sources) {
      const srcList = sources.split(",");
      conditions.push(`source = ANY($${values.length + 1})`);
      values.push(srcList);
    }
    if (securities) {
      const secList = securities.split(",");
      conditions.push(`security_name = ANY($${values.length + 1})`);
      values.push(secList);
    }

    if (conditions.length) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY date DESC LIMIT 500"; // prevent overloading

// Use analyzePool
    const result = await analyzePool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("[API] ❌ Error fetching /api/sentiment:", err.message);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

// Fetch sentiment sources overview
app.get("/api/sentiment/sources", async (req, res) => {
  try {
// Query securities data from graphPool
    const result = await graphPool.query(
      "SELECT source, COUNT(*) as count FROM sentiment GROUP BY source ORDER BY count DESC"
    );
    res.json(result.rows.map(r => ({ source: r.source, count: parseInt(r.count, 10) })));
  } catch (err) {
    console.error("[API] ❌ Error fetching /api/sentiment/sources:", err.message);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

// Fetch sentiment securities overview
app.get("/api/sentiment/securities", async (req, res) => {
  try {
// Query sentiment securities from analyzePool
    const result = await analyzePool.query(
      "SELECT security_name, COUNT(*) as count FROM sentiment GROUP BY security_name ORDER BY count DESC"
    );
    res.json(result.rows.map(r => ({ security_name: r.security_name, count: parseInt(r.count, 10) })));
  } catch (err) {
    console.error("[API] ❌ Error fetching /api/sentiment/securities:", err.message);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});


// Fetch securities by security_name (from stock database)
app.get("/api/securities/:name", async (req, res) => {
  try {
    const { name } = req.params;
// Use graphPool for securities
    const result = await graphPool.query(
      `SELECT security_name, date, open, high, low, close, volume
       FROM securities
       WHERE security_name = $1
       ORDER BY date ASC`,
      [name]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("[API] ❌ Error fetching /api/securities:", err.message);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

// Use BACKEND_PORT if defined (to match docker-compose/.env), fallback to PORT or 4000
const PORT = process.env.BACKEND_PORT || process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`PostgreSQL host: ${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}`);
});
