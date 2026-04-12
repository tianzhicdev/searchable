# Icon Organization

Production-ready icons live under semantic folders inside this directory. Existing app code should continue importing from the root barrel:

```js
import { coinDollar, closeX, floppyDisk } from '../../assets/images/icons';
```

Use category-level imports only when they make a new icon-heavy module easier to read:

```js
import { coinDollar, walletCircuit } from '../../assets/images/icons/commerce';
```

## Folder Map

| Folder | Use for | Typical exports |
| --- | --- | --- |
| `avatars/` | Characters, profile, mascot-style identity art | `profileUser`, `robotPixel`, `catPixel` |
| `commerce/` | Pricing, balances, payments, rewards, donations | `coinDollar`, `coinEthereum`, `walletCircuit`, `diamondGem` |
| `controls/` | Search, close/remove, pointer/cursor actions | `closeX`, `compassSearch`, `cursorPointer`, `cursorArrowGradient` |
| `navigation/` | Dashboard, windows, menu/navigation surfaces | `browserWindowsOk`, `browserWindowsBlue`, `gridDashboard`, `menuBars` |
| `nature/` | Atmospheric background accents and calm auth/onboarding art | `cloud`, `cloudCool`, `moonCrescent` |
| `objects/` | Physical UI metaphors and conversational props | `floppyDisk`, `chatBubble`, `dialogBox`, `cassetteTape` |
| `shapes/` | Abstract geometric accents | `cubeGradient`, `pyramidGradient`, `spherePyramid` |
| `smileys/` | Empty states, playful reactions, onboarding emotion | `smileyHappy`, `smileyDizzy`, `smileyWinking` |
| `sparkles/` | Highlights, rewards, positive accents, decorative motion | `sparkleStarPurple`, `sparkleFourMagenta`, `sparkleGradientLarge` |
| `system/` | Status, security, connectivity, verification, progress | `checkmark`, `padlock`, `networkNodes`, `progressBarHalf` |
| `legacy/` | Duplicate or alias assets kept for reference only | not exported |
| `source/extracted/` | Raw extracted artwork before promotion into a production folder | not exported |

## Recommended Usage List

| Need | Prefer |
| --- | --- |
| Search or discovery CTA | `compassSearch` |
| Close, delete, remove, dismiss | `closeX` |
| Upload or add media/file | `cloudCool` |
| Download, save, copy, file attachment | `floppyDisk` |
| Profile/avatar placeholder | `profileUser` |
| Dashboard or storefront entry point | `browserWindowsOk` |
| Secondary dashboard/navigation icon | `browserWindowsBlue` or `gridDashboard` |
| Default fiat price display | `coinDollar` |
| Crypto-specific amount or refill flow | `coinEthereum` |
| Fallback generic currency/value token | `coinGeneric` |
| Wallet, refill, payment CTA | `walletCircuit` |
| Donation/support affordance | `heartPixel` |
| Reward, premium, badge, value highlight | `diamondGem` or `sparkleStarPurple` |
| Positive accent or add-state highlight | `sparkleFourMagenta` |
| Success or verification state | `checkmark` |
| Error or empty-state mood | `smileyDizzy` |
| Friendly success or onboarding encouragement | `smileyHappy` or `smileyWinking` |
| Progress or growth indicator | `progressBarHalf` or `percentGrowth` |

## Rules

- Prefer the canonical exported names above over `legacy/` aliases.
- Promote any new approved icon into the right production folder and export it from that folder's `index.js`.
- Keep `source/extracted/` as staging material only. Do not import directly from it in app code.
- If an icon is being reused across multiple screens, add it to the root barrel instead of importing the PNG by path.
