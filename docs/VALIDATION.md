# Validation record / 验证记录

Local validation completed on 2026-10-09 (Asia/Shanghai). These results describe the delivered source, not a hosted deployment.

| Check                       | Result                                                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Dependency installation     | `npm install` and a fresh `npm ci` succeeded using the included lockfile                                         |
| TypeScript                  | Passed through `npm run build` (`tsc --noEmit`)                                                                  |
| Prettier                    | `npm run format:check` passed                                                                                    |
| ESLint                      | `npm run lint` passed                                                                                            |
| Unit tests                  | 47 tests passed across 4 files                                                                                   |
| Production build            | `npm run build` passed; page chunks split; no oversized-chunk warning                                            |
| Production dependency audit | `npm audit --omit=dev` found 0 vulnerabilities                                                                   |
| Frontend credential scan    | No `STEAM_API_KEY` or test credential string in browser build output                                             |
| Demo                        | 50 games, 30 played, 20 unplayed, 60% exploration; charts match fixture calculations                             |
| Desktop browser             | Production homepage, dashboard and lazy-loaded share page rendered successfully with no error/warning logs       |
| Mobile browser              | 390×844 viewport, dashboard document width and scroll width both 390; no horizontal overflow                     |
| Language and settings       | Chinese/English, dark/light and animation switch verified; preferences persisted after reload                    |
| Random picker               | Animation and unplayed result verified; custom 2000–3000 hour pool correctly returned empty and disabled drawing |
| Portrait and backlog        | Ordered localized rules expanded; roast/normal copy switched using fixture statistics                            |
| PNG export                  | Dark, Cyberpunk and Minimal actually downloaded; PNG is 1200×720 and includes the demo avatar                    |
| Clipboard                   | Actual image copy succeeded in the local browser; browser support/permission fallback is implemented             |
| Missing key                 | Local server returned HTTP 503 with `NOT_CONFIGURED`; browser displayed the reason without switching to demo     |
| Store metadata              | Local server fetched actual category labels for app IDs 730, 570 and 1245620                                     |

## Automated coverage

Statistics cover empty libraries, every time-bin boundary, minutes-to-hours precision, median/average, ranking immutability and absent favorites. Recommendation tests cover filter boundaries and empty pools. Portrait tests cover rule ordering and fallback. Genre tests cover unknown metadata and duplicate labels.

Input tests cover SteamID64, standard and vanity URLs, invalid hosts, credentials, ports, paths and malformed IDs.

API boundary tests use mocked upstream responses. They cover missing/rejected credentials, real-mode flag preservation, private profiles and game details, missing/all-zero playtime, empty/partial libraries, optional API failure, vanity resolution, concurrent-query coalescing, cache expiration, metadata cache/failure, per-instance rate limits, timeout aborts, method/batch limits and safe avatar proxy behavior.

## Not executed

- A hosted real-player query after Vercel deployment: local authenticated lookup is now verified, but hosted verification still requires deployment.
- A Vercel deployment: deployment configuration and bilingual instructions are included; no hosted deployment is claimed.
- Cross-instance/global rate limiting: this project intentionally uses bounded warm-instance memory caches and guards, with platform limits recommended for large deployments.

Screenshots and exported cards in `docs/screenshots/` are captured outputs from the labeled demo, not images of a real player.

## 2026-10-09 lookup guide update

Added an expandable Chinese/English guide below the search input: browser/client profile URL copying, other-player lookup, accepted ID formats and privacy requirements. TypeScript, ESLint, all 42 existing tests and the production build passed again. No new calculation or API behavior changed. Browser UI verification of this update could not complete because the connected browser's page observations repeatedly timed out. No screenshot of the new guide is claimed.

A private `.env.local` file has been prepared and is ignored by Git and excluded from the source ZIP. At that stage, the Steam key was empty pending the user's official Steam login/key setup. That historical state has since been superseded by the live-key verification below.

## Live-key verification update

After the user supplied a Steam Web API key, it was saved only in the ignored private `.env.local` file (0600). The key was confirmed valid against the official player-summary endpoint. Direct Node.js requests timed out while the existing local HTTP proxy succeeded. Added an optional server-only `STEAM_PROXY_URL` transport using a reusable Undici ProxyAgent; no system proxy settings were changed.

A subsequent local `/api/library` request returned HTTP 200, `demo=false`, a complete 79-game library and no optional-data warnings. No real player response or identifier is included in the public source or demo fixtures. New transport tests check direct mode, proxy dispatcher reuse, abort/redirect preservation and unsupported protocols. The previously recorded empty-key state is historical and no longer current.

## Current verification after network integration

- All 47 tests passed across four files, including proxy selection and bounded same-hash official avatar-host retries.
- ESLint, TypeScript and the production build passed.
- Repeated live local query returned HTTP 200, `demo=false`, 79 games, 5,184.3 total hours, level 10, two recently played games and zero warnings.
- Default avatar CDN connections failed with TLS connection termination on the current network; the official Akamai host returned the identical hash-addressed avatar. The avatar endpoint now returned HTTP 200, `image/jpeg`, 21,179 bytes and valid JPEG signature. Redirects remain rejected; one alternate attempt shares the same 12-second timeout.
- Actual browser observation now works. Expanded ID guide and real-player Dashboard were verified visibly, including real-data label, statistics and privacy instructions. Earlier browser observation timeouts describe the earlier attempt.

- Real-player Dark card rendered in the browser and was actually downloaded as a valid 1200×720 PNG. The real-player PNG and proof screenshot are saved separately outside the public source ZIP. Demo screenshots remain the only screenshots in the repository.

## Open-source publication

Public repository: https://github.com/Jamyouny/SteamScope. Publication candidate contains 55 files under MIT, with six Demo screenshots/cards. Live credentials, private environment files and real-player screenshots are excluded. GitHub Actions [run 37952568142](https://github.com/Jamyouny/SteamScope/actions/runs/37952568142) completed successfully for the first full-source publication commit. GitHub verified dependency installation, TypeScript, ESLint, all unit tests, production build and formatting on Node.js 22. This hosted CI result is separate from the local checks recorded above.
