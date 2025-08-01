# Component CSS Migration Task: Move All Component-Specific Styles to Their Respective Components

## Objective
Identify and migrate all component-specific CSS from the main index.astro file to their respective component files, following modern component architecture best practices.

## Context
Currently, many component-specific styles are located in the main index.astro file using ID selectors (e.g., `#reviews .group`, `#services .card`). This violates component encapsulation principles and makes maintenance difficult. We need to move these styles to their respective component files.

## Tasks

### Phase 1: Audit Current CSS in Main File

#### Step 1.1: Identify Component-Specific CSS
- [ ] Open `src/pages/index.astro`
- [ ] Locate the `<style>` section (around line 400+)
- [ ] Search for CSS selectors that target specific components:
    - ID selectors like `#reviews`, `#services`, `#hero`
    - Class selectors that reference component names
    - Nested selectors like `#reviews .group`, `#services .card`

#### Step 1.2: Create CSS Migration Checklist
Document all component-specific CSS found:
- [ ] Reviews Section CSS (`#reviews`)
- [ ] Services Section CSS (`#services`)  
- [ ] Hero Section CSS (`#hero`)
- [ ] Navigation CSS (`#nav`, `.dock`)
- [ ] Process Section CSS (`#process`)
- [ ] Case Study CSS (`#case-study`)
- [ ] Chat Box CSS (`.chat`, `#chat`)
- [ ] Footer CSS (`#footer`)
- [ ] Other component-specific selectors

### Phase 2: Migrate CSS to Components

#### Step 2.1: For Each Component Found
1. **Identify the component file location**
     - Check `src/components/sections/` for section components
     - Check `src/components/ui/` for UI components
     - Check `src/components/navigation/` for navigation components

2. **Extract the CSS from index.astro**
     - Copy the relevant CSS rules
     - Remove ID-based selectors (e.g., `#reviews .group` → `.group`)
     - Keep the styling intact but make it component-scoped

3. **Add CSS to the component**
     - Open the component file
     - Add a `<style>` section if it doesn't exist
     - Paste the migrated CSS
     - Update class names in the HTML if needed

4. **Remove CSS from index.astro**
     - Delete the migrated CSS from the main file
     - Test that the component still works

#### Step 2.2: Handle Special Cases

**Example: Review Cards**
