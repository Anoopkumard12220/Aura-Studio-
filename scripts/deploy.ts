#!/usr/bin/env tsx
// Production Deployment Script
// Deploys to Vercel, Netlify, or Cloudflare Pages

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface DeployConfig {
  platform: 'vercel' | 'netlify' | 'cloudflare' | 'all';
  environment: 'preview' | 'production';
  token?: string;
  projectId?: string;
}

function runCommand(cmd: string, cwd?: string): string {
  try {
    return execSync(cmd, { 
      cwd: cwd || process.cwd(),
      encoding: 'utf-8',
      stdio: 'pipe'
    }).trim();
  } catch (error: any) {
    throw new Error(`Command failed: ${cmd}\n${error.stdout || error.message}`);
  }
}

function checkPrerequisites(): void {
  // Check dist exists
  if (!existsSync(join(process.cwd(), 'dist'))) {
    throw new Error('dist/ directory not found. Run "npm run build" first.');
  }
  
  // Check required configs
  const configs = ['vercel.json', 'netlify.toml', 'public/_headers'];
  for (const config of configs) {
    if (!existsSync(join(process.cwd(), config))) {
      console.warn(`⚠️  Missing config: ${config}`);
    }
  }
  
  // Verify build
  console.log('🔍 Verifying build...');
  runCommand('npm run verify:build');
}

async function deployVercel(config: DeployConfig): Promise<void> {
  console.log('\n🚀 Deploying to Vercel...');
  
  const args = [
    'deploy',
    '--prod',
    '--token', config.token || process.env.VERCEL_TOKEN || '',
    '--scope', config.projectId || process.env.VERCEL_ORG_ID || '',
  ];
  
  if (config.environment === 'preview') {
    args.splice(1, 1); // Remove --prod
  }
  
  const cmd = `npx vercel ${args.join(' ')}`;
  const output = runCommand(cmd);
  
  console.log('✅ Vercel deployment complete');
  console.log(output);
}

async function deployNetlify(config: DeployConfig): Promise<void> {
  console.log('\n🚀 Deploying to Netlify...');
  
  const args = [
    'deploy',
    '--dir=dist',
    '--site', config.projectId || process.env.NETLIFY_SITE_ID || '',
    '--auth', config.token || process.env.NETLIFY_AUTH_TOKEN || '',
  ];
  
  if (config.environment === 'production') {
    args.push('--prod');
  }
  
  const cmd = `npx netlify-cli ${args.join(' ')}`;
  const output = runCommand(cmd);
  
  console.log('✅ Netlify deployment complete');
  console.log(output);
}

async function deployCloudflare(config: DeployConfig): Promise<void> {
  console.log('\n🚀 Deploying to Cloudflare Pages...');
  
  // Cloudflare Pages uses Wrangler
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const projectName = config.projectId || 'aura-studio';
  
  if (!accountId) {
    throw new Error('CLOUDFLARE_ACCOUNT_ID environment variable required');
  }
  
  const cmd = `npx wrangler pages deploy dist --project-name=${projectName} --branch=${config.environment === 'production' ? 'main' : 'preview'}`;
  const output = runCommand(cmd);
  
  console.log('✅ Cloudflare Pages deployment complete');
  console.log(output);
}

async function main() {
  const args = process.argv.slice(2);
  
  const config: DeployConfig = {
    platform: 'all',
    environment: 'production',
  };
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--platform':
        config.platform = args[++i] as any;
        break;
      case '--env':
        config.environment = args[++i] as any;
        break;
      case '--token':
        config.token = args[++i];
        break;
      case '--project':
        config.projectId = args[++i];
        break;
      case '--help':
        console.log(`
Usage: npm run deploy -- [options]

Options:
  --platform <vercel|netlify|cloudflare|all>  Target platform (default: all)
  --env <preview|production>                  Environment (default: production)
  --token <token>                             Auth token
  --project <id>                              Project/Site ID
  --help                                      Show this help

Examples:
  npm run deploy -- --platform vercel --env production
  npm run deploy -- --platform netlify --env preview
  npm run deploy -- --platform all --env production
        `);
        process.exit(0);
    }
  }
  
  console.log('═══════════════════════════════════');
  console.log('  AURA STUDIO - PRODUCTION DEPLOYMENT');
  console.log('═══════════════════════════════════');
  console.log(`Platform: ${config.platform}`);
  console.log(`Environment: ${config.environment}`);
  
  try {
    checkPrerequisites();
    
    if (config.platform === 'vercel' || config.platform === 'all') {
      await deployVercel(config);
    }
    
    if (config.platform === 'netlify' || config.platform === 'all') {
      await deployNetlify(config);
    }
    
    if (config.platform === 'cloudflare' || config.platform === 'all') {
      await deployCloudflare(config);
    }
    
    console.log('\n═══════════════════════════════════');
    console.log('  🎉 ALL DEPLOYMENTS COMPLETE');
    console.log('═══════════════════════════════════');
    
  } catch (error: any) {
    console.error('\n❌ DEPLOYMENT FAILED:', error.message);
    process.exit(1);
  }
}

main();