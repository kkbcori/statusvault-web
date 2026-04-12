#!/usr/bin/env python3
"""
StatusVault — Immigration Link Health Checker
Checks all government links in VisaToolsScreen.tsx and reports broken/redirected ones.
Run manually: python3 scripts/check_links.py
Or via GitHub Action: runs automatically on the 1st of every month.
"""

import re
import sys
import json
import urllib.request
import urllib.error
from datetime import datetime

VISA_TOOLS_FILE = "src/screens/VisaToolsScreen.tsx"

def extract_links(filepath: str) -> list[dict]:
    """Extract all URL/label pairs from VisaToolsScreen.tsx"""
    with open(filepath, "r") as f:
        content = f.read()

    pattern = r"\{\s*label:\s*'([^']+)',\s*url:\s*'([^']+)',\s*desc:\s*'([^']+)'\s*\}"
    matches = re.findall(pattern, content)
    return [{"label": m[0], "url": m[1], "desc": m[2]} for m in matches]

def check_url(url: str, timeout: int = 10) -> dict:
    """Check a single URL — returns status, redirect, and latency."""
    import time
    start = time.time()
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 StatusVault-LinkChecker/1.0"},
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            latency_ms = int((time.time() - start) * 1000)
            final_url = resp.geturl()
            redirected = final_url.rstrip("/") != url.rstrip("/")
            return {
                "status": resp.status,
                "ok": True,
                "redirected": redirected,
                "final_url": final_url if redirected else None,
                "latency_ms": latency_ms,
            }
    except urllib.error.HTTPError as e:
        return {"status": e.code, "ok": False, "error": str(e)}
    except urllib.error.URLError as e:
        return {"status": None, "ok": False, "error": str(e.reason)}
    except Exception as e:
        return {"status": None, "ok": False, "error": str(e)}

def main():
    print(f"\n{'='*60}")
    print(f"  StatusVault Link Checker — {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}")
    print(f"{'='*60}\n")

    links = extract_links(VISA_TOOLS_FILE)
    print(f"Found {len(links)} links to check...\n")

    results = []
    broken = []
    redirected = []

    for link in links:
        print(f"  Checking: {link['url'][:65]}", end="", flush=True)
        result = check_url(link["url"])
        results.append({**link, **result})

        if result["ok"]:
            if result.get("redirected"):
                redirected.append(link)
                print(f"  ↪  REDIRECT → {result['final_url'][:50]}")
            else:
                print(f"  ✅ {result['status']} ({result.get('latency_ms', '?')}ms)")
        else:
            broken.append(link)
            print(f"  ❌ {result.get('status', 'ERR')} — {result.get('error', '')[:40]}")

    # Summary
    print(f"\n{'='*60}")
    print(f"  SUMMARY")
    print(f"{'='*60}")
    print(f"  Total:      {len(links)}")
    print(f"  ✅ OK:      {len(links) - len(broken) - len(redirected)}")
    print(f"  ↪ Redirect: {len(redirected)}")
    print(f"  ❌ Broken:  {len(broken)}")

    if broken:
        print(f"\n  BROKEN LINKS — update VisaToolsScreen.tsx:")
        for link in broken:
            print(f"    ❌ {link['label']}")
            print(f"       {link['url']}")

    if redirected:
        print(f"\n  REDIRECTED LINKS — consider updating to final URL:")
        for item in [r for r in results if r.get("redirected")]:
            print(f"    ↪ {item['label']}")
            print(f"       FROM: {item['url']}")
            print(f"       TO:   {item['final_url']}")

    # Write JSON report
    report_path = "scripts/link_check_report.json"
    with open(report_path, "w") as f:
        json.dump({
            "checked_at": datetime.now().isoformat(),
            "total": len(links),
            "broken_count": len(broken),
            "redirect_count": len(redirected),
            "results": results,
        }, f, indent=2)
    print(f"\n  Report saved: {report_path}")

    # Exit with error if broken links found (so GitHub Action fails visibly)
    if broken:
        print(f"\n  ⚠️  Action required: {len(broken)} broken link(s) need updating.")
        sys.exit(1)
    else:
        print(f"\n  All links healthy ✅")
        sys.exit(0)

if __name__ == "__main__":
    main()
