# Brand Generation Prompt — FIAP Games

## Context (for whoever/whatever runs this prompt)

FIAP Games is a digital game storefront: users register, browse a game catalog, buy games, and build a personal library. Under the hood it's a distributed system (five microservices, event-driven purchase flow, Kubernetes), but none of that infrastructure should show up in the visual identity — the brand faces end users of a game store, not engineers. It's an academic project (FIAP), so the identity should read as a credible, modern digital storefront (think: a scrappy indie sibling of Steam/itch.io/Epic Games Store), not a corporate SaaS dashboard.

Keep this in mind: the product is a **simulated store** — playful and confident, not trying to look like a bank or an enterprise tool.

---

## Prompt to use

> Design a brand identity for **"FIAP Games"**, a digital video game storefront and library platform. Generate three deliverables:
>
> 1. **Brand name treatment** — a wordmark/logotype for "FIAP Games". Explore whether "FIAP" and "Games" should be visually distinct (different weight, color, or case) or unified as one lockup. Keep it short, legible at small sizes, and readable in a single line and as a stacked two-line variant.
> 2. **Logo mark** — a standalone symbol that works without the wordmark, simple enough to read at 32×32px. Concept direction: something that evokes **play, purchase, and a library of games at once** — e.g. a stylized game controller, a joystick nub abstracted into a letterform (G or F), a "play" triangle merged with a shopping/bag motif, or a pixel/grid motif referencing a game library shelf. Avoid literal, cluttered console/controller illustrations — go geometric and iconic, not photorealistic.
> 3. **Favicon** — a simplified, high-contrast reduction of the logo mark that reads clearly at 16×16px and 32×32px on both light and dark browser tabs. Single color or two-tone max; no fine detail, no text.
>
> **Style direction:**
> - Modern digital-storefront energy — confident, a little playful, not corporate/enterprise, not childish.
> - Geometric, flat or subtly gradient, vector-friendly (must reproduce cleanly as SVG).
> - Avoid generic "gamer" clichés: no neon skulls, no aggressive angular "esports" swooshes, no cheap controller clip-art.
>
> **Color palette:** deep indigo/violet or near-black background family with one vivid accent (electric purple, magenta, or cyan) — evokes a storefront at night, screens lighting up. Provide the mark in both a color version (for the dark background) and a monochrome/single-color version (for favicons and small UI chrome).
>
> **Typography feel (for the wordmark):** geometric sans-serif, medium-to-bold weight, tight letter-spacing, slightly technical but still friendly — legible, not a display/decorative face.
>
> **Deliver as:** a description/spec detailed enough to hand to an image generator or a designer, including: exact hex codes for the palette, the symbol concept chosen, the wordmark treatment, and favicon export sizes (16×16, 32×32, 48×48, 180×180 for apple-touch-icon).
>
> **Constraints:**
> - Must work on a dark UI (the primary surface) and hold up reduced to a single flat color.
> - No literal photography, no 3D renders, no stock-art game characters.
> - This is a simulated/academic store, not a real commercial payment platform — nothing that implies bank-grade financial branding (no shield/lock/checkmark-heavy "trust badge" visual language).

---

## Notes

- If generating actual images (not just a spec), run the prompt above per deliverable (name treatment / logo mark / favicon) separately for sharper results — a single combined generation tends to blur the three into one busy image.
- Once a direction is picked, export the logo mark as SVG first; derive the favicon from that SVG rather than generating it separately, so the two stay visually consistent.
