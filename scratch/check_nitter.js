import { execSync } from 'child_process';

const nitterInstances = [
  'nitter.net',
  'nitter.poast.org',
  'nitter.privacydev.net',
  'xcancel.com',
  'nitter.tiekoetter.com'
];

for (const host of nitterInstances) {
  try {
    console.log(`Checking https://${host}/HousebetsHubie/media ...`);
    const cmd = `curl.exe -s -L --max-time 6 "https://${host}/HousebetsHubie/media"`;
    const res = execSync(cmd).toString();
    const matches = res.match(/(?:pic\.twitter\.com\/[A-Za-z0-9]+|pbs\.twimg\.com\/media\/[A-Za-z0-9_-]+)/g);
    if (matches && matches.length > 0) {
      console.log(`Found on ${host}:`, [...new Set(matches)]);
      break;
    }
  } catch (e) {
    console.log(`Failed on ${host}`);
  }
}

