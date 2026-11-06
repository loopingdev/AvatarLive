(async () => {
  const jsUrl = 'https://www.housebets.com/static/platform-housegames-road-game.js?v=0ec6b9f6e96a';
  const res = await fetch(jsUrl);
  const text = await res.text();
  
  // Find where cash out button text is created or updated
  let pos = 0;
  while ((pos = text.indexOf('cashOut', pos)) !== -1) {
    console.log(`[cashOut] at ${pos}: ${text.substring(Math.max(0, pos - 40), pos + 120)}`);
    pos += 7;
  }
})();
