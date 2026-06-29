---
name: wcag-accessibility
description: "Apply WCAG 2.1+ accessibility standards for UI, markup, styles, and written content. Use when editing or authoring HTML, CSS, JS, and documentation (MD)."
applyTo: "**/*.{html,htm,css,js,md}"
user-invocable: false
---

## Purpose
Ensure all authored or edited user-facing code and content follow WCAG principles (Perceivable, Operable, Understandable, Robust) at **WCAG 2.1 AA** level as a baseline unless the user requests a different level.

## Scope
This instruction applies to files matching the `applyTo` glob and any generated UI (HTML/CSS/JS) or user-facing documentation. It does not apply to unrelated backend-only code unless it produces user-facing markup or content.

## Rules / Requirements (practical checklist)
- Semantic HTML: Prefer semantic elements (`<button>`, `<nav>`, `<main>`, `<header>`, `<footer>`, `<form>`, headings in logical order). Avoid using `div`/`span` when semantic alternatives exist.
- Color contrast: Ensure text and interactive elements meet contrast ratios of at least 4.5:1 for normal text and 3:1 for large text or UI components. Use higher contrast for important UI elements.
- Keyboard operability: All interactive functionality must be reachable and operable via keyboard (Tab, Enter, Space, Arrow keys as appropriate).
- Focus indicators: Ensure visible focus styles for interactive elements (avoid removing outlines without replacing them with an equally visible style).
- Images & media: Provide meaningful `alt` attributes for images. Provide captions or transcripts for audio/video content and ensure controls are keyboard accessible.
- Forms: Every input must have an associated label. Use `label[for]` or accessible name via `aria-label`/`aria-labelledby` when appropriate.
- ARIA: Use ARIA only to enhance semantics that cannot be expressed with native HTML. Keep ARIA roles/attributes correct and avoid conflicting roles.
- Avoid color-only cues: Do not rely solely on color to convey information; add text, icons, or patterns alongside color differences.
- Timed content: Provide controls to pause/extend time-sensitive content or avoid strict time limits unless required and alternatives provided.
- Responsive content: Ensure UI reflows without loss of content or functionality across common viewport sizes and zoom levels; do not hide information at smaller sizes.
- Readable content: Write clear link text and concise headings; avoid ambiguous link labels like "click here".
- Error handling: Provide accessible error messages and suggestions for form validation; associate errors with inputs.

## Developer guidance and examples
- Semantic button example:

  ```html
  <!-- Good -->
  <button id="startBtn">Start</button>

  <!-- Avoid using anchors or divs styled as buttons -->
  ```

- Image alt text:

  ```html
  <img src="logo.png" alt="Neon Tetris logo" />
  ```

- Keyboard focus (CSS example):

  ```css
  :focus {
    outline: 3px solid rgba(0,240,255,0.85);
    outline-offset: 3px;
  }
  ```

- Form label:

  ```html
  <label for="email">Email address</label>
  <input id="email" name="email" type="email" />
  ```

- Skip link (add near top of `body`):

  ```html
  <a class="skip-link" href="#main">Skip to content</a>
  ```

## Validation and recommended checks
- Perform automated checks during edits and PR reviews. Prefer these tools for quick verification:
  - Lighthouse (Chrome DevTools) accessibility audit
  - axe-core (browser extension or `npx axe-core` integrations)
  - Pa11y or WAVE for spot checks
- Manual checks:
  - Keyboard-only navigation through new/changed features
  - Screen reader spot-check (NVDA, VoiceOver)
  - Color contrast evaluator for palette changes

## When making edits
- If a change affects UI, include a short note in the PR describing accessibility considerations and any testing performed (tools used and manual checks).
- If an automated check fails, prefer to fix the issue rather than suppressing the result. When suppression is necessary, document rationale in the PR.

## Enforcement behavior for the agent
- Always prefer accessible alternatives when suggesting code snippets or edits.
- When presented with a change that introduces an accessibility issue, surface the issue and provide a concrete fix and a reference to the relevant WCAG criterion.
- If a request is ambiguous about accessibility, ask a clarifying question (e.g., desired WCAG level, target devices, languages).

## Examples of prompts to trigger this instruction behavior
- "Make the modal accessible to keyboard and screen readers"
- "Fix color contrast on the signup button to meet WCAG AA"
- "Audit the accessibility of the game HUD and suggest fixes"

## Notes
- This instruction is a guideline for the agent's behavior; it does not replace formal accessibility testing during release. Use these practices during development and code review to reduce accessibility regressions.
