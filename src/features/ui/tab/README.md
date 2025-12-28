# TabGroup Component

A fully accessible, animated tabs component with automatic layout management and smooth fade transitions.

## Features

- ✨ **Automatic Layout**: Automatically wraps `Tab` components in `TabList` and `TabContent` components in a panels container
- 🎨 **Smooth Animations**: Fade transitions between tab panels (300ms duration)
- 📏 **Smart Height Management**: Automatically adjusts container height based on active tab content
- ⌨️ **Keyboard Navigation**: Full keyboard support with arrow keys, Enter, and Space
- ♿ **Accessible**: Built with ARIA attributes and semantic HTML
- ⚠️ **Warning Indicators**: Optional warning icon support for tabs
- 🔄 **Dynamic Content**: Handles dynamic content changes with ResizeObserver

## Installation

```tsx
import { TabGroup, Tab, TabContent } from "@/features/ui/tab";
```

## Basic Usage

The simplest way to use tabs - just place `Tab` and `TabContent` components directly inside `TabGroup`:

```tsx
<TabGroup defaultValue="tab1">
  <Tab value="tab1">First Tab</Tab>
  <Tab value="tab2">Second Tab</Tab>
  <Tab value="tab3">Third Tab</Tab>

  <TabContent value="tab1">
    <div>Content for first tab</div>
  </TabContent>

  <TabContent value="tab2">
    <div>Content for second tab</div>
  </TabContent>

  <TabContent value="tab3">
    <div>Content for third tab</div>
  </TabContent>
</TabGroup>
```

The `TabGroup` component automatically:

- Wraps all `Tab` components in a `TabList`
- Wraps all `TabContent` components in a panels container with proper styling
- Manages the active state and transitions

## Component API

### `TabGroup`

The root component that manages tab state and layout.

**Props:**

| Prop           | Type        | Required | Default | Description                                   |
| -------------- | ----------- | -------- | ------- | --------------------------------------------- |
| `defaultValue` | `string`    | Yes      | -       | The value of the initially active tab         |
| `className`    | `string`    | No       | `""`    | Additional CSS classes for the root container |
| `children`     | `ReactNode` | Yes      | -       | Tab and TabContent components                 |

**Features:**

- Automatically detects and wraps `Tab` components in `TabList`
- Automatically detects and wraps `TabContent` components in a panels container
- Manages container height based on active tab content
- Handles dynamic content changes with ResizeObserver

**Note:** `TabGroup` was previously named `Tabs`. The old name is deprecated but still works for backward compatibility.

### `Tab`

A single tab trigger button.

**Props:**

| Prop          | Type        | Required | Default | Description                                                          |
| ------------- | ----------- | -------- | ------- | -------------------------------------------------------------------- |
| `value`       | `string`    | Yes      | -       | Unique identifier for this tab (must match corresponding TabContent) |
| `showWarning` | `boolean`   | No       | `false` | Shows a warning icon next to the tab label                           |
| `className`   | `string`    | No       | `""`    | Additional CSS classes                                               |
| `children`    | `ReactNode` | Yes      | -       | Tab label content                                                    |

**Keyboard Navigation:**

- `ArrowLeft` / `ArrowRight`: Navigate between tabs
- `Enter` / `Space`: Activate the focused tab

**Styling:**

- First tab has rounded top-left corners
- Last tab has rounded top-right corners
- Middle tabs have no border radius
- Active tab has primary color border and text
- Inactive tabs have muted text and transparent border

### `TabContent`

The content panel for a tab.

**Props:**

| Prop        | Type        | Required | Default | Description                                      |
| ----------- | ----------- | -------- | ------- | ------------------------------------------------ |
| `value`     | `string`    | Yes      | -       | Unique identifier (must match corresponding Tab) |
| `className` | `string`    | No       | `""`    | Additional CSS classes                           |
| `children`  | `ReactNode` | Yes      | -       | Panel content                                    |

**Behavior:**

- Only the active tab's content is visible (opacity: 1)
- Inactive tabs are hidden (opacity: 0) but remain in the DOM
- Smooth fade transition when switching tabs (300ms)
- Automatically positioned absolutely within the panels container

### `TabList` (Optional)

Wrapper for tab triggers. Automatically created by `TabGroup`, but can be used explicitly for custom layouts.

**Props:**

| Prop        | Type        | Required | Default | Description            |
| ----------- | ----------- | -------- | ------- | ---------------------- |
| `className` | `string`    | No       | `""`    | Additional CSS classes |
| `children`  | `ReactNode` | Yes      | -       | Tab components         |

**Note:** If you provide `TabList` explicitly, it will be rendered as-is without automatic wrapping.

## Examples

### With Warning Indicators

```tsx
<TabGroup defaultValue="general">
  <Tab
    value="general"
    showWarning={hasErrors}>
    General
  </Tab>
  <Tab value="advanced">Advanced</Tab>

  <TabContent value="general">
    <div>General settings</div>
  </TabContent>

  <TabContent value="advanced">
    <div>Advanced settings</div>
  </TabContent>
</TabGroup>
```

### Custom Styling

```tsx
<TabGroup
  defaultValue="tab1"
  className="my-custom-class">
  <Tab
    value="tab1"
    className="custom-tab">
    Custom Tab
  </Tab>

  <TabContent
    value="tab1"
    className="custom-content">
    <div>Custom content</div>
  </TabContent>
</TabGroup>
```

### Explicit TabList (Backward Compatibility)

If you need custom control over the TabList, you can provide it explicitly:

```tsx
<TabGroup defaultValue="tab1">
  <TabList className="custom-tab-list">
    <Tab value="tab1">Tab 1</Tab>
    <Tab value="tab2">Tab 2</Tab>
  </TabList>

  <TabContent value="tab1">Content 1</TabContent>
  <TabContent value="tab2">Content 2</TabContent>
</TabGroup>
```

### Mixed Order

You can place tabs and content in any order - they'll be automatically organized:

```tsx
<TabGroup defaultValue="tab1">
  <Tab value="tab1">First</Tab>
  <TabContent value="tab1">First Content</TabContent>

  <Tab value="tab2">Second</Tab>
  <TabContent value="tab2">Second Content</TabContent>
</TabGroup>
```

## Accessibility

The tabs component follows WAI-ARIA best practices:

- ✅ Proper `role` attributes (`tablist`, `tab`, `tabpanel`)
- ✅ `aria-selected` on active tabs
- ✅ `aria-controls` linking tabs to panels
- ✅ `aria-labelledby` linking panels to tabs
- ✅ Keyboard navigation support
- ✅ Focus management
- ✅ Semantic HTML structure

## Animation Details

- **Transition Type**: Opacity fade
- **Duration**: 300ms
- **Timing Function**: `ease-in-out`
- **Height Transition**: Container height smoothly transitions when switching tabs

## Technical Notes

### Height Management

The component automatically manages the container height:

- Measures the active tab's content using `scrollHeight`
- Updates container height when switching tabs
- Uses `ResizeObserver` to handle dynamic content changes
- Smoothly transitions height changes (300ms)

### Component Detection

The `TabGroup` component uses React's component detection to identify `Tab` and `TabContent` children:

- Checks component type and `displayName`
- Automatically organizes children into appropriate containers
- Maintains order of other children

### Performance

- Uses `requestAnimationFrame` for smooth height calculations
- ResizeObserver only observes the active panel
- Inactive tabs remain in DOM but are visually hidden (better for SEO and accessibility)

## Migration Guide

If you're migrating from the old API that required `TabList`:

**Before:**

```tsx
<TabGroup defaultValue="tab1">
  <TabList>
    <Tab value="tab1">Tab 1</Tab>
  </TabList>
  <TabContent value="tab1">Content</TabContent>
</TabGroup>
```

**After (Simplified):**

```tsx
<TabGroup defaultValue="tab1">
  <Tab value="tab1">Tab 1</Tab>
  <TabContent value="tab1">Content</TabContent>
</TabGroup>
```

The old API still works for backward compatibility!
