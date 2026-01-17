# Mobile Breakpoints Quick Reference

## Will Your Fixes Work on Galaxy Fold (344px)? ✅ YES!

### How @media Breakpoints Work

**`@media (max-width: 480px)`** means:
- "Apply these styles to ANY screen 480px wide or smaller"
- ✅ Catches Galaxy Fold 344px
- ✅ Catches iPhone SE 375px  
- ✅ Catches Galaxy S8 360px
- ✅ Catches old Android 320px

### Our 2-Tier Strategy

```
┌──────────────────────────────────────────┐
│ Tier 1: @media (max-width: 480px)       │
│ ════════════════════════════════════════ │
│ Applies to:                              │
│ • Galaxy Fold 344px      ✓               │
│ • Galaxy S8 360px        ✓               │
│ • iPhone SE 375px        ✓               │
│ • Pixel 5 393px          ✓               │
│ • All phones 480px and smaller           │
│                                          │
│ Fixes:                                   │
│ - Single column grids                    │
│ - Horizontal scroll tables               │
│ - Stacked forms                          │
│ - Full-width buttons                     │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ Tier 2: @media (max-width: 360px)       │
│ ════════════════════════════════════════ │
│ Applies to:                              │
│ • Galaxy Fold 344px      ✓               │
│ • Galaxy S8 360px        ✓               │
│ • Old Android 320px      ✓               │
│                                          │
│ Extra Fixes:                             │
│ - Smaller text                           │
│ - Tighter padding                        │
│ - Compact buttons                        │
│ - Reduced spacing                        │
└──────────────────────────────────────────┘
```

## Common Device Widths

| Device | Portrait | Landscape | Breakpoints Applied |
|--------|----------|-----------|-------------------|
| **Galaxy Fold (folded)** | **344px** | 512px | 480px + 360px ✓ |
| Galaxy Fold (unfolded) | 280px | 653px | 480px + 360px ✓ |
| Galaxy S8 | 360px | 740px | 480px + 360px ✓ |
| iPhone SE (2020) | 375px | 667px | 480px only |
| Pixel 5 | 393px | 851px | 480px only |
| iPhone 12/13 | 390px | 844px | 480px only |
| iPhone 14 Pro | 393px | 852px | 480px only |
| Galaxy S21 | 360px | 800px | 480px + 360px ✓ |

## Testing Chrome DevTools

1. Open DevTools (F12)
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Select device or enter custom width:

### Recommended Test Widths:
- **344px** - Galaxy Fold (extreme narrow)
- **360px** - Common Android
- **375px** - iPhone SE
- **393px** - Modern phones
- **280px** - Galaxy Fold unfolded (ultra extreme)

### How to Test:
```
1. Set width to 344px (Galaxy Fold)
2. Navigate through app
3. Check for:
   ✓ No horizontal scroll
   ✓ All content visible
   ✓ Buttons touchable
   ✓ Forms usable
```

## CSS Cascade Example

For a Galaxy Fold (344px):

```css
/* Base styles (applies to all) */
.grid {
  grid-template-columns: repeat(3, 1fr);
}

/* Tablet */
@media (max-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Small phones (344px caught here) ✓ */
@media (max-width: 480px) {
  .grid {
    grid-template-columns: 1fr; /* Single column */
  }
}

/* Ultra-narrow (344px gets EXTRA fixes here) ✓ */
@media (max-width: 360px) {
  .grid {
    padding: 0.5rem; /* Even tighter spacing */
  }
}
```

**Result for Galaxy Fold 344px:**
- ✅ Gets 768px styles (if they exist)
- ✅ Gets 480px styles (MAIN FIX)
- ✅ Gets 360px styles (EXTRA POLISH)

## Key Takeaway

**YES, 480px breakpoint works for Galaxy Fold!**

The breakpoint is a **maximum**, not a minimum:
- `max-width: 480px` = "480px AND SMALLER"
- Galaxy Fold 344px < 480px ✓
- Therefore Galaxy Fold WILL get the fixes ✅

We add the 360px breakpoint for **extra polish** on ultra-narrow screens, not because 480px doesn't catch them.

