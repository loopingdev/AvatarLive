import fs from 'fs';
import { execSync } from 'child_process';

const cmd = `curl.exe -s -L "https://x.com/HousebetsHubie" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"`;
const html = execSync(cmd, { maxBuffer: 15 * 1024 * 1024 }).toString();

const statusRegex = /status\/(\d+)/g;
const statuses = [...new Set([...html.matchAll(statusRegex)].map(m => m[1]))];
console.log('Tweet IDs found on page:', statuses);

// Let's also search for photo URLs or tweet text
const tweetTexts = [...html.matchAll(/<div[^>]*dir="auto"[^>]*>(.*?)<\/div>/g)].map(m => m[1]).filter(t => t.length > 20 && !t.includes('<div'));
console.log('Sample tweet texts:', tweetTexts.slice(0, 10));

