---
title: "Multi-Tabs Test"
description: "Testing the simpler multi-tab syntax"
weight: 995
---

# Multi-Tabs Shortcode Test

This page tests a simpler approach to multi-tab syntax that works reliably with Hugo.

## Multi-Tab Example

{{< multitabs id="example-tabs" tab1="Getting Started" tab2="Features" tab3="Usage Guide" >}}
Welcome to the **Getting Started** tab! This demonstrates the simpler multi-tab syntax.

### Quick Setup
1. Include the tab component files
2. Use the `multitabs` shortcode with tab parameters
3. Separate content with `---` dividers

This approach avoids Hugo's nested shortcode parsing issues while still providing clean multi-tab functionality.

- - -

## Key Features

The tab control includes:

- **GitHub-style design**: Clean, professional appearance
- **Accessibility**: Full keyboard navigation and ARIA support
- **Responsive**: Works on all screen sizes
- **Markdown support**: Full markdown rendering within tabs
- **Simple syntax**: Uses parameter-based tab titles and content separators

### Code Example
```javascript
// Example of tab initialization
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.generic-tabs');
  tabs.forEach(tab => new GenericTabs(tab));
});
```

- - -

## How to Use

The multi-tab syntax uses parameters for tab titles and separates content with triple dashes.

**Syntax structure:**
1. Define tab titles as parameters: `tab1="Title 1" tab2="Title 2"`
2. Separate content sections with `---` on its own line
3. Each section becomes the content for the corresponding tab

### Benefits
- **Reliable parsing**: No nested shortcode issues
- **Clean syntax**: Easy to read and write
- **Flexible content**: Any markdown content works
- **Maintainable**: Clear separation between tabs
- **Accessible**: Proper semantic structure

Perfect for organizing documentation, tutorials, and reference materials!
{{< /multitabs >}}
