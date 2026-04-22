# Icons Integration — Apply Instructions

## What's in this zip

Six modified screen files that wire up all 18 illustrated icons from `assets/icons/` into the UI.

```
src/screens/
├── DashboardScreen.tsx   (6 AppIcon usages: 3 empty states + profile chip + mobile variant)
├── ChecklistScreen.tsx   (1 AppIcon: main empty state)
├── CounterScreen.tsx     (1 AppIcon: main empty state)
├── DocumentsScreen.tsx   (1 AppIcon: main empty state)
├── TravelScreen.tsx      (1 AppIcon: "No trips recorded" empty state)
└── HelpScreen.tsx        (3 AppIcons in new "Featured tips" row)
```

## Apply

```bash
cd statusvault-web
unzip -o icons-integration.zip

# One additional step — delete the dead StatusCard.tsx component
# (referenced `travel` icon but was never imported anywhere)
rm -f src/components/StatusCard.tsx
```

## Git commit

```bash
git add src/screens/ src/components/
git commit -m "Wire up all 18 illustrated icons into empty states and profile chip

Before: only 8/18 icons used (visa profile picker modal)
After:  18/18 icons used

Changes:
- Dashboard: expiry icon for deadlines empty state (web+mobile),
  checklist for checklist empty, timer for timers empty
- Dashboard: profile chip now shows the user's visa's own icon
  (visa_approved / passport_card / travel_plane / etc.) instead
  of a generic shield, dynamically based on visaProfile state
- ChecklistScreen: checklist2 in main empty state
- CounterScreen: timer2 in main empty state
- DocumentsScreen: passport icon replaces 📂 emoji
- TravelScreen: travel icon replaces ✈️ emoji; also fixed stale
  light #F0FDFF bg on addresses empty state → rgba(91,154,245,0.14)
- HelpScreen: new 'Featured tips' row with passport2 / calendar /
  interview icons on three cards: Renew Early / Mark Deadlines /
  Prepare Early
- Deleted dead StatusCard.tsx component (never imported anywhere)
"
git push origin main
```

## Icon usage map (final)

| Icon | Used in |
|---|---|
| `visa_approved`, `application`, `visa`, `visa2`, `passport_card`, `travel_plane`, `biometrics`, `travel2` | Visa profile picker **+** Dashboard profile chip (dynamic) |
| `expiry` | Dashboard deadlines empty state |
| `checklist` | Dashboard checklist empty state |
| `timer` | Dashboard timers empty state |
| `checklist2` | ChecklistScreen empty state |
| `timer2` | CounterScreen empty state |
| `passport` | DocumentsScreen empty state |
| `travel` | TravelScreen trips empty state |
| `passport2` | HelpScreen — "Renew Early" tip |
| `calendar` | HelpScreen — "Mark Deadlines" tip |
| `interview` | HelpScreen — "Prepare Early" tip |

All 18 icons in `src/utils/icons.ts` are now rendered somewhere in the UI.
