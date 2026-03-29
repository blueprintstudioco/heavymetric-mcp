#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const SUPABASE_URL = "https://dmlybcnpwtnaadmapdhl.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtbHliY25wd3RuYWFkbWFwZGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzczMjEsImV4cCI6MjA4OTQ1MzMyMX0.tmPk1LzIJn1kW8Tlcjn3nNga3vNJeKzmJgYj80a5x0U";

async function query(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.json();
}

const server = new McpServer({
  name: "Heavy Metric Strategy Library",
  version: "1.0.0",
});

server.tool(
  "search_strategies",
  "Search home service business strategies by keyword. Returns matching strategies with title, category, and summary.",
  {
    query: z.string().describe("Search keyword (e.g. 'pricing', 'google ads', 'hiring')"),
    limit: z.number().optional().default(10).describe("Max results (default 10)"),
  },
  async ({ query: q, limit }) => {
    const data = await query(
      `strategies?or=(title.ilike.*${encodeURIComponent(q)}*,summary.ilike.*${encodeURIComponent(q)}*,content.ilike.*${encodeURIComponent(q)}*)&order=quality_score.desc&limit=${limit}&select=title,slug,category,summary,quality_score`
    );
    if (!data.length) {
      return { content: [{ type: "text", text: `No strategies found for "${q}".` }] };
    }
    const text = data
      .map((s, i) => `${i + 1}. **${s.title}** [${s.category}]\n   ${s.summary}`)
      .join("\n\n");
    return { content: [{ type: "text", text: `Found ${data.length} strategies:\n\n${text}` }] };
  }
);

server.tool(
  "get_strategy",
  "Get the full article content for a specific strategy by its slug or title.",
  {
    slug: z.string().describe("Strategy slug (e.g. 'kill-per-day-pricing') or partial title to search"),
  },
  async ({ slug }) => {
    // Try exact slug first
    let data = await query(
      `strategies?slug=eq.${encodeURIComponent(slug)}&select=title,slug,category,summary,content,actionable_steps,difficulty,cost_level`
    );
    // Fall back to title search
    if (!data.length) {
      data = await query(
        `strategies?title.ilike.*${encodeURIComponent(slug)}*&limit=1&select=title,slug,category,summary,content,actionable_steps,difficulty,cost_level`
      );
    }
    if (!data.length) {
      return { content: [{ type: "text", text: `Strategy "${slug}" not found.` }] };
    }
    const s = data[0];
    let text = `# ${s.title}\n**Category:** ${s.category}`;
    if (s.difficulty) text += ` | **Difficulty:** ${s.difficulty}`;
    if (s.cost_level) text += ` | **Cost:** ${s.cost_level}`;
    text += `\n\n${s.summary}\n\n---\n\n`;
    if (s.content) {
      text += s.content;
    } else if (s.actionable_steps?.length) {
      text += "## Steps\n\n" + s.actionable_steps.map((step, i) => `${i + 1}. ${step}`).join("\n");
    }
    text += `\n\n---\nRead online: https://www.heavymetric.com/strategies/${s.slug}`;
    return { content: [{ type: "text", text }] };
  }
);

server.tool(
  "list_categories",
  "List all strategy categories with counts.",
  {},
  async () => {
    const data = await query("strategies?select=category");
    const counts = {};
    for (const { category } of data) {
      counts[category] = (counts[category] || 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const text = sorted.map(([cat, n]) => `- **${cat}**: ${n} strategies`).join("\n");
    return {
      content: [{ type: "text", text: `${data.length} total strategies across ${sorted.length} categories:\n\n${text}` }],
    };
  }
);

server.tool(
  "browse_category",
  "List all strategies in a specific category.",
  {
    category: z.string().describe("Category name (e.g. 'marketing', 'sales', 'pricing', 'operations', 'hiring', 'finance', 'customer-service', 'technology', 'branding')"),
  },
  async ({ category }) => {
    const data = await query(
      `strategies?category=eq.${encodeURIComponent(category)}&order=quality_score.desc&select=title,slug,summary`
    );
    if (!data.length) {
      return { content: [{ type: "text", text: `No strategies in category "${category}".` }] };
    }
    const text = data
      .map((s, i) => `${i + 1}. **${s.title}**\n   ${s.summary}`)
      .join("\n\n");
    return { content: [{ type: "text", text: `${data.length} ${category} strategies:\n\n${text}` }] };
  }
);

server.tool(
  "random_strategy",
  "Get a random strategy. Great for daily tips or inspiration.",
  {},
  async () => {
    const all = await query("strategies?select=slug");
    const pick = all[Math.floor(Math.random() * all.length)];
    const data = await query(
      `strategies?slug=eq.${pick.slug}&select=title,slug,category,summary,content,actionable_steps`
    );
    const s = data[0];
    let text = `# ${s.title}\n**Category:** ${s.category}\n\n${s.summary}\n\n---\n\n`;
    if (s.content) {
      text += s.content;
    } else if (s.actionable_steps?.length) {
      text += s.actionable_steps.map((step, i) => `${i + 1}. ${step}`).join("\n");
    }
    text += `\n\n---\nRead online: https://www.heavymetric.com/strategies/${s.slug}`;
    return { content: [{ type: "text", text }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
