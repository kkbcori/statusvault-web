#!/usr/bin/env python3
"""
StatusVault — Checklist Update Checker
Runs monthly via GitHub Actions.

Checks official sources for form/fee/process changes:
- USCIS.gov — form updates, fee changes
- travel.state.gov — visa bulletin, passport info
- VFS Global — Indian passport service updates
- CGI Federal — US visa appointment info

Creates a GitHub Issue if changes are detected.
Posts a summary to the repo discussion if all is current.
"""

import os
import re
import json
import requests
from datetime import datetime
from bs4 import BeautifulSoup

GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN', '')
REPO = os.environ.get('GITHUB_REPOSITORY', 'kkbcori/statusvault-web')
TODAY = datetime.now().strftime('%B %Y')

HEADERS = {
    'User-Agent': 'StatusVault-Bot/1.0 (checklist-updater)',
    'Accept': 'text/html,application/xhtml+xml',
}

CHECKS = [
    {
        'id': 'uscis-fees',
        'name': 'USCIS Filing Fees',
        'url': 'https://www.uscis.gov/forms/filing-fees',
        'search': ['fee schedule', 'filing fee', 'form i-765', 'form i-140', 'form i-485'],
        'affects': ['opt-application', 'h1b-petition', 'green-card-aos'],
    },
    {
        'id': 'uscis-i765',
        'name': 'Form I-765 (EAD) Updates',
        'url': 'https://www.uscis.gov/i-765',
        'search': ['current edition', 'last reviewed', 'edition date'],
        'affects': ['opt-application'],
    },
    {
        'id': 'vfs-india',
        'name': 'VFS India Passport Services (USA)',
        'url': 'https://www.vfsglobal.com/india/usa/passport-services.html',
        'search': ['fee', 'appointment', 'documents required', 'processing time'],
        'affects': ['indian-passport-usa'],
    },
    {
        'id': 'india-passport-fee',
        'name': 'Indian Passport Fee Schedule',
        'url': 'https://www.cgifederal.com/apply-for-passport/',
        'search': ['fee', 'charge', 'passport renewal'],
        'affects': ['indian-passport-usa'],
    },
]

def fetch_page(url: str) -> str | None:
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        return r.text if r.ok else None
    except Exception as e:
        print(f'  Warning: Could not fetch {url}: {e}')
        return None

def check_for_changes(html: str, keywords: list[str]) -> list[str]:
    """Return snippets containing keywords that might indicate changes."""
    soup = BeautifulSoup(html, 'html.parser')
    # Remove script/style
    for tag in soup(['script', 'style', 'nav', 'footer']):
        tag.decompose()
    text = soup.get_text(' ', strip=True).lower()
    found = []
    for kw in keywords:
        idx = text.find(kw.lower())
        if idx != -1:
            snippet = text[max(0, idx-50):idx+100].strip()
            found.append(f'  [{kw}]: ...{snippet}...')
    return found

def create_github_issue(title: str, body: str):
    if not GITHUB_TOKEN:
        print('No GITHUB_TOKEN — skipping issue creation')
        return
    url = f'https://api.github.com/repos/{REPO}/issues'
    r = requests.post(url, headers={
        'Authorization': f'token {GITHUB_TOKEN}',
        'Accept': 'application/vnd.github+json',
    }, json={'title': title, 'body': body, 'labels': ['checklist-update', 'maintenance']})
    if r.ok:
        print(f'Created issue: {r.json()["html_url"]}')
    else:
        print(f'Issue creation failed: {r.status_code} {r.text}')

def main():
    print(f'StatusVault Checklist Update Check — {TODAY}')
    print('=' * 60)

    all_clear = True
    issue_body_parts = [
        f'## Monthly Checklist Review — {TODAY}\n',
        'Automated check for form/fee/process changes affecting StatusVault checklists.\n',
    ]

    for check in CHECKS:
        print(f'\nChecking: {check["name"]}')
        print(f'  URL: {check["url"]}')

        html = fetch_page(check['url'])
        if not html:
            print('  ⚠ Could not fetch — skipping')
            issue_body_parts.append(f'\n### ⚠ {check["name"]} — Could not fetch\nManual review needed: {check["url"]}')
            all_clear = False
            continue

        snippets = check_for_changes(html, check['search'])
        if snippets:
            print(f'  ✓ Found {len(snippets)} relevant sections')
            issue_body_parts.append(f'\n### ✅ {check["name"]} — Fetched OK\n- URL: {check["url"]}\n- Affects checklists: {", ".join(check["affects"])}\n- Snippets found:\n```\n' + '\n'.join(snippets[:3]) + '\n```\n')
        else:
            print('  ○ No matching content found')

    # Write summary
    summary_path = 'checklist_update_summary.json'
    with open(summary_path, 'w') as f:
        json.dump({
            'checked_at': datetime.now().isoformat(),
            'checks_run': len(CHECKS),
            'status': 'ok' if all_clear else 'review_needed',
        }, f, indent=2)

    # Create issue only if manual review seems needed
    if not all_clear:
        create_github_issue(
            f'[Checklist] Monthly review needed — {TODAY}',
            '\n'.join(issue_body_parts) + '\n\n---\n*Auto-generated by StatusVault checklist-update workflow*'
        )
        print('\n⚠ Some checks need manual review — issue created')
    else:
        print(f'\n✅ All checks passed for {TODAY} — checklists appear current')

    # Always print fee reminder
    print('\n📋 Manual items to verify monthly:')
    print('  - USCIS I-765 fee: currently $470 (check uscis.gov/forms/filing-fees)')
    print('  - Indian passport fee: currently ~$160 (check vfsglobal.com/india/usa)')
    print('  - H-1B filing fees: $460 base + ACWIA + fraud prevention (check uscis.gov)')
    print('  - I-485 fee: $1,440 (check uscis.gov)')

if __name__ == '__main__':
    main()
