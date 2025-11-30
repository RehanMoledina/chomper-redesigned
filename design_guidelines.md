# Chomper App - Design Guidelines

## Design Approach

**Hybrid Strategy**: Clean minimalist productivity foundation (inspired by Splendo) with delightful gamified elements. The interface should feel spacious and uncluttered, letting the monster companion's personality shine through strategic moments of whimsy.

**Core Design Philosophy**: "Minimalism with personality" - every element serves a purpose, but the monster companion adds warmth and motivation to an otherwise clean, efficient interface.

## Typography

**Font Stack**:
- Primary: Inter or similar geometric sans-serif (Google Fonts)
- Use single font family throughout for consistency

**Type Scale**:
- Page titles: text-2xl font-semibold (24px)
- Section headers: text-lg font-medium (18px)
- Task text: text-base font-normal (16px)
- Metadata/dates: text-sm font-normal (14px)
- Monster dialogue/celebration text: text-base font-medium with playful tone

**Hierarchy**: Rely on weight and size contrast rather than decorative elements. Keep task text highly readable with generous line-height (leading-relaxed).

## Layout System

**Mobile-First Container**:
- Maximum width: max-w-lg (512px) for optimal mobile readability
- Padding: px-4 for edge breathing room
- Vertical spacing: Use Tailwind units of 3, 4, 6, 8, and 12 consistently

**Spacing Rhythm**:
- Component gaps: space-y-3 or space-y-4
- Section separation: py-6 or py-8
- Card padding: p-4
- List item padding: py-3 px-4

**Grid System**: Single column for mobile, use simple stacking. Avoid complex multi-column layouts that compete for attention.

## Component Library

### Navigation
- **Bottom Tab Bar** (sticky): Fixed bottom navigation with 3-4 key sections (Tasks, Monster, Stats, Settings)
- Clean icons with labels, active state with subtle weight change
- Height: h-16 with safe-area padding

### Task Input
- **Quick Add Bar**: Floating or top-positioned input with rounded-lg border
- Placeholder: "What needs chomping today?"
- Single-tap to expand for due date and category selection
- Submit button with subtle plus icon or "Add" text

### Task List Display
- **Card-based Layout**: Each task in a rounded-lg card with subtle shadow (shadow-sm)
- Checkbox: Large (w-6 h-6), rounded-md, positioned left
- Task text: Flexible width, truncate on overflow with ellipsis
- Due date badge: Inline, text-xs with rounded-full background
- Swipe gestures: Left swipe to delete, right swipe to complete

**List Grouping**:
- Group by: Today, Upcoming, Overdue
- Section headers with text-sm font-semibold, subtle divider lines
- Empty states with encouraging monster illustration and friendly message

### Monster Companion

**Positioning**: 
- Idle state: Small circular avatar (w-16 h-16) in top-right corner or dedicated "Monster" tab
- Active state: Center screen when chomping tasks with smooth scale animation

**Animations**:
- Task completion: Monster grows to w-32 h-32, chomping animation (mouth open/close), then celebratory bounce
- Use CSS transitions (transition-all duration-300) for smooth scaling
- Confetti or sparkle particles on task completion (lightweight SVG particles)

**Monster States**:
- Hungry (few tasks completed): Neutral/waiting expression
- Satisfied (tasks completed): Happy, full expression
- Use simple SVG illustrations, 2-3 expression states

### Data Visualization
- **Progress Ring**: Circular progress indicator showing daily completion percentage
- Minimal stroke width, positioned in Stats section
- Text-center display of "X/Y tasks completed"

### Buttons & Actions
- Primary action: rounded-lg, px-6 py-3, font-medium
- Secondary actions: Ghost buttons with transparent background
- Destructive actions: Text-based with warning icon

### Celebration System
- **Completion Feedback**: 
  - Toast notification with monster reaction
  - Brief animation (0.5-1s) with encouraging message
  - Sound effect trigger point (user can toggle in settings)

## Images

**Monster Companion Illustrations**:
- Hero moment on first launch/onboarding: Large centered monster (w-48 h-48) with welcome message
- Task completion: Mid-size monster animation (w-32 h-32)
- Empty states: Friendly monster encouraging task creation (w-24 h-24)
- Style: Friendly, cartoon aesthetic with rounded shapes, avoid detailed rendering

**No hero image needed** - The monster companion serves as the primary visual identity. Use generous white space and clean typography to let the app breathe.

## Interaction Patterns

**Gestures**:
- Swipe left on task card: Delete with confirmation
- Swipe right on task card: Mark complete (trigger monster chomp)
- Pull to refresh: Reload task list with subtle animation
- Long press: Multi-select mode for bulk actions

**Microinteractions**:
- Checkbox bounce on completion
- Task card fade-out when deleted
- Monster subtle idle animation (gentle breathing or blinking)
- Input field focus: Subtle border glow

**Navigation Flow**:
- Default view: Today's tasks
- Single tap on monster: View stats and monster happiness level
- Minimal modal overlays for task editing - prefer slide-in panels from bottom

## Accessibility

- Minimum touch target: 44x44px for all interactive elements
- High contrast text (WCAG AA minimum)
- Checkbox states clearly visible without color alone
- Monster animations respect prefers-reduced-motion
- Focus indicators on all interactive elements

## Performance Considerations

- Lazy load monster animations
- Use CSS transforms for animations (hardware accelerated)
- Minimize animation complexity - prefer simple scale/opacity transitions
- Icon library: Heroicons via CDN (consistent, minimal style)

---

**Design Principle Summary**: Every pixel should either help the user manage tasks efficiently OR delight them through the monster companion. Nothing decorative without purpose. The minimalism creates the stage; the monster provides the personality.