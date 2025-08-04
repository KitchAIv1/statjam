# 🔍 Browser DevTools Debugging Guide for StatJam UI Issues

## **Systematic CSS Inspection Steps**

### **Step 1: Initial Page Load Analysis**
1. **Open Browser DevTools** (F12 or Cmd+Option+I)
2. **Go to Console Tab** - Check for any CSS compilation errors
3. **Look for these specific errors:**
   ```
   Error: Cannot apply unknown utility class `container-base`
   Tailwind compilation errors
   ```

### **Step 2: Element Inspection**
1. **Right-click on invisible/problematic element** → "Inspect Element"
2. **Check these key properties in Computed tab:**
   ```
   display: (should not be 'none')
   visibility: (should be 'visible')
   opacity: (should be > 0)
   width/height: (should have actual values)
   background-color: (check if matches expectation)
   color: (check text visibility)
   ```

### **Step 3: Container Hierarchy Analysis**
1. **Select the problematic container element**
2. **In Elements panel, navigate up the DOM tree**
3. **Check each parent container for:**
   ```css
   overflow: hidden;     /* Could clip content */
   position: absolute;   /* Could place off-screen */
   z-index: negative;    /* Could hide behind other elements */
   max-width: 0;        /* Could collapse container */
   height: 0;           /* Could collapse container */
   ```

### **Step 4: CSS Cascade Investigation**
1. **Select target element**
2. **In Styles panel, look for:**
   - ❌ **Crossed-out styles** (overridden)
   - ⚠️ **Invalid property values** (red highlight)
   - 🚫 **Missing CSS variables** (--var-name not defined)
   
3. **Check Sources of Styles:**
   ```
   Inline styles (style="...")
   Component styles 
   globals.css
   Tailwind utilities
   ```

### **Step 5: Layout Debugging**
1. **Enable CSS Grid/Flexbox overlays:**
   - Click the `grid` or `flex` badge next to elements
   - Visualize layout structure
   
2. **Check for Layout Issues:**
   ```css
   justify-content: flex-start;  /* Items may align left */
   align-items: stretch;         /* Items may expand unexpectedly */
   flex: 1;                     /* Items may grow too much */
   grid-template-columns: auto;  /* Columns may not size correctly */
   ```

### **Step 6: Color/Visibility Debugging**
1. **Check Computed Color Values:**
   ```css
   color: rgb(0, 0, 0);           /* Black text on dark background */
   background-color: transparent;  /* No background */
   border-color: transparent;      /* No visible borders */
   ```

2. **Test Color Overrides in Console:**
   ```javascript
   $0.style.backgroundColor = 'red';    // Make element visible
   $0.style.color = 'yellow';           // Make text visible
   $0.style.border = '2px solid green'; // Add visible border
   ```

## **Common StatJam-Specific Issues to Check**

### **Issue: Cards Not Visible**
**Check for:**
```css
/* Should have these styles */
.card-visible {
  background-color: #1a1a1a !important;
  border: 1px solid #374151 !important;
  border-radius: 0.75rem !important;
  padding: 1.5rem !important;
}
```

### **Issue: Text Not Visible (Black on Black)**
**Check for:**
```css
/* Should have these styles */
.text-visible-white { color: #ffffff !important; }
.text-visible-gray { color: #b3b3b3 !important; }
.text-visible-yellow { color: #FCD34D !important; }
```

### **Issue: Containers Not Centering**
**Check for:**
```css
/* Should have these styles */
.container-section {
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
  padding: 1rem;
}
```

### **Issue: Grid Not Working**
**Check for:**
```css
/* Should have these styles */
.grid-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 280px));
  gap: 1.5rem;
  justify-content: center;
}
```

## **Quick CSS Fixes to Test in Console**

### **Force Element Visibility:**
```javascript
// Select element first (right-click → inspect)
$0.style.backgroundColor = '#1a1a1a';
$0.style.color = '#ffffff';
$0.style.border = '1px solid #374151';
$0.style.padding = '1.5rem';
$0.style.display = 'block';
$0.style.opacity = '1';
```

### **Fix Container Issues:**
```javascript
// Fix container centering
$0.style.maxWidth = '1400px';
$0.style.margin = '0 auto';
$0.style.padding = '1rem';
```

### **Debug Grid Layout:**
```javascript
// Fix grid container
$0.style.display = 'grid';
$0.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
$0.style.gap = '1.5rem';
$0.style.justifyContent = 'center';
```

## **Performance Checks**

### **CSS Loading Issues:**
1. **Network Tab** → Filter by "CSS"
2. **Check for:**
   - Failed CSS file loads (404 errors)
   - Slow-loading stylesheets
   - Cached CSS that's outdated

### **Tailwind Compilation:**
1. **Look for Tailwind CSS processing errors**
2. **Check for missing utility classes in final CSS**
3. **Verify CSS custom properties are defined**

## **Expected Behavior vs. Current State**

### **✅ What Should Work:**
- Cards should have dark backgrounds with visible borders
- Text should be white/yellow on dark backgrounds  
- Containers should center with max-width constraints
- Grids should create responsive layouts

### **❌ What's Broken:**
- Elements invisible due to no background
- Text invisible due to color conflicts
- Containers stretching full-width
- Grids not rendering properly

Use this guide to systematically identify which layer of the CSS architecture is failing!