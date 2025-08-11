---
title: "Documentation Style Guide"
category: "development"
audience: "developer"
difficulty: "beginner"
estimated_time: "15 minutes"
last_updated: "2025-01-08"
related_docs:
  - "MAINTENANCE_PROCEDURES.md"
  - "QUALITY_GUIDE.md"
  - "templates/README.md"
---

# 🎨 Documentation Style Guide

> **🎯 Consistent formatting and writing standards** for all Parking Finder project documentation.

This guide ensures all documentation maintains a professional, accessible, and consistent appearance across the project.

## 🧭 Navigation

**🏠 [Documentation Home](README.md)** → Documentation Style Guide

## 📋 Table of Contents

- [Writing Style](#-writing-style)
- [Document Structure](#-document-structure)
- [Markdown Formatting](#-markdown-formatting)
- [Visual Elements](#-visual-elements)
- [Code Examples](#-code-examples)
- [Accessibility Guidelines](#-accessibility-guidelines)

## ✍️ Writing Style

### Voice and Tone

**Professional yet Approachable**
- Use clear, direct language
- Avoid unnecessary jargon or technical complexity
- Write in active voice when possible
- Be helpful and encouraging

**Examples:**
```markdown
✅ Good: "Click the Save button to store your changes."
❌ Avoid: "Changes can be stored by clicking the Save button."

✅ Good: "This guide helps you set up the development environment."
❌ Avoid: "This guide will walk you through the process of setting up..."
```

### Language Guidelines

#### Terminology Consistency
- **Application**: Parking Finder (not "app" or "system")
- **User**: Person using the application (not "customer" or "client")
- **Administrator**: Person managing the system (not "admin" in formal docs)
- **Developer**: Person contributing code (not "programmer" or "coder")

#### Inclusive Language
- Use gender-neutral pronouns (they/them)
- Avoid assumptions about technical knowledge
- Provide context for technical terms
- Use "you" to address the reader directly

#### Common Phrases
```markdown
✅ Preferred: "Complete these steps"
❌ Avoid: "Simply complete these steps"

✅ Preferred: "This process takes about 10 minutes"
❌ Avoid: "This process is quick and easy"

✅ Preferred: "If you encounter issues"
❌ Avoid: "If you run into problems"
```

## 📐 Document Structure

### Required Elements

Every document must include these elements in order:

#### 1. YAML Frontmatter
```yaml
---
title: "Document Title"
category: "user|admin|deployment|development|overview"
audience: "end-user|administrator|developer|all"
difficulty: "beginner|intermediate|advanced"
estimated_time: "X minutes"
last_updated: "YYYY-MM-DD"
related_docs:
  - "path/to/related/doc.md"
---
```

#### 2. Document Header
```markdown
# 📚 Document Title

> **🎯 Brief description** of what this document accomplishes.

One or two sentences explaining the document's purpose and scope.
```

#### 3. Navigation Breadcrumbs
```markdown
## 🧭 Navigation

**🏠 [Documentation Home](../README.md)** → [Category](README.md) → Document Title
```

#### 4. Table of Contents (for documents >5 sections)
```markdown
## 📋 Table of Contents

- [Section 1](#-section-1)
- [Section 2](#-section-2)
- [Getting Help](#-getting-help)
```

### Heading Hierarchy

Use consistent heading levels with emoji prefixes:

```markdown
# 📚 H1: Document Title (only one per document)
## 🧭 H2: Major Sections
### H3: Subsections
#### H4: Detailed Topics
##### H5: Specific Points (use sparingly)
```

### Section Organization

**Standard Section Order:**
1. **Navigation** - Breadcrumb navigation
2. **Table of Contents** - For longer documents
3. **Introduction/Overview** - Context and scope
4. **Main Content** - Core information
5. **Related Documentation** - Cross-references
6. **Getting Help** - Support information

## 📝 Markdown Formatting

### Text Formatting

#### Emphasis
```markdown
**Bold text** for important terms and UI elements
*Italic text* for emphasis and first-time term introduction
`Inline code` for commands, file names, and code snippets
```

#### Lists
```markdown
# Unordered lists
- Use hyphens for consistency
- Maintain parallel structure
- Keep items concise

# Ordered lists
1. Use for sequential steps
2. Number consecutively
3. Include verification steps

# Nested lists
- Main item
  - Sub-item (2 spaces)
  - Another sub-item
- Another main item
```

#### Links
```markdown
# Internal links (relative paths)
[Link text](../category/document.md)
[Section link](#section-heading)

# External links
[External resource](https://example.com)

# Reference-style links (for repeated URLs)
[Link text][reference-id]

[reference-id]: https://example.com
```

### Tables

Use tables for structured data and comparisons:

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |
```

**Table Guidelines:**
- Include header row
- Align columns consistently
- Keep cell content concise
- Use tables for comparison data, not layout

### Blockquotes

Use blockquotes for important callouts:

```markdown
> **🎯 Goal:** What this section accomplishes
> **💡 Tip:** Helpful additional information
> **⚠️ Warning:** Important caution or limitation
> **✅ Success:** Confirmation of correct completion
```

## 🎨 Visual Elements

### Emoji Usage

Use emoji consistently to improve scannability:

#### Category Icons
- 📱 **User content**: End-user focused information
- 🔧 **Admin content**: Administrator procedures
- 🚀 **Deployment content**: Hosting and deployment
- 💻 **Developer content**: Technical development
- 📚 **General content**: Overview and reference

#### Functional Icons
- 🧭 **Navigation**: Breadcrumbs and wayfinding
- 📋 **Lists**: Table of contents and checklists
- 🎯 **Goals**: Purpose and objectives
- 💡 **Tips**: Helpful information
- ⚠️ **Warnings**: Important cautions
- ✅ **Success**: Confirmation indicators
- ❌ **Errors**: Problems and failures
- 🔗 **Links**: Related resources
- 🆘 **Help**: Support and assistance

### Callout Boxes

Use consistent patterns for different types of information:

```markdown
> **🎯 Goal:** Clear statement of what will be accomplished
> 
> Brief explanation of the objective or outcome.

> **💡 Pro Tip:** Additional helpful information
> 
> Context or advanced techniques that enhance the main content.

> **⚠️ Important:** Critical information or warnings
> 
> Information that prevents errors or data loss.

> **✅ Success Indicator:** How to verify completion
> 
> Clear criteria for confirming the task was completed correctly.
```

### Status Indicators

Use consistent indicators for different states:

```markdown
✅ **Complete** - Task finished successfully
🔄 **In Progress** - Currently being worked on
⏳ **Pending** - Waiting for dependencies
❌ **Failed** - Encountered errors
🚧 **Under Construction** - Content being developed
📋 **To Do** - Not yet started
```

## 💻 Code Examples

### Code Blocks

Always specify the language for syntax highlighting:

```markdown
```bash
# Shell commands
npm install
npm run dev
```

```javascript
// JavaScript code
const config = {
  setting: 'value'
};
```

```json
{
  "configuration": "example"
}
```

```yaml
# YAML configuration
key: value
nested:
  item: value
```
```

### Command Examples

Format commands consistently:

```markdown
# Single commands
```bash
npm run docs:create
```

# Multiple commands (separate blocks)
```bash
npm install
```

```bash
npm run dev
```

# Commands with output
```bash
$ npm run test
> parking-finder@1.0.0 test
> vitest run

✓ All tests passed
```
```

### File Content Examples

Show file structure and content clearly:

```markdown
# File structure
```
project/
├── docs/
│   ├── README.md
│   └── user/
│       └── guide.md
└── package.json
```

# Configuration files
```json
// package.json
{
  "name": "parking-finder",
  "scripts": {
    "docs:create": "node scripts/create-doc.cjs"
  }
}
```
```

## ♿ Accessibility Guidelines

### Heading Structure

Maintain proper heading hierarchy:

```markdown
✅ Good hierarchy:
# H1 Document Title
## H2 Major Section
### H3 Subsection
#### H4 Detail

❌ Poor hierarchy:
# H1 Document Title
### H3 Skipped H2
## H2 Out of order
```

### Link Text

Write descriptive link text:

```markdown
✅ Good: [View the deployment troubleshooting guide](deployment/troubleshooting.md)
❌ Poor: [Click here](deployment/troubleshooting.md) for troubleshooting

✅ Good: Learn more about [API authentication methods](api-auth.md)
❌ Poor: [Read more](api-auth.md)
```

### Image Alt Text

Provide descriptive alternative text:

```markdown
![Screenshot of the parking finder application showing a map with parking locations marked](images/app-screenshot.png)

![Diagram illustrating the data flow from user input to map display](images/data-flow-diagram.png)
```

### Color and Contrast

- Don't rely solely on color to convey information
- Use text labels in addition to color coding
- Ensure sufficient contrast for readability

### Keyboard Navigation

- Ensure all interactive elements are keyboard accessible
- Use proper heading structure for screen reader navigation
- Test with keyboard-only navigation

## 📏 Formatting Standards

### Line Length

- Keep lines under 100 characters when possible
- Break long lines at natural points (after punctuation)
- Use line breaks in markdown for readability

### Spacing

```markdown
# Consistent spacing patterns

## Section Heading

Content paragraph with proper spacing.

### Subsection

- List item 1
- List item 2

Another paragraph after the list.

```code block```

Final paragraph.
```

### File Organization

```markdown
# File naming
- Use lowercase with hyphens: `user-guide.md`
- Be descriptive but concise: `deployment-troubleshooting.md`
- Avoid abbreviations: `administration.md` not `admin.md`

# Directory structure
- Group related content in directories
- Use README.md for directory indexes
- Maintain consistent depth (avoid deep nesting)
```

## 🔍 Quality Checklist

Before publishing any documentation, verify:

### Content Quality
- [ ] **Purpose clear**: Document objective is obvious
- [ ] **Audience appropriate**: Content matches intended users
- [ ] **Complete information**: No missing steps or context
- [ ] **Accurate content**: All information is current and correct
- [ ] **Consistent terminology**: Uses standard project terms

### Formatting Standards
- [ ] **Frontmatter complete**: All required metadata present
- [ ] **Heading hierarchy**: Proper H1 → H2 → H3 structure
- [ ] **Consistent emoji**: Follows established patterns
- [ ] **Code formatting**: All code blocks have language specified
- [ ] **Link validation**: All links work and are relevant

### Accessibility Compliance
- [ ] **Alt text provided**: All images have descriptive alt text
- [ ] **Descriptive links**: Link text describes destination
- [ ] **Keyboard accessible**: All content navigable via keyboard
- [ ] **Screen reader friendly**: Proper heading structure
- [ ] **Color independence**: Information not color-dependent

## 🔗 Related Documentation

### Core Style Resources
- **[Maintenance Procedures](MAINTENANCE_PROCEDURES.md)** - Complete maintenance guide
- **[Quality Guide](QUALITY_GUIDE.md)** - Quality assurance tools
- **[Template Library](templates/README.md)** - Document templates

### External Style References
- **[Markdown Guide](https://www.markdownguide.org/)** - Markdown syntax
- **[Plain Language Guidelines](https://www.plainlanguage.gov/)** - Clear writing
- **[WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)** - Accessibility

## 🆘 Getting Help

**Questions about style guidelines?**
- 📧 Create an issue with the `documentation` label
- 💬 Ask in project discussions for clarification
- 📚 Review examples in existing documentation

**Found a style inconsistency?**
- 🐛 Report via GitHub issues
- ✏️ Submit corrections via pull request
- 💡 Suggest style guide improvements

---

> **🎨 Consistent style creates professional, accessible documentation** - use this guide for all content creation.
>
> **🧭 Navigation:** [Documentation Home](README.md) → Documentation Style Guide
>
> *Last updated: 2025-01-08*