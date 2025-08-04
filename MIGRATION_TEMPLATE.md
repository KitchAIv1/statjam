# Component Migration Template

## Before/After Component Migration Pattern

### **BEFORE (Problematic Pattern):**
```tsx
// ❌ BAD: Mixed inline styles and Tailwind
<div 
  className="component-name p-6 border"
  style={{
    backgroundColor: '#1a1a1a',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff'
  }}
>
  <h3 style={{ color: '#b3b3b3' }}>Title</h3>
  <p style={{ color: '#666666' }}>Content</p>
</div>
```

### **AFTER (Clean Pattern):**
```tsx
// ✅ GOOD: Utility classes from design system
<div className="component-name p-6 border bg-secondary border-default">
  <h3 className="text-secondary">Title</h3>
  <p className="text-muted">Content</p>
</div>
```

## Migration Checklist

### **1. Container Migration:**
- [ ] Replace `max-w-7xl mx-auto px-4 md:px-8` → `container-page`
- [ ] Replace `py-20 px-4 md:px-8` → `container-section`
- [ ] Replace manual responsive padding → use container classes

### **2. Grid Migration:**
- [ ] Replace `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3` → `grid-cols-responsive`
- [ ] Replace specific card grids → `grid-stats`, `grid-games`, `grid-tournaments`
- [ ] Remove `place-items-center` and manual gap classes

### **3. Color Migration:**
- [ ] Replace `style={{ backgroundColor: '#1a1a1a' }}` → `bg-secondary`
- [ ] Replace `style={{ color: '#ffffff' }}` → `text-primary`
- [ ] Replace `style={{ color: '#b3b3b3' }}` → `text-secondary`
- [ ] Replace `style={{ color: '#666666' }}` → `text-muted`
- [ ] Replace `style={{ borderColor: '#374151' }}` → `border-default`

### **4. Typography Migration:**
- [ ] Replace `style={{ fontFamily: 'Anton' }}` → `font-header`
- [ ] Replace inline font styles → `font-body`

## Component-Specific Patterns

### **StatCard Pattern:**
```tsx
// Before
<div style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>
  <h3 style={{ color: '#b3b3b3' }}>Title</h3>
  <div style={{ color: '#FFD700' }}>Icon</div>
</div>

// After
<div className="bg-secondary text-primary">
  <h3 className="text-secondary">Title</h3>
  <div className="text-accent">Icon</div>
</div>
```

### **GameCard Pattern:**
```tsx
// Before
<div style={{ backgroundColor: '#1a1a1a', borderColor: '#1f2937' }}>
  <span style={{ color: getStatusColor(status) }}>Status</span>
</div>

// After
<div className="bg-secondary border-default">
  <span className="text-status-live">Status</span>
</div>
```

## Migration Priority Order

1. **High Priority** (Immediate fixes):
   - StatCard, GameCard, TournamentCard
   - Landing page containers
   - Dashboard grids

2. **Medium Priority** (Next sprint):
   - Auth page styling
   - Form components
   - Modal components

3. **Low Priority** (Future cleanup):
   - Header component
   - Animation components
   - Edge case styling

## Testing Checklist

After migration:
- [ ] Components render correctly
- [ ] Responsive behavior works
- [ ] Colors match design system
- [ ] No layout shifts
- [ ] Performance maintained