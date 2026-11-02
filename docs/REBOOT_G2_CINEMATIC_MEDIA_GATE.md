# LAST SIGNAL REBOOT — G2 Cinematic Media Gate

Date: 2026-11-02. Scope: /reboot/ only. Legacy root game remains untouched.

## Real media status (not inferred)

**G2 renderer implemented. Photographic originals and actor-action videos NOT produced.**
Four specific image-generation submissions were rejected because the connected image account had no remaining credits. A generated promotional composite was rejected as unsuitable: it has fake UI text and incorrect roles and is not four independently shot scenes.

| Scene | Real individual still | Distinct on-screen fallback |
|---|---|---|
| p0 | Missing | Nighttime Korean investigative newsroom |
| p1 | Missing | Reporter correction/evidence desk |
| p2 | Missing | Rainy office rooftop / anonymous caller |
| p3 | Missing | Fictional coastal harbor memorial in the morning |

Other scene originals: 75 missing. Actual standalone stills: 0/79. Actual action clips: 0/8.
Legacy G1 approved reference faces are not reboot scene stills. Existing fallback sets are HTML/CSS scenery, not photorealistic actors or motion footage.

## Implemented media behavior

- Scene-id manifest covering all 79 reboot scenes, with explicit pending states.
- Image files are requested only after explicit approval, matching local path and 64-digit SHA-256 metadata; absent images create zero requests.
- Asynchronous image preloading guards against stale display; the preceding scene picture disappears at the scene boundary.
- Four unique p0–p3 atmospheric fallback compositions, labeled as such.
- Actual video requires an independently verified poster and local video; plays once, muted and inline, with end/error/navigation/visibility stop, reduced-motion and data-saver fallback.
- No external AI or live image/video call during gameplay. Existing save key, story branches and 5 endings unchanged.

## Minimum release gate for each image

1. Create P0/P1/P2/P3 as FOUR independently rendered, separate 16:9 Korean live-action film stills, one unique location and action each; no collage recrops. Recommended at least 1536x864.
2. Visually inspect physical reality, independent composition, all approved-character facial identities where present. For these four scenes, avoid visible identifiable faces. Never fabricate fake subtitles, text or game UI within images.
3. Commit real WebP bytes under reboot/media/scenes/[scene-id].webp, record SHA-256 of those actual bytes, and verify Github file presence. Never set approved=true for a missing file.
4. Update the specific entry in reboot/media/manifest.js with its real local image path, approved:true and exact sha256.
5. Pass automated tests and inspect on actual Android Chrome: real visual loading and 4 independent shots, no stale image, scrolling and choice visibility, offline loading and V1 save compatibility.

## Motion candidates (not yet delivered)

c04-a (윤서아 rescue boat), c05-b (박소연 protects survivor), c07-a (한지유 editorial pressure), c08-a (이나경 hands over storage drive), c09-a (윤서아 listens to VHF logs), c11-a (이나경 validates data), c14-a (한지유 prepares broadcast), c14-o (transmission light).
Each future clip must be a distinct real contextual action, 3–5 seconds, with verified corresponding poster and local WebM/MP4. No Ken Burns zoom falsely labeled action footage.

## Automated checks

- node scripts/test-reboot.mjs
- node scripts/test-reboot-cinema.mjs
- node --check reboot/cinema.js

The second test covers 79 scene contracts, 4 unique placeholders, absence of missing-file network requests, positive synthetic still load, stale load prevention and video safety/low power behavior.
**G2 VISUAL PRODUCTION IS NOT COMPLETE** until four original real film stills are committed, visually reviewed, verified and shown correctly in a browser.
