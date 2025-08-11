#!/usr/bin/env node

/**
 * Documentation Maintenance Check Script
 * 
 * This script helps maintainers perform regular documentation maintenance
 * by checking for common issues and providing actionable recommendations.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DOCS_DIR = 'docs';
const MAX_AGE_DAYS = 90; // Documents older than this need review
const REQUIRED_FRONTMATTER = ['title', 'category', 'audience', 'difficulty', 'estimated_time', 'last_updated'];

class DocumentationChecker {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.stats = {
      totalDocs: 0,
      outdatedDocs: 0,
      missingFrontmatter: 0,
      brokenLinks: 0
    };
  }

  log(message, type = 'info') {
    const prefix = {
      'info': '📋',
      'warning': '⚠️',
      'error': '❌',
      'success': '✅'
    }[type] || '📋';
    
    console.log(`${prefix} ${message}`);
  }

  addIssue(message) {
    this.issues.push(message);
  }

  addWarning(message) {
    this.warnings.push(message);
  }

  // Check if a document is outdated
  isOutdated(lastUpdated) {
    if (!lastUpdated) return true;
    
    const lastUpdateDate = new Date(lastUpdated);
    const now = new Date();
    const daysDiff = (now - lastUpdateDate) / (1000 * 60 * 60 * 24);
    
    return daysDiff > MAX_AGE_DAYS;
  }

  // Extract frontmatter from markdown file
  extractFrontmatter(content) {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return null;

    const frontmatter = {};
    const lines = frontmatterMatch[1].split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.*)$/);
      if (match) {
        frontmatter[match[1]] = match[2].replace(/^["']|["']$/g, '');
      }
    }
    
    return frontmatter;
  }

  // Check a single document
  checkDocument(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(process.cwd(), filePath);
      
      this.stats.totalDocs++;

      // Check frontmatter
      const frontmatter = this.extractFrontmatter(content);
      if (!frontmatter) {
        this.addIssue(`Missing frontmatter: ${relativePath}`);
        this.stats.missingFrontmatter++;
        return;
      }

      // Check required frontmatter fields
      const missingFields = REQUIRED_FRONTMATTER.filter(field => !frontmatter[field]);
      if (missingFields.length > 0) {
        this.addIssue(`Missing frontmatter fields in ${relativePath}: ${missingFields.join(', ')}`);
        this.stats.missingFrontmatter++;
      }

      // Check if document is outdated
      if (this.isOutdated(frontmatter.last_updated)) {
        this.addWarning(`Outdated document (>90 days): ${relativePath} (last updated: ${frontmatter.last_updated || 'unknown'})`);
        this.stats.outdatedDocs++;
      }

      // Check for basic content structure
      if (!content.includes('# ')) {
        this.addIssue(`Missing main heading: ${relativePath}`);
      }

      // Check for help section
      if (!content.includes('Getting Help') && !content.includes('🆘')) {
        this.addWarning(`Missing help section: ${relativePath}`);
      }

      // Check for navigation
      if (!content.includes('Navigation:') && !content.includes('🧭')) {
        this.addWarning(`Missing navigation breadcrumbs: ${relativePath}`);
      }

    } catch (error) {
      this.addIssue(`Error reading ${filePath}: ${error.message}`);
    }
  }

  // Recursively find all markdown files
  findMarkdownFiles(dir) {
    const files = [];
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          files.push(...this.findMarkdownFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      this.addIssue(`Error reading directory ${dir}: ${error.message}`);
    }
    
    return files;
  }

  // Check directory structure
  checkStructure() {
    const expectedDirs = ['user', 'admin', 'deployment', 'development', 'templates'];
    const docsPath = path.join(process.cwd(), DOCS_DIR);
    
    if (!fs.existsSync(docsPath)) {
      this.addIssue(`Documentation directory not found: ${DOCS_DIR}`);
      return;
    }

    for (const dir of expectedDirs) {
      const dirPath = path.join(docsPath, dir);
      if (!fs.existsSync(dirPath)) {
        this.addWarning(`Expected directory not found: ${DOCS_DIR}/${dir}`);
      } else {
        // Check for README.md in each category directory
        const readmePath = path.join(dirPath, 'README.md');
        if (!fs.existsSync(readmePath) && dir !== 'templates') {
          this.addIssue(`Missing index file: ${DOCS_DIR}/${dir}/README.md`);
        }
      }
    }
  }

  // Check for orphaned files
  checkOrphanedFiles() {
    const docsPath = path.join(process.cwd(), DOCS_DIR);
    const files = this.findMarkdownFiles(docsPath);
    
    // Simple check for files that might be orphaned
    // (This is a basic implementation - could be enhanced)
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(docsPath, file);
      
      // Check if file is referenced in any index
      let isReferenced = false;
      for (const otherFile of files) {
        if (otherFile === file) continue;
        
        const otherContent = fs.readFileSync(otherFile, 'utf8');
        if (otherContent.includes(path.basename(file)) || 
            otherContent.includes(relativePath)) {
          isReferenced = true;
          break;
        }
      }
      
      if (!isReferenced && !file.includes('README.md') && !file.includes('templates/')) {
        this.addWarning(`Potentially orphaned file: ${relativePath}`);
      }
    }
  }

  // Generate maintenance report
  generateReport() {
    this.log('\n📊 Documentation Maintenance Report', 'info');
    this.log('='.repeat(50), 'info');
    
    // Statistics
    this.log(`\n📈 Statistics:`, 'info');
    this.log(`  Total documents: ${this.stats.totalDocs}`);
    this.log(`  Outdated documents: ${this.stats.outdatedDocs}`);
    this.log(`  Missing frontmatter: ${this.stats.missingFrontmatter}`);
    
    // Issues (critical)
    if (this.issues.length > 0) {
      this.log(`\n❌ Critical Issues (${this.issues.length}):`, 'error');
      this.issues.forEach(issue => this.log(`  • ${issue}`, 'error'));
    }
    
    // Warnings (should be addressed)
    if (this.warnings.length > 0) {
      this.log(`\n⚠️  Warnings (${this.warnings.length}):`, 'warning');
      this.warnings.forEach(warning => this.log(`  • ${warning}`, 'warning'));
    }
    
    // Recommendations
    this.log('\n💡 Maintenance Recommendations:', 'info');
    
    if (this.stats.outdatedDocs > 0) {
      this.log('  • Review and update outdated documents', 'info');
      this.log('  • Update last_updated dates after content review', 'info');
    }
    
    if (this.stats.missingFrontmatter > 0) {
      this.log('  • Add missing frontmatter to documents', 'info');
      this.log('  • Use templates for new documents', 'info');
    }
    
    if (this.issues.length === 0 && this.warnings.length === 0) {
      this.log('  ✅ Documentation is in good shape!', 'success');
    }
    
    this.log('\n🔧 Next Steps:', 'info');
    this.log('  1. Address critical issues first', 'info');
    this.log('  2. Review and update outdated content', 'info');
    this.log('  3. Run quality checks: npm run docs:check (if available)', 'info');
    this.log('  4. Update cross-references and navigation', 'info');
    
    // Return summary for programmatic use
    return {
      totalIssues: this.issues.length,
      totalWarnings: this.warnings.length,
      stats: this.stats,
      issues: this.issues,
      warnings: this.warnings
    };
  }

  // Main check function
  async run() {
    this.log('🔍 Starting documentation maintenance check...', 'info');
    
    // Check directory structure
    this.checkStructure();
    
    // Find and check all markdown files
    const docsPath = path.join(process.cwd(), DOCS_DIR);
    const markdownFiles = this.findMarkdownFiles(docsPath);
    
    this.log(`Found ${markdownFiles.length} markdown files`, 'info');
    
    // Check each document
    for (const file of markdownFiles) {
      this.checkDocument(file);
    }
    
    // Check for orphaned files
    this.checkOrphanedFiles();
    
    // Generate and display report
    return this.generateReport();
  }
}

// CLI interface
async function main() {
  const checker = new DocumentationChecker();
  
  try {
    const report = await checker.run();
    
    // Exit with error code if there are critical issues
    if (report.totalIssues > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error running documentation check:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DocumentationChecker;