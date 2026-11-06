import fs from 'fs';

(async () => {
  const cssUrl = 'https://www.housebets.com/static/platform-housegames-road-game.css?v=80ea9d855d72';
  const jsUrl = 'https://www.housebets.com/static/platform-housegames-road-game.js?v=0ec6b9f6e96a';

  console.log('Fetching CSS & JS...');
  const [cssRes, jsRes] = await Promise.all([fetch(cssUrl), fetch(jsUrl)]);
  const cssText = await cssRes.text();
  const jsText = await jsRes.text();

  const combined = cssText + '\n' + jsText;

  // Find all matches for images/surf/... or .webp or .png
  const imgMatches = combined.match(/[\w\-\/]+\.(webp|png|svg|jpg)/gi) || [];
  const unique = Array.from(new Set(imgMatches));
  console.log('All image filenames found:');
  console.log(JSON.stringify(unique, null, 2));

  // Find specifically Hubie / jump / walk / stand / fall / move
  const hubieSpecific = unique.filter(f => /hubie|jump|walk|run|stand|fall|surf|splash|hop/i.test(f));
  console.log('\nHubie / Movement specific assets:');
  console.log(JSON.stringify(hubieSpecific, null, 2));
})();

