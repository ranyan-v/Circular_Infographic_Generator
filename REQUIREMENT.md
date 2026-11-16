# Circular Infographic Generator
**Project Requirements — Version 1.0**

| Property | Value |
|---|---|
| Project | Circular Infographic Generator |
| Developer | ran.yan |
| Email | ran.yan.v@outlook.com |
| Platform | Adobe Illustrator |
| Script Language | ExtendScript (JSX) |
| Units | Millimeters (mm) |
| Version | 1.0 |

---

## 1. Project Overview

### 1.1 Purpose

Circular Infographic Generator is an Adobe Illustrator script designed to automate the creation of circular infographic diagrams.

The script generates a complete circular diagram based on user-defined categories and their corresponding items.

The generated diagram consists of:

- Circular category arcs.
- Category labels.
- Individual item icon placeholders.
- Individual item text labels.
- An optional inner reference circle.

The primary objective is to reduce repetitive drawing and positioning work while maintaining full editing flexibility within Adobe Illustrator.

### 1.2 Design Principles

1. Automatic geometric calculations.
2. Consistent spacing and alignment.
3. Fully editable native Illustrator vector objects.
4. Flexible category and item management.
5. Clear and organized layer structure.
6. Minimal external dependencies.

---

## 2. Diagram Structure

The diagram consists of three main components.

### 2.1 Category

Each category represents a major theme or group of related items.

Properties:
- Category name.
- Category color.
- Angular allocation.
- Category arc.
- Category label.

### 2.2 Item

Each category can contain multiple items.

Properties:
- Item name.
- Icon placeholder.
- Angular position.
- Text label.
- Optional manual position adjustment.

Each item must have an individual icon placeholder and text object.

### 2.3 Center

The center of the diagram contains an optional reference circle.

Version 1.0 requirements:
- Generate one circular path.
- Allow independent control of its diameter.
- Allow independent control of stroke weight and color.
- No arrows or decorative dashed lines in the initial version.

---

## 3. Category Distribution System

The script must support three distribution modes.

### 3.1 Equal Distribution

All categories receive an equal angular allocation, regardless of their item counts.

Example:

| Category | Items | Allocation |
|---|---:|---:|
| A | 5 | 90° |
| B | 3 | 90° |
| C | 2 | 90° |
| D | 2 | 90° |

### 3.2 Proportional Distribution

Category allocation is proportional to the number of items within each category.

Example:

| Category | Items | Allocation |
|---|---:|---:|
| A | 5 | 150° |
| B | 3 | 90° |
| C | 2 | 60° |
| D | 2 | 60° |
| Total | 12 | 360° |

Formula:

`Category Angle = Available Angle × (Category Item Count / Total Item Count)`

### 3.3 Manual Distribution

Users can manually specify the angular allocation of each category.

Requirements:
- Individual angle input.
- Automatic calculation of start and end angles.
- Validation of total angular allocation.
- Display an error if the total allocation exceeds the available angle.

### 3.4 Category Gap

The angular gap between adjacent categories must be configurable.

Requirements:
- Independent Category Gap parameter.
- Gap is measured in degrees.
- Gaps must be excluded from the available angular allocation.
- All categories must remain within the 360° circle.

For automatic modes, the available angle is:

`Available Angle = 360° - (Number of Categories × Category Gap)`

For manual mode, the sum of category angles and gaps must not exceed 360°.

---

## 4. Item Distribution System

The script must support automatic and manual item positioning.

### 4.1 Automatic Distribution

Items are distributed evenly within their assigned category arc.

Requirements:
- Calculate the angular position of each item.
- Distribute items within the usable category arc.
- Maintain consistent spacing.
- Position icon placeholders and text labels according to the calculated item angle.

Items should be positioned at the center of their allocated angular intervals rather than directly on category boundaries.

### 4.2 Manual Adjustment

Users must be able to adjust individual item positions.

Two methods are supported:

1. Manual angle input before generation.
2. Direct manual movement of generated Illustrator objects after generation.

Manual angle overrides must not affect the angular allocation of the category itself.

When manually adjusted, an item must remain associated with its original category.

**Note:** Directly edited Illustrator objects are not dynamically linked to the original script parameters. Regeneration may recreate their positions.

### 4.3 Item Gap

Item Gap controls the spacing between items within the same category.

Requirements:
- Independent parameter.
- Measured in degrees.
- Applied consistently during automatic distribution.
- Must not be confused with Category Gap.

---

## 5. Radial Layout System

### 5.1 General Layout

The selected layout is Radial.

Items are arranged around the outer circumference of the diagram.

Each item consists of:
- One circular icon placeholder.
- One horizontal text label.

### 5.2 Icon Placeholder

The script generates an empty circular vector object for each item.

Configurable properties:
- Icon Circle Diameter.
- Stroke Weight.
- Stroke Color.
- Fill Color.
- Distance from Outer Ring.

All placeholders must be independent editable paths.

No actual icons are imported or generated in Version 1.0.

### 5.3 Item Labels

Each item has an independent text object.

Layout rules:
- Text remains horizontal.
- Items on the right side of the diagram have labels positioned to the right of their icon placeholders.
- Items on the left side have labels positioned to the left.
- Text alignment changes according to the item's position.
- Text must support multiple lines.
- Text and icon placeholders must remain separate objects.

Configurable properties:
- Font Family.
- Font Size.
- Font Weight.
- Text Color.
- Label Distance.
- Maximum Text Width.

### 5.4 Category Labels

Category names must be positioned along their corresponding category arcs.

Two display modes:

**Curved Text**
- Text follows the category arc.
- Text is positioned close to the arc.
- Text orientation follows the selected arc direction.

**Horizontal Text**
- Text remains horizontal.
- Text is positioned near the corresponding category arc.

Configurable properties:
- Font Family.
- Font Size.
- Font Weight.
- Text Color.
- Distance from Category Arc.

---

## 6. Geometry and Appearance Settings

The following parameters must be configurable.

| Parameter | Description |
|---|---|
| Outer Radius | Outer radius of the circular diagram |
| Inner Radius | Inner radius of the category ring |
| Starting Angle | Initial angular position |
| Rotation | Rotation of the entire diagram |
| Category Gap | Gap between category arcs |
| Item Gap | Gap between items |
| Icon Diameter | Diameter of icon placeholders |
| Icon Distance | Distance between ring and icons |
| Label Distance | Distance between icons and labels |
| Center Circle Diameter | Diameter of inner reference circle |

All dimensional parameters must use millimeters.

Angular parameters must use degrees.

The script must validate incompatible or invalid dimensions before generating objects.

---

## 7. Text Collision Detection

Text Collision Detection is included as a layout optimization feature.

Requirements:
- Detect overlapping item labels.
- Detect overlapping icon placeholders and labels.
- Attempt to resolve collisions by adjusting radial positions.
- Preserve horizontal text orientation.
- Preserve the original item order as much as possible.
- Notify users when automatic adjustment cannot resolve all collisions.

The first implementation may use bounding-box collision detection.

Advanced text layout optimization is not required for Version 1.0.

---

## 8. Illustrator Layer Structure

The generated diagram must have an organized and editable layer hierarchy.

```text
Circular Infographic
│
├── 01_Categories
│   ├── Category 01
│   │   ├── Arc
│   │   └── Category Label
│   │
│   ├── Category 02
│   │   ├── Arc
│   │   └── Category Label
│   │
│   └── Category 03
│
├── 02_Items
│   ├── Category 01
│   │   ├── Item 01
│   │   │   ├── Icon Placeholder
│   │   │   └── Text Label
│   │   └── Item 02
│   │
│   └── Category 02
│
└── 03_Center
    └── Inner Circle
```

Requirements:
- Each category must be independently selectable.
- Each item must be independently editable.
- Text objects must not be outlined.
- All generated objects must be native Illustrator objects.
- Objects must not be unnecessarily rasterized or flattened.

---

## 9. User Interface

The script interface should contain three main sections.

### 9.1 General Settings

- Distribution Mode: Equal / Proportional / Manual.
- Outer Radius.
- Inner Radius.
- Starting Angle.
- Rotation.
- Category Gap.
- Item Gap.

### 9.2 Category and Item Management

Users must be able to:
- Add categories.
- Delete categories.
- Rename categories.
- Change category colors.
- Add items.
- Delete items.
- Rename items.
- Change item order.
- Specify manual category angles.
- Specify manual item angles.

### 9.3 Appearance Settings

- Icon Placeholder Settings.
- Item Label Settings.
- Category Label Settings.
- Center Circle Settings.
- Text Collision Detection.

### 9.4 Generation

The interface must provide:
- Generate Diagram.
- Cancel.
- Input validation.
- Error messages.

Generation should create a new organized diagram in the active Illustrator document.

---

## 10. Technical Requirements

| Property | Requirement |
|---|---|
| Platform | Adobe Illustrator |
| Script | ExtendScript / JSX |
| Compatibility | Illustrator versions supporting ExtendScript |
| Units | Millimeters |
| Output | Editable vector objects |
| External Dependencies | None |
| UI | Script dialog |
| Layer Management | Nested layers and groups |

The implementation must account for Illustrator's coordinate system, text object positioning and ExtendScript API limitations.

---

## 11. Error Handling

The script must handle:

- Empty category names.
- Empty item names.
- Categories without items.
- Invalid angular allocations.
- Negative dimensions.
- Inner radius greater than or equal to outer radius.
- Excessive gaps.
- Missing or invalid font settings.
- Text overflow and unresolved collisions.

The script must validate inputs before creating diagram objects.

Errors must be communicated through understandable messages.

---

## 12. Copyright and Authorization

The script must include developer information.

Developer: ran.yan  
Email: ran.yan.v@outlook.com

The script is developed for daily use at Santenco.

Usage is permitted only for authorized internal company activities, subject to the developer's authorization.

Unauthorized distribution, modification or external use is not permitted.

A copyright and authorization notice should appear in the source code and in the script's initial dialog.

---

## 13. Development Phases

### Phase 1 — Geometry Engine
- Circle and arc generation.
- Equal Distribution.
- Proportional Distribution.
- Manual Distribution.
- Category Gap calculations.
- Starting Angle and Rotation.

### Phase 2 — Item Placement
- Automatic item distribution.
- Manual item angle input.
- Icon placeholder generation.
- Horizontal item labels.
- Radial positioning.

### Phase 3 — Category Labels
- Curved category labels.
- Horizontal category labels.
- Typography settings.

### Phase 4 — Layout Optimization
- Bounding-box collision detection.
- Automatic radial adjustments.
- Collision warnings.

### Phase 5 — UI and Finalization
- Complete script interface.
- Input validation.
- Organized Illustrator layers.
- Error handling.
- Copyright and authorization notice.
- Compatibility testing.

---

## 14. Version 1.0 Acceptance Criteria

Version 1.0 is considered complete when:

1. Users can create multiple categories and items.
2. All three category distribution modes work correctly.
3. Category gaps are calculated correctly.
4. Items are automatically positioned around their assigned category.
5. Users can specify manual item angles.
6. Every item has an independent icon placeholder and text label.
7. Category labels support curved and horizontal layouts.
8. The center reference circle can be generated.
9. Generated objects are fully editable in Illustrator.
10. The layer hierarchy is correctly organized.
11. Invalid inputs are handled without generating corrupted diagrams.
12. The script can be used repeatedly in the same Illustrator document.

**End of Requirements — Version 1.0**