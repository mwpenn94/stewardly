# Manus Parity Audit: Comprehensive Gap Analysis

## Manus Core Tools (from leaked tools.json)
1. `message_notify_user` - Send messages to user
2. `message_ask_user` - Ask user questions
3. `file_read` - Read files
4. `file_write` - Write/append files
5. `file_str_replace` - String replacement in files
6. `file_find_in_content` - Regex search in file content
7. `file_find_by_name` - Find files by glob pattern
8. `shell_exec` - Execute shell commands
9. `shell_view` - View shell session
10. `shell_wait` - Wait for process
11. `shell_write_to_process` - Write to stdin
12. `shell_kill_process` - Kill process
13. `browser_view` - View browser page
14. `browser_navigate` - Navigate to URL
15. `browser_restart` - Restart browser
16. `browser_click` - Click elements
17. `browser_input` - Input text
18. `browser_move_mouse` - Move cursor
19. `browser_press_key` - Press keys
20. `browser_select_option` - Select dropdown
21. `browser_scroll_up` - Scroll up
22. `browser_scroll_down` - Scroll down
23. `browser_console_exec` - Execute JS
24. `browser_console_view` - View console
25. **`info_search_web`** - Search web (Google-style, 3-5 keywords, date_range filter)
26. `deploy_expose_port` - Expose local port
27. `deploy_apply_deployment` - Deploy static/nextjs
28. `make_manus_page` - Create MDX page
29. `idle` - Enter idle state

## How Manus Search Actually Works (from prompt rules)
- "Information priority: authoritative data from datasource API > web search > model's internal knowledge"
- "Prefer dedicated search tools over browser access to search engine result pages"
- "Snippets in search results are not valid sources; must access original pages via browser"
- "Access multiple URLs from search results for comprehensive information or cross-validation"
- "Conduct searches step by step: search multiple attributes of single entity separately, process multiple entities one by one"
- "Must use browser tools to access URLs from search tool results"

## Key Insight: Manus has ONE search tool (`info_search_web`) that returns REAL Google results
- It's a proper search engine API (likely Google/Bing) with real results
- The agent then uses browser_navigate to visit those URLs for full content
- The search + browse pattern is the core research workflow

## Our Current Implementation vs Manus

### SEARCH (CRITICAL GAP - NOT AT PARITY)
| Aspect | Manus | Our Implementation | Gap |
|--------|-------|-------------------|-----|
| Search engine | Real Google/Bing API results | DuckDuckGo Instant Answer API (no real web results!) | SEVERE |
| Result quality | Full SERP with 10+ URLs | Only abstract/related topics, no actual search results | SEVERE |
| Follow-up browsing | Agent visits URLs via browser | We fetch 2 pages inline, no real browsing | MODERATE |
| Date filtering | past_hour/day/week/month/year | Not implemented | MODERATE |
| Multi-step research | Agent iterates: search → browse → search again | Single-shot, no iteration | SEVERE |
| Source validation | Agent reads full pages via browser | We truncate to 4000 chars | MODERATE |

### BROWSER (MODERATE GAP)
| Aspect | Manus | Our Implementation | Gap |
|--------|-------|-------------------|-----|
| Real browser | Full Chromium with screenshots | cloud_browser tool exists but limited | MODERATE |
| Page interaction | Click, input, scroll, JS exec | browse_web fetches content only | MODERATE |
| Visual understanding | Screenshots with element indices | No visual capability | MODERATE |
| Login persistence | Session cookies persist | No session management | MODERATE |

### WIDE RESEARCH (MODERATE GAP)
| Aspect | Manus | Our Implementation | Gap |
|--------|-------|-------------------|-----|
| Parallel agents | 100+ independent agents | parallel_map tool exists but untested | LOW |
| Source diversity | Each agent searches independently | Single search path | MODERATE |

### FILE SYSTEM (AT PARITY)
- We have create_file, edit_file, read_file, list_files ✓

### SHELL (AT PARITY)
- We have execute_code, run_command, install_deps ✓

### DEPLOYMENT (AT PARITY with live_preview)
- We have deploy_webapp, live_preview, create_webapp ✓

## FREE SEARCH API OPTIONS FOR PARITY

### Tier 1: SearXNG (Self-hosted meta-search - FREE, UNLIMITED)
- Aggregates Google, Bing, DuckDuckGo, Brave, etc.
- Returns real search results with URLs, titles, snippets
- Can be deployed as a Docker container or used via public instances
- Public instances: searx.be, search.sapti.me, etc.

### Tier 2: Brave Search API (Free tier: 2000 queries/month)
- Real search results with URLs
- Web, news, and video results
- Free tier is generous for personal use

### Tier 3: Serper.dev (Free tier: 2500 queries)
- Google Search Results API
- Returns actual Google SERP data
- Very high quality results

### Tier 4: DuckDuckGo HTML scraping (Free, unlimited but fragile)
- Parse DuckDuckGo HTML results page
- Returns real search results
- Can be blocked by CAPTCHA

### Tier 5: Tavily API (Free tier: 1000 queries/month)
- AI-optimized search API
- Returns extracted content from pages
- Designed for AI agents

## AGGREGATE SOLUTION DESIGN

The solution should cascade through tiers:
1. Try SearXNG public instances (free, real results)
2. Fallback to Brave Search API (if configured)
3. Fallback to Serper.dev (if configured)
4. Fallback to DuckDuckGo HTML parsing
5. Fallback to Wikipedia + Hacker News (current)

Each tier returns standardized results:
```typescript
interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  publishedDate?: string;
}
```

Then the agent should:
1. Get search results (URLs + snippets)
2. Use read_webpage/browse_web to visit top URLs for full content
3. Synthesize findings

This matches exactly how Manus works: search → get URLs → browse URLs → synthesize.

## OTHER GAPS TO ADDRESS

### 1. Data API Module (Manus has authoritative data sources)
- Weather, stocks, etc. via pre-built APIs
- We have Forge API but don't expose it as a data source layer

### 2. Planner Module (Manus has explicit task planning)
- Numbered pseudocode steps
- Status tracking per step
- We have todo.md but no structured planner

### 3. Knowledge Module (Manus has contextual knowledge injection)
- Task-relevant knowledge provided as events
- Scoped to specific conditions
- We have system prompt but no dynamic knowledge injection

### 4. Browser Operator (Manus has a browser extension)
- Works on user's actual browser
- Can interact with user's logged-in sessions
- We don't have this (and can't easily replicate)
