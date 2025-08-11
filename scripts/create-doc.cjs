#!/usr/bin/env node

/**
 * Documentation Creation Helper Script
 * 
 * This script helps maintainers create new documentation files using
 * standardized templates with proper metadata and structure.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Available templates
const TEMPLATES = {
  'standard': {
    file: 'standard-document.md',
    name: 'Standard Document',
    description: 'General documentation guide'
  },
  'index': {
    file: 'index-page.md',
    name: 'Index Page',
    description: 'Category overview page'
  },
  'step-by-step': {
    file: 'step-by-step-guide.md',
    name: 'Step-by-Step Guide',
    description: 'Procedural instructions'
  },
  'troubleshooting': {
    file: 'troubleshooting-guide.md',
    name: 'Troubleshooting Guide',
    description: 'Problem resolution guide'
  }
};

const CATEGORIES = ['user', 'admin', 'deployment', 'development', 'overview'];
const AUDIENCES = ['end-user', 'administrator', 'developer', 'all'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function validateInput(input, validOptions, allowEmpty = false) {
  if (allowEmpty && !input.trim()) return true;
  return validOptions.includes(input.toLowerCase());
}

function getCurrentDate() {
  return new Date().toISOString().split('T')[0];
}

async function main() {
  console.log('📝 Documentation Creation Helper\n');
  console.log('This script helps you create new documentation using standardized templates.\n');

  try {
    // Template selection
    console.log('Available templates:');
    Object.entries(TEMPLATES).forEach(([key, template]) => {
      console.log(`  ${key}: ${template.name} - ${template.description}`);
    });
    
    let templateType;
    do {
      templateType = await question('\nSelect template type: ');
      if (!TEMPLATES[templateType]) {
        console.log('Invalid template type. Please choose from: ' + Object.keys(TEMPLATES).join(', '));
      }
    } while (!TEMPLATES[templateType]);

    // Document details
    const title = await question('Document title: ');
    if (!title.trim()) {
      console.log('Title is required.');
      process.exit(1);
    }

    let category;
    do {
      category = await question(`Category (${CATEGORIES.join(', ')}): `);
      if (!validateInput(category, CATEGORIES)) {
        console.log('Invalid category. Please choose from: ' + CATEGORIES.join(', '));
      }
    } while (!validateInput(category, CATEGORIES));

    let audience;
    do {
      audience = await question(`Audience (${AUDIENCES.join(', ')}): `);
      if (!validateInput(audience, AUDIENCES)) {
        console.log('Invalid audience. Please choose from: ' + AUDIENCES.join(', '));
      }
    } while (!validateInput(audience, AUDIENCES));

    let difficulty;
    do {
      difficulty = await question(`Difficulty (${DIFFICULTIES.join(', ')}): `);
      if (!validateInput(difficulty, DIFFICULTIES)) {
        console.log('Invalid difficulty. Please choose from: ' + DIFFICULTIES.join(', '));
      }
    } while (!validateInput(difficulty, DIFFICULTIES));

    const estimatedTime = await question('Estimated reading time (e.g., "15 minutes"): ');
    if (!estimatedTime.trim()) {
      console.log('Estimated time is required.');
      process.exit(1);
    }

    // File path
    const fileName = await question('File name (without .md extension): ');
    if (!fileName.trim()) {
      console.log('File name is required.');
      process.exit(1);
    }

    const filePath = path.join('docs', category, `${fileName}.md`);
    
    // Check if file already exists
    if (fs.existsSync(filePath)) {
      const overwrite = await question(`File ${filePath} already exists. Overwrite? (y/N): `);
      if (overwrite.toLowerCase() !== 'y') {
        console.log('Operation cancelled.');
        process.exit(0);
      }
    }

    // Load template
    const templatePath = path.join('docs', 'templates', TEMPLATES[templateType].file);
    if (!fs.existsSync(templatePath)) {
      console.log(`Template file not found: ${templatePath}`);
      process.exit(1);
    }

    let templateContent = fs.readFileSync(templatePath, 'utf8');

    // Replace placeholders
    templateContent = templateContent
      .replace(/Document Title/g, title)
      .replace(/category-name/g, category)
      .replace(/appropriate-category/g, category)
      .replace(/target-audience/g, audience)
      .replace(/appropriate-level/g, difficulty)
      .replace(/beginner|intermediate|advanced/g, difficulty)
      .replace(/X minutes/g, estimatedTime)
      .replace(/YYYY-MM-DD/g, getCurrentDate());

    // Create directory if it doesn't exist
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }

    // Write file
    fs.writeFileSync(filePath, templateContent);
    console.log(`\n✅ Created: ${filePath}`);
    
    // Next steps
    console.log('\n📋 Next steps:');
    console.log('1. Edit the created file to add your content');
    console.log('2. Update related_docs in the frontmatter');
    console.log('3. Add cross-references to related documents');
    console.log('4. Run quality checks: npm run docs:check');
    console.log('5. Update category index if needed');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}