import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Load API keys from project root .env (Next.js only reads renderer/.env)
const __dirname = dirname(fileURLToPath(import.meta.url));
const parentEnv = resolve(__dirname, '..', '.env');
const apiKeyVars = new Set(['FANART_API_KEY', 'ACOUSTID_API_KEY']);
if (existsSync(parentEnv)) {
  for (const line of readFileSync(parentEnv, 'utf-8').split('\n')) {
    const m = line.match(/^\s*([^#=][^=]*?)\s*=\s*(.*?)\s*$/);
    if (m && apiKeyVars.has(m[1]) && m[2] && !process.env[m[1]]) {
      process.env[m[1]] = m[2];
    }
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3', 'sharp', 'node-taglib-sharp', 'music-metadata'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'coverartarchive.org' },
      { protocol: 'https', hostname: 'assets.fanart.tv' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ],
  },
};

export default nextConfig;
