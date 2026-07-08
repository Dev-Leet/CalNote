# Direct Web Scraping Guide: LeetCode, Codeforces, and CodeChef

**Version:** 1.0  
**Date:** July 5, 2026  
**Purpose:** Scrape contest data directly from official competitive programming websites

---

## Table of Contents

1. [Overview](#overview)
2. [Technical Approach](#technical-approach)
3. [LeetCode Contest Scraping](#leetcode-contest-scraping)
4. [Codeforces Contest Scraping](#codeforces-contest-scraping)
5. [CodeChef Contest Scraping](#codechef-contest-scraping)
6. [Complete Implementation](#complete-implementation)
7. [Anti-Bot Protection Handling](#anti-bot-protection-handling)
8. [Rate Limiting & Best Practices](#rate-limiting--best-practices)
9. [Error Handling](#error-handling)
10. [Testing](#testing)

---

## Overview

### Why Scrape Official Websites?

**Advantages:**
- ✅ Most up-to-date information
- ✅ No dependency on third-party APIs
- ✅ Access to detailed contest information
- ✅ Can extract additional metadata (problem counts, prizes, etc.)

**Challenges:**
- ⚠️ Websites may change structure
- ⚠️ Anti-bot protection (Cloudflare, reCAPTCHA)
- ⚠️ Rate limiting
- ⚠️ Dynamic content (JavaScript rendering)

### Tools We'll Use

1. **Puppeteer** - Headless browser for JavaScript-heavy sites
2. **Cheerio** - Fast HTML parsing for static content
3. **Axios** - HTTP requests
4. **Playwright** - Alternative to Puppeteer (more reliable)

---

## Technical Approach

### Method 1: API Endpoints (Best)

Some platforms have unofficial/undocumented APIs:

```typescript
// LeetCode GraphQL API
POST https://leetcode.com/graphql

// Codeforces Public API
GET https://codeforces.com/api/contest.list

// CodeChef (No official API, scraping required)
```

### Method 2: HTML Scraping

Parse HTML directly from contest pages.

### Method 3: Headless Browser

Use Puppeteer/Playwright for JavaScript-rendered content.

---

## LeetCode Contest Scraping

### Approach 1: LeetCode GraphQL API (Recommended)

LeetCode has an undocumented GraphQL API!

#### Implementation

**File: `backend/src/scrapers/leetcodeScraper.ts`**

```typescript
import axios from 'axios';
import { logger } from '../utils/logger';

interface LeetCodeContest {
  title: string;
  titleSlug: string;
  startTime: number; // Unix timestamp
  duration: number; // seconds
  isVirtual: boolean;
}

export class LeetCodeScraper {
  private readonly API_URL = 'https://leetcode.com/graphql';
  private readonly BASE_URL = 'https://leetcode.com';

  /**
   * Fetch contests using LeetCode's GraphQL API
   */
  async fetchContests(): Promise<LeetCodeContest[]> {
    try {
      const query = `
        query contestList {
          allContests {
            title
            titleSlug
            startTime
            duration
            isVirtual
          }
        }
      `;

      const response = await axios.post(
        this.API_URL,
        {
          query: query,
          variables: {},
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      );

      const contests = response.data.data.allContests;
      
      // Filter upcoming contests (not virtual)
      const upcomingContests = contests.filter(
        (contest: LeetCodeContest) =>
          !contest.isVirtual && contest.startTime * 1000 > Date.now()
      );

      return upcomingContests;
    } catch (error) {
      logger.error('LeetCode scraping error:', error);
      throw new Error('Failed to fetch LeetCode contests');
    }
  }

  /**
   * Format contest data to standard format
   */
  formatContest(contest: LeetCodeContest) {
    const startTime = new Date(contest.startTime * 1000);
    const endTime = new Date(startTime.getTime() + contest.duration * 1000);

    return {
      name: contest.title,
      platform: 'leetcode',
      url: `${this.BASE_URL}/contest/${contest.titleSlug}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: `${Math.floor(contest.duration / 60)} minutes`,
      status: 'upcoming',
    };
  }

  /**
   * Get detailed contest info (requires scraping)
   */
  async getContestDetails(titleSlug: string) {
    try {
      const query = `
        query contestDetails($titleSlug: String!) {
          contest(titleSlug: $titleSlug) {
            title
            titleSlug
            startTime
            duration
            description
            totalProblems
            registeredUsersCount
          }
        }
      `;

      const response = await axios.post(
        this.API_URL,
        {
          query: query,
          variables: { titleSlug },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      );

      return response.data.data.contest;
    } catch (error) {
      logger.error(`Error fetching LeetCode contest ${titleSlug}:`, error);
      return null;
    }
  }
}
```

### Approach 2: Scrape LeetCode Contest Page

```typescript
import * as cheerio from 'cheerio';
import axios from 'axios';

export class LeetCodeHTMLScraper {
  async scrapeContestPage() {
    try {
      const response = await axios.get('https://leetcode.com/contest/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const $ = cheerio.load(response.data);
      const contests: any[] = [];

      // LeetCode uses React, so we need to extract from script tags
      $('script').each((_, element) => {
        const scriptContent = $(element).html();
        if (scriptContent && scriptContent.includes('__NEXT_DATA__')) {
          // Extract JSON data from Next.js script
          const jsonMatch = scriptContent.match(/{"props".*}/s);
          if (jsonMatch) {
            try {
              const data = JSON.parse(jsonMatch[0]);
              // Navigate the data structure to find contests
              // This structure may change, so it's fragile
            } catch (e) {
              logger.error('Failed to parse LeetCode data:', e);
            }
          }
        }
      });

      return contests;
    } catch (error) {
      logger.error('LeetCode HTML scraping error:', error);
      return [];
    }
  }
}
```

---

## Codeforces Contest Scraping

### Approach 1: Codeforces Public API (Recommended)

Codeforces has an **official public API**! 🎉

**File: `backend/src/scrapers/codeforcesScraper.ts`**

```typescript
import axios from 'axios';
import { logger } from '../utils/logger';

interface CodeforcesContest {
  id: number;
  name: string;
  type: string;
  phase: 'BEFORE' | 'CODING' | 'PENDING_SYSTEM_TEST' | 'SYSTEM_TEST' | 'FINISHED';
  frozen: boolean;
  durationSeconds: number;
  startTimeSeconds?: number;
  relativeTimeSeconds?: number;
}

export class CodeforcesScraper {
  private readonly API_URL = 'https://codeforces.com/api';
  private readonly BASE_URL = 'https://codeforces.com';

  /**
   * Fetch contests using official Codeforces API
   */
  async fetchContests(): Promise<CodeforcesContest[]> {
    try {
      const response = await axios.get(`${this.API_URL}/contest.list`, {
        params: {
          gym: false, // Exclude gym contests
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (response.data.status !== 'OK') {
        throw new Error('Codeforces API returned error');
      }

      const contests = response.data.result;
      
      // Filter upcoming contests
      const upcomingContests = contests.filter(
        (contest: CodeforcesContest) => contest.phase === 'BEFORE'
      );

      return upcomingContests;
    } catch (error) {
      logger.error('Codeforces scraping error:', error);
      throw new Error('Failed to fetch Codeforces contests');
    }
  }

  /**
   * Format contest data to standard format
   */
  formatContest(contest: CodeforcesContest) {
    const startTime = contest.startTimeSeconds
      ? new Date(contest.startTimeSeconds * 1000)
      : null;
    
    const endTime = startTime
      ? new Date(startTime.getTime() + contest.durationSeconds * 1000)
      : null;

    return {
      name: contest.name,
      platform: 'codeforces',
      url: `${this.BASE_URL}/contest/${contest.id}`,
      startTime: startTime?.toISOString() || null,
      endTime: endTime?.toISOString() || null,
      duration: `${Math.floor(contest.durationSeconds / 3600)} hours`,
      status: 'upcoming',
      metadata: {
        contestId: contest.id,
        type: contest.type,
        phase: contest.phase,
      },
    };
  }

  /**
   * Get contest standings (requires authentication for some contests)
   */
  async getContestStandings(contestId: number) {
    try {
      const response = await axios.get(`${this.API_URL}/contest.standings`, {
        params: {
          contestId,
          from: 1,
          count: 10,
        },
      });

      return response.data.result;
    } catch (error) {
      logger.error(`Error fetching Codeforces standings ${contestId}:`, error);
      return null;
    }
  }

  /**
   * Get user rating changes for a contest
   */
  async getRatingChanges(contestId: number) {
    try {
      const response = await axios.get(`${this.API_URL}/contest.ratingChanges`, {
        params: { contestId },
      });

      return response.data.result;
    } catch (error) {
      logger.error(`Error fetching rating changes ${contestId}:`, error);
      return null;
    }
  }
}
```

### Approach 2: Scrape Codeforces Contests Page

```typescript
import * as cheerio from 'cheerio';
import axios from 'axios';

export class CodeforcesHTMLScraper {
  async scrapeContestsPage() {
    try {
      const response = await axios.get('https://codeforces.com/contests', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const $ = cheerio.load(response.data);
      const contests: any[] = [];

      // Find the contests table
      $('div.datatable table tr').each((index, element) => {
        if (index === 0) return; // Skip header row

        const $row = $(element);
        const cells = $row.find('td');

        if (cells.length >= 6) {
          const name = cells.eq(0).text().trim();
          const writers = cells.eq(1).text().trim();
          const startTime = cells.eq(2).find('a').text().trim();
          const length = cells.eq(3).text().trim();
          const registrationLink = cells.eq(5).find('a').attr('href');

          if (name && startTime) {
            contests.push({
              name,
              writers,
              startTime,
              duration: length,
              registrationLink: registrationLink
                ? `https://codeforces.com${registrationLink}`
                : null,
            });
          }
        }
      });

      return contests;
    } catch (error) {
      logger.error('Codeforces HTML scraping error:', error);
      return [];
    }
  }
}
```

---

## CodeChef Contest Scraping

### Approach 1: Scrape CodeChef API Endpoint

CodeChef has an internal API used by their frontend.

**File: `backend/src/scrapers/codechefScraper.ts`**

```typescript
import axios from 'axios';
import { logger } from '../utils/logger';

interface CodeChefContest {
  contest_code: string;
  contest_name: string;
  contest_start_date: string;
  contest_end_date: string;
  contest_start_date_iso: string;
  contest_end_date_iso: string;
  contest_duration: string;
}

export class CodeChefScraper {
  private readonly API_URL = 'https://www.codechef.com/api/list/contests';
  private readonly BASE_URL = 'https://www.codechef.com';

  /**
   * Fetch contests using CodeChef's internal API
   */
  async fetchContests(): Promise<CodeChefContest[]> {
    try {
      const response = await axios.get(`${this.API_URL}/all`, {
        params: {
          sort_by: 'START',
          sorting_order: 'asc',
          offset: 0,
          mode: 'all',
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      });

      const data = response.data;
      
      // Extract future contests
      const futureContests = data.future_contests || [];
      const presentContests = data.present_contests || [];

      return [...presentContests, ...futureContests];
    } catch (error) {
      logger.error('CodeChef scraping error:', error);
      throw new Error('Failed to fetch CodeChef contests');
    }
  }

  /**
   * Format contest data to standard format
   */
  formatContest(contest: CodeChefContest) {
    return {
      name: contest.contest_name,
      platform: 'codechef',
      url: `${this.BASE_URL}/${contest.contest_code}`,
      startTime: contest.contest_start_date_iso,
      endTime: contest.contest_end_date_iso,
      duration: contest.contest_duration,
      status: 'upcoming',
      metadata: {
        contestCode: contest.contest_code,
      },
    };
  }

  /**
   * Get contest details
   */
  async getContestDetails(contestCode: string) {
    try {
      const response = await axios.get(
        `${this.BASE_URL}/api/contests/${contestCode}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error(`Error fetching CodeChef contest ${contestCode}:`, error);
      return null;
    }
  }
}
```

### Approach 2: Scrape CodeChef Contests Page with Puppeteer

```typescript
import puppeteer from 'puppeteer';
import { logger } from '../utils/logger';

export class CodeChefPuppeteerScraper {
  async scrapeContestsPage() {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      
      // Set user agent
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      );

      // Navigate to contests page
      await page.goto('https://www.codechef.com/contests', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for contest list to load
      await page.waitForSelector('.dataTable', { timeout: 10000 });

      // Extract contest data
      const contests = await page.evaluate(() => {
        const contestElements = document.querySelectorAll('.dataTable tbody tr');
        const results: any[] = [];

        contestElements.forEach((row) => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 4) {
            const code = cells[0]?.textContent?.trim();
            const name = cells[1]?.textContent?.trim();
            const start = cells[2]?.textContent?.trim();
            const end = cells[3]?.textContent?.trim();

            if (code && name) {
              results.push({ code, name, start, end });
            }
          }
        });

        return results;
      });

      return contests;
    } catch (error) {
      logger.error('CodeChef Puppeteer scraping error:', error);
      return [];
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
```

---

## Complete Implementation

### Unified Scraper Service

**File: `backend/src/scrapers/unifiedScraper.ts`**

```typescript
import { LeetCodeScraper } from './leetcodeScraper';
import { CodeforcesScraper } from './codeforcesScraper';
import { CodeChefScraper } from './codechefScraper';
import { logger } from '../utils/logger';
import { Contest } from '../models/Contest';

export interface StandardContest {
  name: string;
  platform: 'leetcode' | 'codeforces' | 'codechef';
  url: string;
  startTime: string;
  endTime: string;
  duration: string;
  status: string;
  metadata?: any;
}

export class UnifiedContestScraper {
  private leetcodeScraper: LeetCodeScraper;
  private codeforcesScraper: CodeforcesScraper;
  private codechefScraper: CodeChefScraper;

  constructor() {
    this.leetcodeScraper = new LeetCodeScraper();
    this.codeforcesScraper = new CodeforcesScraper();
    this.codechefScraper = new CodeChefScraper();
  }

  /**
   * Scrape all platforms
   */
  async scrapeAllPlatforms(): Promise<StandardContest[]> {
    const results: StandardContest[] = [];

    // Scrape LeetCode
    try {
      logger.info('Scraping LeetCode...');
      const leetcodeContests = await this.leetcodeScraper.fetchContests();
      const formatted = leetcodeContests.map((c) =>
        this.leetcodeScraper.formatContest(c)
      );
      results.push(...formatted);
      logger.info(`Found ${formatted.length} LeetCode contests`);
    } catch (error) {
      logger.error('LeetCode scraping failed:', error);
    }

    // Scrape Codeforces
    try {
      logger.info('Scraping Codeforces...');
      const codeforcesContests = await this.codeforcesScraper.fetchContests();
      const formatted = codeforcesContests.map((c) =>
        this.codeforcesScraper.formatContest(c)
      );
      results.push(...formatted);
      logger.info(`Found ${formatted.length} Codeforces contests`);
    } catch (error) {
      logger.error('Codeforces scraping failed:', error);
    }

    // Scrape CodeChef
    try {
      logger.info('Scraping CodeChef...');
      const codechefContests = await this.codechefScraper.fetchContests();
      const formatted = codechefContests.map((c) =>
        this.codechefScraper.formatContest(c)
      );
      results.push(...formatted);
      logger.info(`Found ${formatted.length} CodeChef contests`);
    } catch (error) {
      logger.error('CodeChef scraping failed:', error);
    }

    return results;
  }

  /**
   * Scrape specific platform
   */
  async scrapePlatform(
    platform: 'leetcode' | 'codeforces' | 'codechef'
  ): Promise<StandardContest[]> {
    switch (platform) {
      case 'leetcode': {
        const contests = await this.leetcodeScraper.fetchContests();
        return contests.map((c) => this.leetcodeScraper.formatContest(c));
      }
      case 'codeforces': {
        const contests = await this.codeforcesScraper.fetchContests();
        return contests.map((c) => this.codeforcesScraper.formatContest(c));
      }
      case 'codechef': {
        const contests = await this.codechefScraper.fetchContests();
        return contests.map((c) => this.codechefScraper.formatContest(c));
      }
      default:
        throw new Error(`Unknown platform: ${platform}`);
    }
  }

  /**
   * Save contests to database
   */
  async saveContests(contests: StandardContest[]) {
    const results = {
      inserted: 0,
      updated: 0,
      failed: 0,
    };

    for (const contest of contests) {
      try {
        const result = await Contest.findOneAndUpdate(
          { url: contest.url },
          contest,
          { upsert: true, new: true }
        );

        if (result) {
          results.updated++;
        } else {
          results.inserted++;
        }
      } catch (error) {
        logger.error(`Failed to save contest ${contest.name}:`, error);
        results.failed++;
      }
    }

    return results;
  }

  /**
   * Full scraping pipeline
   */
  async runScrapingPipeline() {
    const startTime = Date.now();
    logger.info('Starting contest scraping pipeline...');

    try {
      // Scrape all platforms
      const contests = await this.scrapeAllPlatforms();
      logger.info(`Total contests scraped: ${contests.length}`);

      // Save to database
      const saveResults = await this.saveContests(contests);
      logger.info('Save results:', saveResults);

      const executionTime = Date.now() - startTime;
      logger.info(`Pipeline completed in ${executionTime}ms`);

      return {
        success: true,
        contestsFound: contests.length,
        ...saveResults,
        executionTime,
      };
    } catch (error) {
      logger.error('Scraping pipeline failed:', error);
      throw error;
    }
  }
}
```

### Cron Job for Automated Scraping

**File: `backend/src/cron/scrapeContestsFromWebsites.ts`**

```typescript
import cron from 'node-cron';
import { UnifiedContestScraper } from '../scrapers/unifiedScraper';
import { logger } from '../utils/logger';

const scraper = new UnifiedContestScraper();

/**
 * Schedule contest scraping every 6 hours
 */
export function scheduleContestScraping(): void {
  // Run every 6 hours: at 00:00, 06:00, 12:00, 18:00
  cron.schedule('0 */6 * * *', async () => {
    logger.info('Running scheduled contest scraping from official websites...');
    
    try {
      const result = await scraper.runScrapingPipeline();
      logger.info('Scraping completed:', result);
    } catch (error) {
      logger.error('Scheduled scraping failed:', error);
    }
  });

  // Run immediately on startup
  logger.info('Running initial contest scraping...');
  scraper.runScrapingPipeline().catch((error) => {
    logger.error('Initial scraping failed:', error);
  });

  logger.info('Contest scraping scheduled: every 6 hours');
}
```

---

## Anti-Bot Protection Handling

### Using Playwright with Stealth Plugin

```bash
npm install playwright playwright-extra puppeteer-extra-plugin-stealth
```

**File: `backend/src/scrapers/stealthScraper.ts`**

```typescript
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { logger } from '../utils/logger';

// Add stealth plugin
chromium.use(StealthPlugin());

export class StealthScraper {
  /**
   * Scrape with anti-detection measures
   */
  async scrapeWithStealth(url: string) {
    let browser;
    try {
      browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
        ],
      });

      const context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'en-US',
        timezoneId: 'America/New_York',
      });

      const page = await context.newPage();

      // Navigate with realistic behavior
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Random delay to appear human
      await page.waitForTimeout(Math.random() * 2000 + 1000);

      // Extract data
      const content = await page.content();

      return content;
    } catch (error) {
      logger.error('Stealth scraping error:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Handle Cloudflare challenge
   */
  async bypassCloudflare(url: string) {
    let browser;
    try {
      browser = await chromium.launch({ headless: false }); // Use headful mode

      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(url);

      // Wait for Cloudflare challenge to complete
      await page.waitForSelector('body', { timeout: 60000 });

      // Check if challenge passed
      const title = await page.title();
      if (title.includes('Just a moment')) {
        logger.warn('Cloudflare challenge detected, waiting...');
        await page.waitForTimeout(10000);
      }

      return await page.content();
    } catch (error) {
      logger.error('Cloudflare bypass error:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
```

### Using Proxies and User-Agent Rotation

```typescript
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
];

const PROXIES = [
  'http://proxy1.example.com:8080',
  'http://proxy2.example.com:8080',
];

export function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export function getRandomProxy(): string {
  return PROXIES[Math.floor(Math.random() * PROXIES.length)];
}

export async function fetchWithProxy(url: string) {
  const proxy = getRandomProxy();
  const agent = new HttpsProxyAgent(proxy);

  return await axios.get(url, {
    httpsAgent: agent,
    headers: {
      'User-Agent': getRandomUserAgent(),
    },
  });
}
```

---

## Rate Limiting & Best Practices

### Implement Request Throttling

```typescript
import pLimit from 'p-limit';
import pRetry from 'p-retry';

export class RateLimitedScraper {
  private limit = pLimit(1); // 1 concurrent request
  private requestDelay = 2000; // 2 seconds between requests

  async scrapeWithRateLimit(urls: string[]) {
    const results = [];

    for (const url of urls) {
      const result = await this.limit(async () => {
        // Add delay
        await new Promise((resolve) => setTimeout(resolve, this.requestDelay));

        // Fetch with retry
        return await pRetry(
          async () => {
            const response = await axios.get(url);
            return response.data;
          },
          {
            retries: 3,
            minTimeout: 1000,
            maxTimeout: 5000,
            onFailedAttempt: (error) => {
              logger.warn(
                `Attempt ${error.attemptNumber} failed for ${url}. ${error.retriesLeft} retries left.`
              );
            },
          }
        );
      });

      results.push(result);
    }

    return results;
  }
}
```

### Respect robots.txt

```typescript
import robotsParser from 'robots-parser';
import axios from 'axios';

export async function checkRobotsTxt(url: string, userAgent: string) {
  try {
    const robotsUrl = new URL('/robots.txt', url).toString();
    const response = await axios.get(robotsUrl);
    
    const robots = robotsParser(robotsUrl, response.data);
    const isAllowed = robots.isAllowed(url, userAgent);

    if (!isAllowed) {
      logger.warn(`Scraping ${url} is disallowed by robots.txt`);
    }

    return isAllowed;
  } catch (error) {
    // If robots.txt doesn't exist, assume allowed
    return true;
  }
}
```

---

## Error Handling

### Comprehensive Error Handler

```typescript
export class ScraperError extends Error {
  constructor(
    message: string,
    public platform: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ScraperError';
  }
}

export function handleScraperError(error: any, platform: string) {
  if (error.response) {
    // HTTP error
    const status = error.response.status;
    
    if (status === 429) {
      return new ScraperError(
        'Rate limit exceeded',
        platform,
        'RATE_LIMIT',
        true
      );
    } else if (status === 403) {
      return new ScraperError(
        'Access forbidden (possible anti-bot)',
        platform,
        'FORBIDDEN',
        true
      );
    } else if (status >= 500) {
      return new ScraperError(
        'Server error',
        platform,
        'SERVER_ERROR',
        true
      );
    }
  } else if (error.code === 'ECONNREFUSED') {
    return new ScraperError(
      'Connection refused',
      platform,
      'CONNECTION_ERROR',
      true
    );
  } else if (error.code === 'ETIMEDOUT') {
    return new ScraperError(
      'Request timeout',
      platform,
      'TIMEOUT',
      true
    );
  }

  return new ScraperError(
    error.message || 'Unknown error',
    platform,
    'UNKNOWN',
    false
  );
}
```

---

## Testing

### Unit Tests

```typescript
import { LeetCodeScraper } from '../leetcodeScraper';
import { CodeforcesScraper } from '../codeforcesScraper';
import { CodeChefScraper } from '../codechefScraper';

describe('Web Scrapers', () => {
  describe('LeetCodeScraper', () => {
    it('should fetch contests from LeetCode', async () => {
      const scraper = new LeetCodeScraper();
      const contests = await scraper.fetchContests();

      expect(Array.isArray(contests)).toBe(true);
      if (contests.length > 0) {
        expect(contests[0]).toHaveProperty('title');
        expect(contests[0]).toHaveProperty('startTime');
      }
    }, 30000);
  });

  describe('CodeforcesScraper', () => {
    it('should fetch contests from Codeforces', async () => {
      const scraper = new CodeforcesScraper();
      const contests = await scraper.fetchContests();

      expect(Array.isArray(contests)).toBe(true);
      if (contests.length > 0) {
        expect(contests[0]).toHaveProperty('name');
        expect(contests[0]).toHaveProperty('phase');
      }
    }, 30000);
  });

  describe('CodeChefScraper', () => {
    it('should fetch contests from CodeChef', async () => {
      const scraper = new CodeChefScraper();
      const contests = await scraper.fetchContests();

      expect(Array.isArray(contests)).toBe(true);
      if (contests.length > 0) {
        expect(contests[0]).toHaveProperty('contest_name');
        expect(contests[0]).toHaveProperty('contest_code');
      }
    }, 30000);
  });
});
```

---

## API Routes

**File: `backend/src/routes/scraper.ts`**

```typescript
import express from 'express';
import { UnifiedContestScraper } from '../scrapers/unifiedScraper';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();
const scraper = new UnifiedContestScraper();

// Trigger manual scraping
router.post('/scrape', authenticate, async (req, res) => {
  try {
    const result = await scraper.runScrapingPipeline();
    res.json(result);
  } catch (error) {
    logger.error('Manual scraping error:', error);
    res.status(500).json({ error: 'Scraping failed' });
  }
});

// Scrape specific platform
router.post('/scrape/:platform', authenticate, async (req, res) => {
  try {
    const { platform } = req.params;
    
    if (!['leetcode', 'codeforces', 'codechef'].includes(platform)) {
      return res.status(400).json({ error: 'Invalid platform' });
    }

    const contests = await scraper.scrapePlatform(
      platform as 'leetcode' | 'codeforces' | 'codechef'
    );
    
    const saveResults = await scraper.saveContests(contests);

    res.json({
      platform,
      contestsFound: contests.length,
      ...saveResults,
    });
  } catch (error) {
    logger.error(`Platform scraping error [${req.params.platform}]:`, error);
    res.status(500).json({ error: 'Scraping failed' });
  }
});

export default router;
```

---

## Summary

### ✅ What You've Learned

1. **Three scraping methods**: API endpoints, HTML parsing, headless browsers
2. **Platform-specific implementations**:
   - LeetCode: GraphQL API
   - Codeforces: Official Public API
   - CodeChef: Internal API endpoint
3. **Anti-bot protection**: Stealth plugins, proxies, user-agent rotation
4. **Best practices**: Rate limiting, error handling, testing
5. **Production-ready code**: Unified scraper, cron jobs, API routes

### 🎯 Recommended Approach

**Hybrid Strategy** (Best of both worlds):

1. **Primary**: Use official/unofficial APIs when available
   - Codeforces: Official API ✅
   - LeetCode: GraphQL API ✅
   - CodeChef: Internal API ✅

2. **Fallback**: HTML scraping with Puppeteer for when APIs fail

3. **Backup**: Third-party APIs (Kontests.net) as last resort

### 🚀 Next Steps

1. Implement the unified scraper
2. Set up cron jobs for automated scraping
3. Add monitoring and alerting
4. Test thoroughly
5. Deploy to production

---

**Happy Scraping! 🕷️**
