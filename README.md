# Heavy Metric MCP Server

Give your AI agent access to 50+ battle-tested home service business strategies.

Pricing, marketing, sales, operations, hiring -- real tactics from real contractors, not MBA theory.

## Tools

| Tool | Description |
|------|-------------|
| `search_strategies` | Search by keyword (e.g. "pricing", "google ads") |
| `get_strategy` | Get full article by slug or title |
| `list_categories` | List all categories with counts |
| `browse_category` | List all strategies in a category |
| `random_strategy` | Get a random strategy for daily tips |

## Setup

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "heavymetric": {
      "command": "node",
      "args": ["/path/to/heavymetric-mcp/index.js"]
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json` in your project:

```json
{
  "mcpServers": {
    "heavymetric": {
      "command": "node",
      "args": ["/path/to/heavymetric-mcp/index.js"]
    }
  }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "heavymetric": {
      "command": "node",
      "args": ["/path/to/heavymetric-mcp/index.js"]
    }
  }
}
```

### OpenClaw

Coming soon as a ClawHub skill.

## Example Prompts

Once connected, try asking your AI:

- "What strategies work for getting more Google reviews?"
- "Give me a pricing strategy for my HVAC business"
- "What's a good marketing strategy I can start today?"
- "Show me all sales strategies"
- "Give me a random business tip"

## No API Key Required

The server uses Heavy Metric's public Supabase endpoint. No signup, no auth, no rate limits.

## Links

- Strategy Library: https://www.heavymetric.com/strategies
- Heavy Metric: https://www.heavymetric.com
