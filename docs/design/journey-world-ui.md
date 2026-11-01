# Kids Journey illustrated station worlds

The approved illustrated 3D town concepts are now local Journey backgrounds. This is layered game artwork with native interactive controls, not a full polygon-modelled world or a screenshot used as the entire interface. The header, subject selector, real topics, progress, concept navigation, car and next-cloud gate are React UI.

Five worlds: Geometry Gardens (Maths), Storybook Borough (English), Circuit City (Computer), Wildleaf Reserve (EVS), Discovery Harbour (General Awareness). Each map asset is cleaned of baked-in labels, numbers and the car. Real CMS names and availability are layered over ten station positions. Placeholder stations say Coming soon and cannot open a fabricated topic.

The existing child + Nova car image moves along a separately sampled road for each scene, with idle movement, exhaust puffs and gentle water highlights. Manual station selection drives to its actual topic before using the existing concept URL. Verified completion still controls automatic travel and next-cloud access. Pausing decorative motion and reduced-motion preferences are respected. Subject changes preserve the page and preload the other lightweight artwork without WebGL setup.

The map fills its box without cropping its ten stops. The compact desktop header gives the artwork more room. Mobile retains the subject strip, compact progress, map/list switch and action bar. No outer page scroll was added.

The same existing API reads provide real topic IDs, canonical names and progress. No APIs were created, no backend or database files changed, and no data was fabricated. Display-only snapshots remain child scoped and cannot unlock a cloud until reverified.

Validation: production build, 58 integration tests and 42 targeted Journey/catalog/resource/road/bypass/access tests pass. A regression check ensures confirmed unpublished subjects cannot display old clickable topics from the cache. Browser access is disabled in Work settings, so final rendered layout, pointer interactions, car travel on the illustrations and responsive behaviour still need a browser pass. No millisecond-loading measurement or UI screenshot is claimed. The user approved committing and pushing these frontend changes on 1 November 2026. No direct Vercel deployment is part of this change.

## Artwork

Generated using the built-in imagegen tool, then encoded as WebP for local use. All assets are stored in public/art/journey/worlds. The five full backgrounds total about 2.35 MB; warm subject switching reuses loaded images. Network/API response times still apply to actual curriculum reads.

- Maths: maths-town-v1.webp, maths-thumb-v1.webp
- English: literacy-town-v1.webp, literacy-thumb-v1.webp
- Computer: computer-town-v1.webp, computer-thumb-v1.webp
- EVS: evs-town-v1.webp, evs-thumb-v1.webp
- General Awareness: general-town-v1.webp, general-thumb-v1.webp

The common final asset prompt was: “Create a reusable game MAP BACKGROUND asset by extracting ONLY the illustrated town map, entirely removing the surrounding application UI. Preserve the same detailed 3D rendered world, all ten learning-station buildings in their existing positions, the same road layout, vegetation, materials, lighting, decorative roof sculptures, water, scenery and phase arch gateway. Remove every text label, station number badge, lock icon, Coming soon plate, title, location pin and button. Replace removed signs with clean blank dimensional signboards. Remove the child, robot, car and exhaust smoke completely, inpainting the road underneath. Keep all ten buildings in the same composition. No text or numbers. The car and interactive labels are layered over it in code.”

This prompt was applied separately to each of the five subject concept images. Source images remain in C:/Users/Vansh/.codex/generated_images/01a18c1b-b373-7053-a95c-43c6188876dc. Clean source outputs: Maths exec-22fd86be-7ae9-4f48-a977-27056b7f6fbd.png; English exec-6e088127-2c8d-408a-a4d6-7a53b598a663.png; Computer exec-7fedbe1c-494c-4103-8fb0-d31ebe69a284.png; EVS exec-cc3ee783-6eb2-49ff-ae38-40d85a88dd5f.png; General exec-4d871e78-e8e5-4252-b713-796b65f9fa9a.png.
