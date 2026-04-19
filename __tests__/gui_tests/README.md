# StatusVault Playwright E2E Test Suite

Automated end-to-end tests covering all 44 scenarios from the test guide.

## What's automated vs manual

| Category | Tests | Status |
|---|---|---|
| Guest mode | TC-G-01 to TC-G-11 | ✅ All automated |
| Free account | TC-F-03 to TC-F-11 | ✅ Automated |
| Free — magic link login | TC-F-01 | ⚠️ Manual (needs email inbox) |
| Free — Google OAuth | TC-F-02 | ⚠️ Manual (needs Google account) |
| Premium | TC-P-01 to TC-P-03, P-05, P-07, P-08 | ✅ Automated |
| Premium — cloud sync | TC-P-04 | ⚠️ Manual (needs Supabase credentials) |
| Premium — PDF print | TC-P-06 | ⚠️ Manual (browser print dialog) |
| Account management | TC-A-01, TC-A-02 | ✅ Automated |
| Account — delete account | TC-A-03 | ⚠️ Manual (destructive, permanent) |
| Edge cases | TC-E-01 to TC-E-12 | ✅ All automated |

**38 of 44 tests are fully automated.**

## How it works

Auth is bypassed entirely by injecting Zustand state directly into
`localStorage` before each test. The app reads this on hydration and
behaves as if a real user logged in. No Supabase credentials needed.

## Setup

```bash
# 1. Clone / copy this folder somewhere
cd statusvault-e2e

# 2. Install dependencies
npm install

# 3. Install Playwright browsers (one-time)
npx playwright install chromium
```

## Running tests

```bash
# Run all tests (headless, fast)
npm test

# Run against a specific URL (default: https://www.statusvault.org)
SV_URL=http://localhost:8081 npm test

# Run just one section
npm run test:guest
npm run test:free
npm run test:premium
npm run test:edge

# See tests running in browser
npm run test:headed

# Interactive Playwright UI (best for debugging)
npm run test:ui

# View HTML report after a run
npm run report
```

## File structure

```
statusvault-e2e/
  playwright.config.ts      — config (URL, browsers, timeouts)
  tests/
    helpers/
      state.ts              — inject state, factories, helpers
    guest.spec.ts           — TC-G-01 to TC-G-11
    free.spec.ts            — TC-F-01 to TC-F-11
    premium.spec.ts         — TC-P-01 to TC-P-08
    edge.spec.ts            — TC-E-01 to TC-E-12
```

## CI — GitHub Actions

Add this to `.github/workflows/e2e.yml` to run on every push:

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm install
        working-directory: statusvault-e2e
      - run: npx playwright install --with-deps chromium
        working-directory: statusvault-e2e
      - run: npm test
        working-directory: statusvault-e2e
        env:
          SV_URL: https://www.statusvault.org
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: statusvault-e2e/playwright-report/
```
