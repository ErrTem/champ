# Design System Document: Elite Athletic Editorial

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Kinetic Gallery."** 

Unlike standard fitness apps that rely on generic grids and bright, distracting interfaces, this system treats MMA and Boxing as a high-art form. We move away from the "template" look by utilizing heavy intentional asymmetry, high-contrast typography scales, and a depth model that mimics a premium, dimly lit training sanctuary. 

The aesthetic is built on the tension between **Raw Power** (bold, condensed typography and deep blacks) and **Refined Precision** (glassmorphism, subtle gold accents, and tonal layering). We break the rigid grid by allowing high-impact athlete imagery to bleed off-canvas or overlap containers, creating a sense of forward motion and intensity.

---

## 2. Colors & Surface Architecture
This system utilizes a "Deep Obsidian" palette designed to make the vibrant action reds feel explosive and the golds feel earned.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. Boundaries must be defined solely through background color shifts or subtle tonal transitions. For example, a `surface-container-low` card sitting on a `surface` background creates a sophisticated edge without the visual "noise" of a stroke.

### Surface Hierarchy & Nesting
We treat the UI as a series of physical layers—stacked sheets of frosted glass.
*   **Base Layer (`surface` / `#131313`):** The canvas.
*   **The Depth Stack:** Use `surface-container-lowest` (`#0e0e0e`) to create "wells" of content, and `surface-container-highest` (`#353535`) for elevated floating elements.
*   **Nesting:** To define importance, an inner container should always be one step higher or lower in the tier than its parent, never the same.

### The "Glass & Gradient" Rule
To achieve an elite iOS-native feel, use **Glassmorphism** for floating action headers and navigation bars.
*   **Token:** Use `surface` or `surface-container` at 70% opacity with a `20px` to `40px` backdrop-blur.
*   **Signature Textures:** Main CTAs should use a linear gradient from `primary` (#ffb4a8) to `primary-container` (#ff5540) at a 135-degree angle to provide a "lit from within" glow.

---

## 3. Typography
The typography strategy is built on **Impact vs. Utility**.

*   **Display & Headlines (Inter):** These are your "Power" tokens. Use `display-lg` and `headline-lg` with tight letter-spacing (-2% to -4%) and bold weights to mimic the intensity of a fight poster.
*   **Titles & Body (Manrope):** These are your "Precision" tokens. Manrope provides a modern, technical feel that balances the aggression of Inter.
*   **Hierarchy as Identity:** Use extreme scale contrast. A `display-lg` headline paired with a `label-md` sub-header creates an editorial look that feels curated rather than automated.

---

## 4. Elevation & Depth
We eschew traditional drop shadows for **Tonal Layering**.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section to create a soft, natural lift.
*   **Ambient Shadows:** If a floating effect is required (e.g., a "Book Now" sticky button), use an extra-diffused shadow:
    *   *Blur:* 40px - 60px.
    *   *Opacity:* 8% of the `on-surface` color. 
    *   *Color:* Tint the shadow with a hint of `primary` to suggest ambient light reflecting off the red accents.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use `outline-variant` at **15% opacity**. 100% opaque, high-contrast borders are strictly forbidden.

---

## 5. Components

### Buttons
*   **Primary Action:** High-gloss gradient (Primary to Primary-Container). `DEFAULT` (0.25rem) roundedness for a sharp, professional edge.
*   **Secondary/Premium:** `secondary` (#e9c349) text on a transparent background with a "Ghost Border." Reserved exclusively for "Elite" or "Pro" tier features.

### Cards & Lists
*   **Rule:** Forbid the use of divider lines. 
*   **Separation:** Use `8` (2rem) from the Spacing Scale to separate list items, or alternate background shades between `surface-container-low` and `surface-container-medium`.
*   **Imagery:** Cards should feature high-contrast, desaturated photography with a red color-burn overlay on hover/active states.

### Input Fields
*   **State:** Use `surface-container-highest` for the input background. 
*   **Focus:** Instead of a thick border, use a subtle 1px "Ghost Border" and a primary-colored "pulse" in the label text.

### Specialized Components: The "Exclusive Badge"
*   **Design:** Small, `full` rounded chips using `secondary-container` (#af8d11) with `on-secondary-container` (#342800) text. These should feel like embossed gold stamps on the dark UI.

---

## 6. Do's and Don'ts

### Do:
*   **Use Asymmetry:** Place a large `headline-lg` title overlapping a `surface-container` card by `4` (1rem) to break the grid.
*   **Embrace Negative Space:** Use the `20` (5rem) and `24` (6rem) spacing tokens to let elite photography "breathe."
*   **Apply Glassmorphism:** Use it on the bottom navigation bar to allow the background intensity to bleed through.

### Don't:
*   **No "Flat" Grays:** Never use neutral grays. Every "dark" color must be rooted in the `#131313` or `#0e0e0e` tokens to maintain the "Obsidian" depth.
*   **No Standard Shadows:** Avoid small, dark, high-opacity drop shadows that make the UI look "dirty."
*   **No Generic Icons:** Icons should be thin-stroke (1pt or 1.5pt) to match the "Precision" aspect of the brand. Avoid filled, heavy icons unless in an active state.

---

## 7. Spacing & Rhythm
The system uses a strictly enforced 4px-based scale.
*   **Layout Gutter:** Use `6` (1.5rem) for mobile side margins.
*   **Section Vertical Gap:** Use `12` (3rem) or `16` (4rem) to create the "Editorial" feel. Items should feel like they are part of a curated exhibit, not a crowded list.