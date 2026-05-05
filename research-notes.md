# Research Notes: Free Search Aggregate Solutions

## Key Finding: SearXNG HTML Parsing Approach
From mcp-searxng-public project (42 stars):
- Most public SearXNG instances DON'T expose JSON format
- The solution is to parse HTML results into JSON
- Uses up to 3 servers with fallback
- Reliable public instances (from their env config):
  - https://metacat.online
  - https://nyc1.sx.ggtyler.dev
  - https://ooglester.com
  - https://search.080609.xyz
  - https://search.canine.tools
  - https://search.catboy.house
  - https://search.citw.lgbt
  - https://search.einfachzocken.eu
  - https://search.federicociro.com
  - https://search.hbubli.cc
  - https://search.im-in.space
  - https://search.indst.eu

## Approach: Parse SearXNG HTML (not JSON)
Since most public instances block JSON format, we should:
1. Query the HTML search page
2. Parse the results from HTML (like the MCP server does)
3. Use multiple instances as fallback

## Other Free APIs for Parity:
- Brave Search: 2000 free queries/month (already integrated)
- DuckDuckGo HTML: Already working as primary
- Wikipedia: Already integrated
- Hacker News: Already integrated

## Remaining Manus Capabilities to Match with Free Solutions:
1. **Image Generation** - Already using Forge API (built-in)
2. **Document Generation** - Already have generate_document tool
3. **Browser Automation** - cloud_browser exists, needs SearXNG HTML parsing for search
4. **Scheduled Tasks** - Already have automation_orchestrate
5. **Multi-agent** - Already have parallel_map, multi_agent_orchestrate
6. **Voice/Audio** - Already have voice transcription via Forge
7. **Video Analysis** - Already have analyze_video tool

## What's Actually Missing for TRUE Parity:
1. SearXNG HTML parsing fallback (public instances block JSON)
2. Brave API key auto-provisioning guidance
3. End-to-end search quality validation
4. Knowledge base dynamic injection based on task type
