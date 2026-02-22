# How Anthropic's Marketing Team Weaponized Claude Code

> A non-technical growth marketer — zero coding experience — built Figma plugins, MCP servers, and self-improving memory systems. One person doing the work of an entire team.

---

## Context

[Austin Lau](https://claude.com/blog/how-anthropic-uses-claude-marketing), a growth marketer at Anthropic, had never opened a terminal before Claude Code launched. He Googled "how to open a terminal on Mac" to get started. Within a week he had two production workflows running that fundamentally changed how ad operations worked across the company.

The growth marketing function — search ads, social campaigns, app store listings, email, SEO — runs as a **single-person operation** with no dedicated engineers.

Source: [izanami.dev](https://izanami.dev/post/b56cafbc-4d8d-477a-8629-b5ef70282f2b) · [claude.com/blog](https://claude.com/blog/how-anthropic-uses-claude-marketing)

---

## The Four Systems Built

### 1. Google Ads Copy Generator

**Problem**: Responsive search ads require 15 headlines (≤30 chars each) and 4 descriptions (≤90 chars each) per ad group. Manual creation: ~2 hours per batch.

**Solution**: A custom Claude Code slash command (`/rsa`) that ingests campaign CSVs, cross-references brand voice Agent Skills, and outputs upload-ready ad copy.

**Architecture detail** — Claude Code spawns **specialized sub-agents**: one constrained to 30-char headlines, another to 90-char descriptions. This division prevents the failure mode where a single agent juggling multiple character limits produces sloppy output.

| Metric | Before | After |
|--------|--------|-------|
| Time per batch | 2 hours | 15 minutes |
| Output format | Manual paste | CSV ready for Google Ads upload |

### 2. Figma Plugin — Batch Ad Creative

**Problem**: Each ad variation requires manual frame duplication and text replacement in Figma. At scale (100+ variants across aspect ratios), this is hours of copy-paste.

**Solution**: A custom Figma plugin built entirely through Claude Code in ~45 minutes. It auto-detects template frames, swaps headline and description text, and generates up to 100 variations per run.

| Metric | Before | After |
|--------|--------|-------|
| Per-batch processing | Hours | 0.5 seconds |
| Creative volume | ~10 variants | 100+ variants |
| Productivity multiplier | — | **10×** |

### 3. Meta Ads MCP Server

**Problem**: Checking campaign performance means logging into Meta Ads Manager, navigating dashboards, exporting data.

**Solution**: A Model Context Protocol server connecting the Meta Ads API directly to Claude Desktop. Real-time spend, impressions, CTR, and ROAS queryable via natural language inside the Claude interface.

This eliminates context-switching entirely — campaign analysis happens in the same environment where copy is generated.

### 4. Self-Improving Memory System

**Problem**: A/B test results live in spreadsheets. New ad variations don't systematically learn from past experiments.

**Solution**: A lightweight memory layer that records hypotheses, test outcomes, and winning patterns. When generating new copy, Claude references this history automatically — creating a compound learning loop where each campaign iteration builds on verified data rather than gut instinct.

---

## Key Principles

1. **Target API-connected repetitive work** — Advertising platforms, design tools, and analytics dashboards all have APIs. If you're doing it manually, you're doing it wrong.
2. **Divide by task, not by prompt** — Specialized sub-agents outperform monolithic prompts. One agent per constraint.
3. **Plan in Claude.ai, build in Claude Code** — Think first (chat), then execute (terminal). Rushing to code produces throwaway work.

---

## Broader Impact Across Anthropic Marketing

| Team | Result |
|------|--------|
| **Growth Marketing** | 1 person = multi-person team output |
| **Influencer Marketing** | 100+ hours freed monthly |
| **Customer Marketing** | Case study drafts: 2.5 hrs → 30 min |
| **Digital Marketing** | 5× YoY productivity increase |
| **Product Marketing** | 5–10 hrs saved per product launch |
| **Partner Marketing** | Trade show prep time cut 40% |

---

## Why This Matters for Passion OS

This case study validates the architecture behind Passion Agent's own automation layer — sub-agent delegation, MCP integrations, memory persistence, and the principle that **identifying what to automate matters more than knowing how to code**.

The tooling pattern (slash commands → specialized agents → structured output → API upload) maps directly to how Passion Agent's career engine, content publisher, and Intel Radar modules operate.

---

*Researched 2026-02-21 · Sources: [izanami.dev](https://izanami.dev/post/b56cafbc-4d8d-477a-8629-b5ef70282f2b), [Anthropic Blog](https://claude.com/blog/how-anthropic-uses-claude-marketing)*
