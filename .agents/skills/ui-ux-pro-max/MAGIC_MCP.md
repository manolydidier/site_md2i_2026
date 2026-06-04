# 21st.dev Magic MCP

Magic MCP is prepared for this project through the root `.mcp.json` file.

Official source checked:
- https://github.com/21st-dev/magic-mcp
- https://21st.dev/mcp

To activate it, create a 21st.dev API key and expose it as:

```powershell
$env:TWENTY_FIRST_DEV_API_KEY = "your-api-key"
```

For Codex global activation, add an equivalent server block to `C:\Users\RAVELOJAONA MANOLY\.codex\config.toml`:

```toml
[mcp_servers."21st-dev-magic"]
command = "npx"
args = ["-y", "@21st-dev/magic@latest"]
startup_timeout_sec = 120

[mcp_servers."21st-dev-magic".env]
API_KEY = "your-api-key"
```

The API key is intentionally not committed in this project.
