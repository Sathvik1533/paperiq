# Google Stitch Master UI/UX Design Prompt

```
Design a premium "About Me & Developer Story" screen for PaperIQ with God-Level attention to spatial hierarchy, color DNA, and interactive polish.

## STRICT COLOR DNA & FOUNDATION TOKENS

Base Canvas: Solid deep dark slate/black (#0a0a0c) - cinematic, premium contrast frame
Component Cards: Elevated dark obsidian blocks (#121214) with ultra-thin razor-sharp wireframe borders (#1e1e24)
Brand Accent: Technical orange (#ff6600) ONLY for high-priority focal text, data status indicators, active links, and border glows
Text Hierarchy:
- Primary headings: Pure white (#ffffff) at 28px-32px, bold weight (700)
- Body text: Soft neutral gray (#9ca3af) at 16px, regular weight (400)
- Data metrics: Technical orange (#ff6600) at 24px-28px, bold weight (700)
- Labels: Light gray (#d1d5db) at 14px, medium weight (500)

## ASYMMETRIC TWO-COLUMN GRID ARCHITECTURE

Left Column (35% width, sticky position):
- Vertical stack with gap-8 spacing
- Top-aligned, fixed during scroll

Right Column (65% width):
- Scrollable content area
- Three stacked cards with gap-6 spacing

Container: max-width 1400px, horizontal padding 48px, vertical padding 64px

## LEFT COLUMN: PROFILE AVATAR & TECH STACK

### Premium Circular Avatar Frame
- Dimensions: 240px × 240px perfect circle
- Image: Developer silhouette against warm sunset water horizon (orange/pink sky, calm water)
- Border: 3px solid #1e1e24 with 2px outer glow (#ff6600 at 20% opacity)
- Drop shadow: 0 8px 32px rgba(0,0,0,0.6)
- Hover state: Scale to 102%, border glow intensifies to 40% opacity, 300ms smooth transition

### Absolute Verification Badge
Position: Top-right quadrant of avatar circle (translate: +12px right, -12px up from circle edge)
Design:
- Circular badge: 48px diameter
- Background: Bright sky blue (#2563eb) with subtle gradient to #1d4ed8
- Border: 3px solid #0a0a0c (matches canvas to create cut-out effect)
- Icon: Sharp white checkmark (✓) at 24px, stroke-width 3px, centered
- Drop shadow: 0 4px 12px rgba(37, 99, 235, 0.4)
- Label: "Verified Platform Architect" tooltip on hover

### Developer Name & Title
Below avatar (margin-top: 24px):
- Name: "Sathvik" in white (#ffffff), 28px, bold (700), letter-spacing -0.5px
- Title: "Solo Developer & Founder" in orange (#ff6600), 16px, medium (500), letter-spacing 0.5px

### Tech Stack Component Chips
Vertical stack (margin-top: 32px, gap-3):
Each chip:
- Background: #121214 with border 1px solid #1e1e24
- Padding: 12px 16px
- Text: Light gray (#d1d5db), 14px, medium weight (500)
- Icon: 20px matching brand icon on left
- Hover: Border becomes #ff6600 at 40% opacity, subtle scale 101%
- Transition: 200ms ease-in-out

Tech items (display in order):
1. React 18 + TypeScript
2. Tailwind CSS + Vite
3. Python FastAPI
4. Supabase + PostgreSQL
5. Google Cloud Platform
6. Agentic AI Models

## RIGHT COLUMN: THREE NARRATIVE CARDS

### Card 1: "The Core Blueprint"
Background: #121214
Border: 1px solid #1e1e24
Border-radius: 16px
Padding: 40px
Hover state: Border color transitions to #ff6600 at 40% opacity, glow effect 0 0 24px rgba(255,102,0,0.15)

Header:
- Small label: "ORIGIN STORY" in orange (#ff6600), 12px, uppercase, letter-spacing 2px, medium (500)
- Title: "The Core Blueprint" in white (#ffffff), 24px, bold (700), margin-top 8px

Body text (margin-top: 24px):
- Color: #9ca3af
- Size: 16px
- Line-height: 1.7
- Max-width: 680px

Content:
"PaperIQ was born from a singular insight: MLRIT students waste 40% of their study time on low-probability topics. I designed this platform from absolute zero—every algorithm, every data pipeline, every pixel—to eliminate exam analysis constraints through intelligent question paper pattern recognition. Built in 5 days of high-intensity code sprints, PaperIQ now serves thousands of students with 89% prediction accuracy, turning historical exam data into laser-focused study strategies."

### Card 2: "Development Metrics Dashboard"
Same card styling as Card 1
Margin-top: 24px from previous card

Header:
- Label: "ENGINEERING VELOCITY" in orange
- Title: "Development Metrics Dashboard" in white

Metrics Grid (3 columns, gap-6):
Each metric block:
- Number: Technical orange (#ff6600), 32px, bold (700), monospace font
- Label: Light gray (#d1d5db), 14px, medium (500)
- Separator line: 1px solid #1e1e24 below each metric
- Subtle fade-in animation on scroll

Metrics to display:
1. "5 Days" | "High-Intensity Development Sprint"
2. "89%" | "Prediction Accuracy Rate"
3. "500K+" | "Questions Analyzed & Classified"
4. "10+ Years" | "Historical Paper Data Ingested"
5. "25+" | "Core System Rules Implemented"
6. "80+" | "Authentic MLRIT DOCX Assets Restored"

### Card 3: "Ecosystem Architecture Nodes"
Same card styling as Cards 1 & 2
Margin-top: 24px from previous card

Header:
- Label: "TECHNICAL INFRASTRUCTURE" in orange
- Title: "Ecosystem Architecture Nodes" in white

Architecture Diagram (margin-top: 32px):
Three node boxes in horizontal layout with connecting lines:

Node styling:
- Background: rgba(255,102,0,0.05)
- Border: 2px solid #1e1e24
- Border-radius: 12px
- Padding: 24px
- Width: Equal distribution with gap-4

Node 1 - Frontend:
- Icon: React logo (circular, 32px)
- Title: "Frontend Layer" (#ffffff, 18px, bold)
- Tech list: "React 18", "TypeScript", "Tailwind CSS", "Zustand" (each on new line, 14px, #9ca3af)

Node 2 - Backend:
- Icon: Python logo (32px)
- Title: "Backend Engine" (#ffffff, 18px, bold)
- Tech list: "FastAPI", "Celery", "Redis", "ML Classifiers" (14px, #9ca3af)

Node 3 - Data:
- Icon: Database icon (32px)
- Title: "Cloud Storage" (#ffffff, 18px, bold)
- Tech list: "Supabase", "PostgreSQL", "Edge Functions", "Storage Buckets" (14px, #9ca3af)

Connection Lines:
- Horizontal lines between nodes: 2px solid #1e1e24 with orange gradient at 20% opacity
- Animated pulse effect traveling left-to-right, loop 3s

## GOD-LEVEL SPATIAL & INTERACTION RULES

Spacing System:
- Section gaps: 48px (gap-12)
- Card internal padding: 40px (p-10)
- Element margins: 24px standard, 32px for major breaks
- Component gaps: 16px (gap-4) for related items, 24px (gap-6) for sections

Hover Interactions (300ms ease-in-out transitions):
- Avatar: Scale 102%, border glow intensifies
- Tech chips: Border color to orange, scale 101%
- Cards: Border transforms to glowing orange outline (#ff6600 at 40% opacity) with soft shadow 0 0 24px rgba(255,102,0,0.15)
- Metric numbers: Slight color pulse effect

Typography Rhythm:
- All headings use system font stack: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- Metric numbers use monospace: 'SF Mono', 'Monaco', 'Courier New', monospace
- Wide letter-spacing for uppercase labels (2px)
- Tight letter-spacing for large headings (-0.5px)

Responsive Breakpoints:
- Desktop (1400px+): Full two-column layout
- Tablet (768px-1399px): Reduce column widths, stack on narrower screens
- Mobile (<768px): Single column stack, avatar 180px, reduce padding to 24px

Accessibility:
- Focus states: 2px solid orange outline with 4px offset
- All interactive elements min 44px touch target
- ARIA labels for icons and badges
- Proper heading hierarchy (h1 → h2 → h3)

Animation Timing:
- Instant feedback: 100-150ms (button presses)
- Smooth transitions: 200-300ms (hover states, border changes)
- Gentle animations: 400-600ms (card reveals, fades)
- Ambient effects: 2-3s loops (pulse, glow effects)

Final Polish:
- All cards have subtle inner shadow: inset 0 1px 0 rgba(255,255,255,0.03)
- Avatar has multiple shadow layers for depth
- Orange accent appears exactly 8-10 times across entire screen (calculated restraint)
- Zero visual congestion - every element has breathing room
- Print this screen on paper and it should feel like a premium architectural blueprint

Render this design with production-grade precision matching Apple's Human Interface Guidelines level of craft.
```
