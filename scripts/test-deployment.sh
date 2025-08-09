#!/bin/bash

# Test Deployment Pipeline Script
# This script tests the complete deployment pipeline from development to production

set -e  # Exit on any error

echo "🚀 Testing Parking Finder Deployment Pipeline"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "error")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "info")
            echo -e "ℹ️  $message"
            ;;
    esac
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_status "error" "package.json not found. Please run this script from the parking-finder directory."
    exit 1
fi

print_status "info" "Step 1: Checking dependencies..."

# Check Node.js version
NODE_VERSION=$(node --version)
print_status "info" "Node.js version: $NODE_VERSION"

if ! command -v npm &> /dev/null; then
    print_status "error" "npm is not installed"
    exit 1
fi

print_status "success" "Node.js and npm are available"

print_status "info" "Step 2: Installing dependencies..."

# Install dependencies
if npm ci; then
    print_status "success" "Dependencies installed successfully"
else
    print_status "error" "Failed to install dependencies"
    exit 1
fi

print_status "info" "Step 3: Running linting..."

# Run linting
if npm run lint; then
    print_status "success" "Linting passed"
else
    print_status "error" "Linting failed"
    exit 1
fi

print_status "info" "Step 4: Running tests..."

# Run tests
if npm run test:run; then
    print_status "success" "All tests passed"
else
    print_status "error" "Tests failed"
    exit 1
fi

print_status "info" "Step 5: Building application..."

# Build the application
if npm run build; then
    print_status "success" "Build completed successfully"
else
    print_status "error" "Build failed"
    exit 1
fi

print_status "info" "Step 6: Checking build output..."

# Check if build output exists
if [ -d "dist" ]; then
    print_status "success" "Build output directory exists"
    
    # Check for essential files
    if [ -f "dist/index.html" ]; then
        print_status "success" "index.html found in build output"
    else
        print_status "error" "index.html not found in build output"
        exit 1
    fi
    
    if [ -d "dist/assets" ]; then
        print_status "success" "Assets directory found in build output"
    else
        print_status "warning" "Assets directory not found in build output"
    fi
else
    print_status "error" "Build output directory not found"
    exit 1
fi

print_status "info" "Step 7: Testing preview server..."

# Start preview server in background and test it
npm run preview &
PREVIEW_PID=$!

# Wait for server to start
sleep 5

# Test if server is responding
if curl -f -s http://localhost:4173 > /dev/null; then
    print_status "success" "Preview server is responding"
else
    print_status "error" "Preview server is not responding"
    kill $PREVIEW_PID 2>/dev/null || true
    exit 1
fi

# Kill preview server
kill $PREVIEW_PID 2>/dev/null || true

print_status "info" "Step 8: Running deployment checks..."

# Run deployment check script
if node scripts/deployment-check.js; then
    print_status "success" "Deployment checks passed"
else
    print_status "error" "Deployment checks failed"
    exit 1
fi

print_status "info" "Step 9: Checking deployment configurations..."

# Check for deployment configuration files
CONFIGS_FOUND=0

if [ -f "netlify.toml" ]; then
    print_status "success" "Netlify configuration found"
    CONFIGS_FOUND=$((CONFIGS_FOUND + 1))
fi

if [ -f "vercel.json" ]; then
    print_status "success" "Vercel configuration found"
    CONFIGS_FOUND=$((CONFIGS_FOUND + 1))
fi

if [ -f ".github/workflows/deploy.yml" ]; then
    print_status "success" "GitHub Actions workflow found"
    CONFIGS_FOUND=$((CONFIGS_FOUND + 1))
fi

if [ $CONFIGS_FOUND -eq 0 ]; then
    print_status "error" "No deployment configurations found"
    exit 1
else
    print_status "success" "$CONFIGS_FOUND deployment configuration(s) found"
fi

print_status "info" "Step 10: Validating configuration files..."

# Validate JSON files
if [ -f "vercel.json" ]; then
    if python3 -m json.tool vercel.json > /dev/null 2>&1; then
        print_status "success" "vercel.json is valid JSON"
    else
        print_status "error" "vercel.json is not valid JSON"
        exit 1
    fi
fi

if [ -f "public/config.json" ]; then
    if python3 -m json.tool public/config.json > /dev/null 2>&1; then
        print_status "success" "config.json is valid JSON"
    else
        print_status "error" "config.json is not valid JSON"
        exit 1
    fi
fi

print_status "info" "Step 11: Checking file sizes..."

# Check build output size
BUILD_SIZE=$(du -sh dist | cut -f1)
print_status "info" "Build output size: $BUILD_SIZE"

# Check for large files that might slow down deployment
find dist -type f -size +1M -exec ls -lh {} \; | while read -r line; do
    filename=$(echo "$line" | awk '{print $9}')
    size=$(echo "$line" | awk '{print $5}')
    print_status "warning" "Large file detected: $filename ($size)"
done

echo ""
echo "=============================================="
print_status "success" "🎉 Deployment pipeline test completed successfully!"
echo "=============================================="
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub repository"
echo "2. Connect your repository to your chosen hosting platform:"
echo "   - Netlify: https://app.netlify.com/start"
echo "   - Vercel: https://vercel.com/new"
echo "   - GitHub Pages: Enable in repository settings"
echo "3. Configure your custom domain (optional)"
echo "4. Set up the Google Apps Script integration"
echo ""
print_status "info" "Your Parking Finder application is ready for deployment!"