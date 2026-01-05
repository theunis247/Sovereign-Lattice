#!/usr/bin/env node

/**
 * Create GitHub-ready copy of Sovereign Lattice
 * This script copies all necessary files for GitHub publication
 * while excluding sensitive data and local files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Creating GitHub-ready copy of Sovereign Lattice...\n');

// Create github-files directory
const githubDir = 'github-files';
if (fs.existsSync(githubDir)) {
  console.log('📁 Removing existing github-files directory...');
  fs.rmSync(githubDir, { recursive: true, force: true });
}

fs.mkdirSync(githubDir);
console.log('✅ Created github-files directory\n');

// Files and directories to include
const includePatterns = [
  // Core application files
  'components/**/*',
  'services/**/*',
  'contracts/**/*',
  'test/**/*',
  'scripts/**/*',
  '.github/**/*',
  
  // Configuration files
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vite.config.ts',
  'hardhat.config.cjs',
  'netlify.toml',
  'vercel.json',
  
  // Application entry points
  'App.tsx',
  'index.tsx',
  'index.html',
  'types.ts',
  
  // Documentation
  'README.md',
  'DEPLOYMENT_GUIDE.md',
  'CONTRIBUTING.md',
  'LICENSE',
  'SECURITY_CHECKLIST.md',
  'GITHUB_DESCRIPTION.md',
  'GITHUB_SETUP_CHECKLIST.md',
  'DEPLOYMENT_INFO.json',
  'QUICK_DEPLOY.md',
  
  // Environment template (safe)
  '.env.example',
  
  // Git configuration
  '.gitignore',
  
  // Assets
  'metadata.json'
];

// Files and directories to exclude (sensitive or unnecessary)
const excludePatterns = [
  '.env.local',
  '.env',
  'node_modules/**/*',
  'dist/**/*',
  'cache/**/*',
  'artifacts/**/*',
  '.vercel/**/*',
  '.vscode/**/*',
  '.kiro/**/*',
  '*.log',
  'Certification template.pdf'
];

// Copy function
function copyFileSync(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

// Check if file should be excluded
function shouldExclude(filePath) {
  return excludePatterns.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
    return regex.test(filePath);
  });
}

// Recursively copy directory
function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) return;
  
  const items = fs.readdirSync(src);
  
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const relativePath = path.relative('.', srcPath);
    
    if (shouldExclude(relativePath)) {
      continue;
    }
    
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

// Copy all files
console.log('📋 Copying project files...');

// Copy root files
const rootFiles = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vite.config.ts',
  'hardhat.config.cjs',
  'netlify.toml',
  'vercel.json',
  'App.tsx',
  'index.tsx',
  'index.html',
  'types.ts',
  'README.md',
  'DEPLOYMENT_GUIDE.md',
  'CONTRIBUTING.md',
  'LICENSE',
  'SECURITY_CHECKLIST.md',
  'GITHUB_DESCRIPTION.md',
  'GITHUB_SETUP_CHECKLIST.md',
  'DEPLOYMENT_INFO.json',
  'QUICK_DEPLOY.md',
  '.env.example',
  '.gitignore',
  'metadata.json'
];

let copiedFiles = 0;
let skippedFiles = 0;

for (const file of rootFiles) {
  if (fs.existsSync(file) && !shouldExclude(file)) {
    copyFileSync(file, path.join(githubDir, file));
    copiedFiles++;
    console.log(`  ✅ ${file}`);
  } else {
    skippedFiles++;
    console.log(`  ⏭️  ${file} (not found or excluded)`);
  }
}

// Copy directories
const directories = ['components', 'services', 'contracts', 'test', 'scripts', '.github'];

for (const dir of directories) {
  if (fs.existsSync(dir)) {
    console.log(`\n📁 Copying ${dir}/ directory...`);
    copyDirectory(dir, path.join(githubDir, dir));
    
    // Count files in directory
    const countFiles = (dirPath) => {
      let count = 0;
      if (!fs.existsSync(dirPath)) return count;
      
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
          count += countFiles(itemPath);
        } else {
          count++;
        }
      }
      return count;
    };
    
    const fileCount = countFiles(path.join(githubDir, dir));
    console.log(`  ✅ Copied ${fileCount} files from ${dir}/`);
    copiedFiles += fileCount;
  }
}

// Create GitHub-specific README
console.log('\n📝 Creating GitHub-optimized README...');
const githubReadme = fs.readFileSync('.github/README_TEMPLATE.md', 'utf8');
fs.writeFileSync(path.join(githubDir, 'README.md'), githubReadme);
console.log('  ✅ Updated README.md with GitHub template');

// Create deployment instructions
console.log('\n🚀 Creating deployment summary...');
const deploymentSummary = `# 🚀 Quick Deployment Summary

## Instant Deploy Options:

### Vercel (Recommended)
\`\`\`bash
npm i -g vercel
vercel
\`\`\`

### Netlify
\`\`\`bash
npm run build
# Upload dist/ folder to netlify.com
\`\`\`

### GitHub Pages
\`\`\`bash
npm install --save-dev gh-pages
npx gh-pages -d dist
\`\`\`

## Environment Setup:
1. Copy \`.env.example\` to \`.env.local\`
2. Add your API keys
3. Deploy!

## Repository Description (350 chars):
🔬💎 Revolutionary AI-powered crypto platform where users earn real QBS tokens through scientific breakthroughs. DeepSeek AI evaluates discoveries, blockchain mints rewards. Features MetaMask integration, military-grade security, multi-network support. Transform research into cryptocurrency! 🚀

Ready for GitHub publication! 🎉
`;

fs.writeFileSync(path.join(githubDir, 'DEPLOY_QUICK.md'), deploymentSummary);
console.log('  ✅ Created DEPLOY_QUICK.md');

// Security verification
console.log('\n🔒 Running security verification...');

// Check for any remaining sensitive data
const sensitivePatterns = [
  /sk-[a-zA-Z0-9]{20,}/g,
  /0x[a-fA-F0-9]{64}/g,
  /DEEPSEEK_API_KEY.*=.*sk-/g,
  /PRIVATE_KEY.*=.*0x/g
];

let securityIssues = 0;

function scanFileForSecrets(filePath) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  for (const pattern of sensitivePatterns) {
    if (pattern.test(content)) {
      console.log(`  ⚠️  Potential secret found in ${filePath}`);
      securityIssues++;
    }
  }
}

// Scan all copied files
function scanDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  
  const items = fs.readdirSync(dirPath);
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      scanDirectory(itemPath);
    } else {
      scanFileForSecrets(itemPath);
    }
  }
}

scanDirectory(githubDir);

if (securityIssues === 0) {
  console.log('  ✅ No security issues found - Safe for GitHub!');
} else {
  console.log(`  ⚠️  Found ${securityIssues} potential security issues`);
}

// Final summary
console.log('\n' + '='.repeat(60));
console.log('🎉 GitHub Copy Creation Complete!');
console.log('='.repeat(60));
console.log(`📁 Location: ./${githubDir}/`);
console.log(`📊 Files copied: ${copiedFiles}`);
console.log(`🔒 Security status: ${securityIssues === 0 ? 'SECURE ✅' : 'NEEDS REVIEW ⚠️'}`);
console.log('\n🚀 Next Steps:');
console.log('1. Review the files in github-files/ directory');
console.log('2. Create new GitHub repository');
console.log('3. Upload the contents of github-files/');
console.log('4. Add repository description and tags');
console.log('5. Enable GitHub features (Issues, Wiki, etc.)');
console.log('\n💡 Repository Description (350 chars):');
console.log('🔬💎 Revolutionary AI-powered crypto platform where users earn real QBS tokens through scientific breakthroughs. DeepSeek AI evaluates discoveries, blockchain mints rewards. Features MetaMask integration, military-grade security, multi-network support. Transform research into cryptocurrency! 🚀');
console.log('\n🌟 Your Sovereign Lattice is ready for the world!');