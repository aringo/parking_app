#!/usr/bin/env node

/**
 * Deployment Check Script
 * Validates the deployment pipeline and configuration
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DeploymentChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.success = [];
  }

  log(type, message) {
    const timestamp = new Date().toISOString();
    const prefix = {
      error: '❌',
      warning: '⚠️',
      success: '✅',
      info: 'ℹ️'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    if (type === 'error') this.errors.push(message);
    if (type === 'warning') this.warnings.push(message);
    if (type === 'success') this.success.push(message);
  }

  checkFileExists(filePath, required = true) {
    const fullPath = path.resolve(filePath);
    if (fs.existsSync(fullPath)) {
      this.log('success', `File exists: ${filePath}`);
      return true;
    } else {
      const level = required ? 'error' : 'warning';
      this.log(level, `File missing: ${filePath}`);
      return false;
    }
  }

  checkPackageJson() {
    this.log('info', 'Checking package.json configuration...');
    
    if (!this.checkFileExists('package.json')) return;
    
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check required scripts
    const requiredScripts = ['build', 'test', 'lint'];
    requiredScripts.forEach(script => {
      if (packageJson.scripts && packageJson.scripts[script]) {
        this.log('success', `Script exists: ${script}`);
      } else {
        this.log('error', `Missing required script: ${script}`);
      }
    });

    // Check dependencies
    const requiredDeps = ['react', 'react-dom', 'leaflet', 'react-leaflet'];
    requiredDeps.forEach(dep => {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        this.log('success', `Dependency exists: ${dep}`);
      } else {
        this.log('error', `Missing required dependency: ${dep}`);
      }
    });
  }

  checkBuildConfiguration() {
    this.log('info', 'Checking build configuration...');
    
    // Check Vite config
    if (this.checkFileExists('vite.config.ts')) {
      const viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
      if (viteConfig.includes('outDir')) {
        this.log('success', 'Vite output directory configured');
      } else {
        this.log('warning', 'Vite output directory not explicitly configured');
      }
    }

    // Check TypeScript config
    this.checkFileExists('tsconfig.json');
    this.checkFileExists('tsconfig.app.json');
  }

  checkDeploymentConfigs() {
    this.log('info', 'Checking deployment configurations...');
    
    // Check hosting platform configs
    const configs = [
      { file: 'netlify.toml', platform: 'Netlify' },
      { file: 'vercel.json', platform: 'Vercel' },
      { file: '.github/workflows/deploy.yml', platform: 'GitHub Pages' }
    ];

    let hasConfig = false;
    configs.forEach(({ file, platform }) => {
      if (this.checkFileExists(file, false)) {
        this.log('success', `${platform} configuration found`);
        hasConfig = true;
      }
    });

    if (!hasConfig) {
      this.log('error', 'No deployment configuration found');
    }
  }

  checkCORSConfiguration() {
    this.log('info', 'Checking CORS configuration...');
    
    // Check Netlify CORS
    if (fs.existsSync('netlify.toml')) {
      const netlifyConfig = fs.readFileSync('netlify.toml', 'utf8');
      if (netlifyConfig.includes('Access-Control-Allow-Origin')) {
        this.log('success', 'Netlify CORS headers configured');
      } else {
        this.log('warning', 'Netlify CORS headers not found');
      }
    }

    // Check Vercel CORS
    if (fs.existsSync('vercel.json')) {
      const vercelConfig = fs.readFileSync('vercel.json', 'utf8');
      if (vercelConfig.includes('Access-Control-Allow-Origin')) {
        this.log('success', 'Vercel CORS headers configured');
      } else {
        this.log('warning', 'Vercel CORS headers not found');
      }
    }
  }

  checkPublicAssets() {
    this.log('info', 'Checking public assets...');
    
    const publicDir = 'public';
    if (fs.existsSync(publicDir)) {
      this.log('success', 'Public directory exists');
      
      // Check for config.json
      if (this.checkFileExists(path.join(publicDir, 'config.json'))) {
        try {
          const config = JSON.parse(fs.readFileSync(path.join(publicDir, 'config.json'), 'utf8'));
          if (config.branding && config.map && config.dataSource) {
            this.log('success', 'Config.json structure is valid');
          } else {
            this.log('error', 'Config.json missing required sections');
          }
        } catch (e) {
          this.log('error', 'Config.json is not valid JSON');
        }
      }
    } else {
      this.log('error', 'Public directory not found');
    }
  }

  checkBuildOutput() {
    this.log('info', 'Checking build output...');
    
    const distDir = 'dist';
    if (fs.existsSync(distDir)) {
      this.log('success', 'Build output directory exists');
      
      // Check for essential files
      const essentialFiles = ['index.html'];
      essentialFiles.forEach(file => {
        this.checkFileExists(path.join(distDir, file));
      });

      // Check for assets directory
      if (fs.existsSync(path.join(distDir, 'assets'))) {
        this.log('success', 'Assets directory exists in build output');
      } else {
        this.log('warning', 'Assets directory not found in build output');
      }
    } else {
      this.log('warning', 'Build output directory not found (run npm run build first)');
    }
  }

  async checkExternalDependencies() {
    this.log('info', 'Checking external dependencies...');
    
    // Check if we can reach OpenStreetMap tiles
    return new Promise((resolve) => {
      const req = https.get('https://tile.openstreetmap.org/0/0/0.png', (res) => {
        if (res.statusCode === 200) {
          this.log('success', 'OpenStreetMap tiles accessible');
        } else {
          this.log('warning', `OpenStreetMap tiles returned status: ${res.statusCode}`);
        }
        resolve();
      });

      req.on('error', (err) => {
        this.log('warning', `OpenStreetMap tiles check failed: ${err.message}`);
        resolve();
      });

      req.setTimeout(5000, () => {
        req.destroy();
        this.log('warning', 'OpenStreetMap tiles check timed out');
        resolve();
      });
    });
  }

  checkSecurityHeaders() {
    this.log('info', 'Checking security configuration...');
    
    // Check for security headers in hosting configs
    const securityHeaders = [
      'Strict-Transport-Security',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Content-Security-Policy'
    ];

    let hasSecurityConfig = false;

    if (fs.existsSync('netlify.toml')) {
      const netlifyConfig = fs.readFileSync('netlify.toml', 'utf8');
      securityHeaders.forEach(header => {
        if (netlifyConfig.includes(header)) {
          this.log('success', `Security header configured: ${header}`);
          hasSecurityConfig = true;
        }
      });
    }

    if (!hasSecurityConfig) {
      this.log('warning', 'No security headers configured');
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(50));
    console.log('DEPLOYMENT CHECK REPORT');
    console.log('='.repeat(50));
    
    console.log(`\n✅ Successful checks: ${this.success.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);

    if (this.warnings.length > 0) {
      console.log('\nWarnings:');
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    if (this.errors.length > 0) {
      console.log('\nErrors:');
      this.errors.forEach(error => console.log(`  - ${error}`));
    }

    console.log('\n' + '='.repeat(50));
    
    if (this.errors.length === 0) {
      console.log('🎉 Deployment check passed! Ready for production.');
      return true;
    } else {
      console.log('💥 Deployment check failed. Please fix errors before deploying.');
      return false;
    }
  }

  async run() {
    console.log('🚀 Starting deployment check...\n');
    
    this.checkPackageJson();
    this.checkBuildConfiguration();
    this.checkDeploymentConfigs();
    this.checkCORSConfiguration();
    this.checkPublicAssets();
    this.checkBuildOutput();
    this.checkSecurityHeaders();
    
    await this.checkExternalDependencies();
    
    const passed = this.generateReport();
    process.exit(passed ? 0 : 1);
  }
}

// Run the deployment check
const checker = new DeploymentChecker();
checker.run().catch(console.error);