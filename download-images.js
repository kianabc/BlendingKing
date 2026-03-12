#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = process.env.PIXABAY_API_KEY;
if (!API_KEY) { console.error('Usage: PIXABAY_API_KEY=xxx node download-images.js'); process.exit(1); }

const WORDS = [
  {w:'cat',e:'🐱'},{w:'bat',e:'🦇'},{w:'hat',e:'🎩'},{w:'rat',e:'🐀'},{w:'van',e:'🚐'},
  {w:'pan',e:'🍳'},{w:'man',e:'👨'},{w:'can',e:'🥫'},{w:'map',e:'🗺️'},{w:'tap',e:'🚰'},
  {w:'bed',e:'🛏️'},{w:'red',e:'🔴'},{w:'hen',e:'🐔'},{w:'pen',e:'🖊️'},{w:'ten',e:'🔟'},
  {w:'pet',e:'🐾'},{w:'net',e:'🥅'},{w:'wet',e:'💧'},{w:'jet',e:'✈️'},{w:'leg',e:'🦵'},
  {w:'pig',e:'🐷'},{w:'big',e:'🔵'},{w:'dig',e:'⛏️'},{w:'hit',e:'💥'},{w:'sit',e:'🪑'},
  {w:'pin',e:'📌'},{w:'fin',e:'🦈'},{w:'win',e:'🏆'},{w:'lip',e:'👄'},{w:'zip',e:'🤐'},
  {w:'dog',e:'🐕'},{w:'log',e:'🪵'},{w:'fog',e:'🌫️'},{w:'hot',e:'🔥'},{w:'pot',e:'🍯'},
  {w:'dot',e:'⚫'},{w:'hop',e:'🐰'},{w:'mop',e:'🧹'},{w:'top',e:'🔝'},{w:'box',e:'📦'},
  {w:'bug',e:'🐛'},{w:'rug',e:'🟫'},{w:'hug',e:'🤗'},{w:'sun',e:'☀️'},{w:'run',e:'🏃'},
  {w:'fun',e:'🎉'},{w:'cup',e:'☕'},{w:'pup',e:'🐶'},{w:'bus',e:'🚌'},{w:'tub',e:'🛁'},
  {w:'frog',e:'🐸'},{w:'stop',e:'🛑'},{w:'clap',e:'👏'},{w:'drip',e:'💧'},{w:'flag',e:'🏁'},
  {w:'slip',e:'🫧'},{w:'snap',e:'🫰'},{w:'trip',e:'🧳'},{w:'grab',e:'✊'},{w:'swim',e:'🏊'},
  {w:'step',e:'👣'},{w:'drum',e:'🥁'},{w:'crab',e:'🦀'},{w:'glad',e:'😊'},{w:'grin',e:'😁'},
  {w:'flip',e:'🔄'},{w:'spot',e:'🔵'},{w:'plop',e:'💦'},{w:'jump',e:'🦘'},{w:'best',e:'⭐'},
  {w:'hand',e:'✋'},{w:'milk',e:'🥛'},{w:'pond',e:'🌊'},{w:'lamp',e:'💡'},{w:'gift',e:'🎁'},
  {w:'belt',e:'👖'},{w:'dust',e:'💨'},{w:'nest',e:'🪹'},{w:'shop',e:'🛒'},{w:'ship',e:'🚢'},
  {w:'fish',e:'🐟'},{w:'dish',e:'🍽️'},{w:'wish',e:'⭐'},{w:'rush',e:'💨'},{w:'chop',e:'🪓'},
  {w:'chin',e:'😊'},{w:'chip',e:'🍟'},{w:'chat',e:'💬'},{w:'thin',e:'📏'},{w:'bath',e:'🛁'},
  {w:'math',e:'➕'},{w:'path',e:'🛤️'},{w:'crush',e:'💪'},{w:'brush',e:'🖌️'},{w:'fresh',e:'🌿'},
  {w:'sunset',e:'🌅'},{w:'hotdog',e:'🌭'},{w:'catnap',e:'😺'},{w:'bathtub',e:'🛁'},
  {w:'catfish',e:'🐟'},{w:'pigpen',e:'🐷'},{w:'sandbox',e:'🏖️'},{w:'cobweb',e:'🕸️'},
  {w:'laptop',e:'💻'},{w:'hilltop',e:'⛰️'},{w:'zigzag',e:'〰️'},{w:'sunlit',e:'☀️'},
  {w:'cannot',e:'🚫'},{w:'dustbin',e:'🗑️'},{w:'eggcup',e:'🥚'},{w:'nutmeg',e:'🥜'},
  {w:'rabbit',e:'🐰'},{w:'kitten',e:'🐱'},{w:'muffin',e:'🧁'},{w:'button',e:'🔘'},
  {w:'mitten',e:'🧤'},{w:'ribbon',e:'🎀'},{w:'cotton',e:'☁️'},{w:'puppet',e:'🎭'},
  {w:'hammer',e:'🔨'},{w:'ladder',e:'🪜'},{w:'dinner',e:'🍽️'},{w:'letter',e:'✉️'},
  {w:'butter',e:'🧈'},{w:'summer',e:'☀️'},{w:'winter',e:'❄️'},
  {w:'happy',e:'😊'},{w:'funny',e:'😂'},{w:'sunny',e:'🌞'},{w:'puppy',e:'🐶'},
  {w:'bunny',e:'🐰'},{w:'penny',e:'💰'},{w:'jelly',e:'🟣'},{w:'foggy',e:'🌫️'},
  {w:'muddy',e:'🟤'},{w:'silly',e:'🤪'},
  {w:'banana',e:'🍌'},{w:'tomato',e:'🍅'},{w:'potato',e:'🥔'},{w:'animal',e:'🐾'},
  {w:'elephant',e:'🐘'},{w:'umbrella',e:'☂️'},{w:'dinosaur',e:'🦕'},{w:'butterfly',e:'🦋'},
  {w:'ladybug',e:'🐞'},{w:'kangaroo',e:'🦘'},{w:'octopus',e:'🐙'},{w:'broccoli',e:'🥦'},
  {w:'pineapple',e:'🍍'},{w:'hamburger',e:'🍔'},{w:'lemonade',e:'🍋'},{w:'alphabet',e:'🔤'},
  {w:'basketball',e:'🏀'},{w:'wonderful',e:'🌟'},{w:'adventure',e:'🗺️'},{w:'fantastic',e:'✨'},
  {w:'dragonfly',e:'🪰'},{w:'grandfather',e:'👴'},{w:'understand',e:'🧠'},{w:'together',e:'🤝'},
  {w:'yesterday',e:'📅'},{w:'crocodile',e:'🐊'},{w:'strawberry',e:'🍓'},{w:'trampoline',e:'🤸'},
  {w:'important',e:'❗'},{w:'remember',e:'💭'},
];

// Better search terms for words that are abstract or have poor direct image results
const SEARCH_OVERRIDES = {
  'bat': 'baseball bat', 'can': 'tin can', 'tap': 'water tap faucet', 'red': 'red color paint',
  'ten': 'number ten', 'pet': 'pet animal cute', 'wet': 'wet rain water', 'big': 'big elephant large',
  'dig': 'digging shovel', 'hit': 'baseball hit', 'sit': 'child sitting chair', 'fin': 'shark fin',
  'win': 'trophy winner', 'zip': 'zipper', 'fog': 'foggy weather', 'hot': 'hot fire flame',
  'dot': 'red dot circle', 'hop': 'rabbit hopping', 'top': 'spinning top toy', 'rug': 'carpet rug',
  'hug': 'hug embrace', 'run': 'running child', 'fun': 'children playing fun',
  'pup': 'puppy dog small', 'drip': 'water drip drop', 'slip': 'banana slip',
  'snap': 'finger snap', 'trip': 'travel suitcase trip', 'grab': 'hand grabbing',
  'glad': 'happy glad child', 'grin': 'smiling grin face', 'flip': 'pancake flip',
  'spot': 'dalmatian spot dog', 'plop': 'water splash plop', 'best': 'gold medal best',
  'dust': 'dust particles', 'rush': 'running rush hurry', 'chin': 'face chin',
  'thin': 'thin pencil', 'crush': 'fruit crush juice', 'fresh': 'fresh vegetables',
  'catnap': 'cat sleeping nap', 'pigpen': 'pig pen farm', 'sunlit': 'sunlit meadow',
  'cannot': 'stop sign no', 'cotton': 'cotton plant fluffy', 'happy': 'happy child smiling',
  'funny': 'funny clown laughing', 'silly': 'silly face child', 'muddy': 'muddy puddle boots',
  'foggy': 'foggy morning', 'wonderful': 'wonderful rainbow', 'fantastic': 'fireworks celebration',
  'adventure': 'adventure treasure map', 'important': 'important exclamation',
  'understand': 'light bulb idea', 'together': 'friends together holding hands',
  'yesterday': 'calendar yesterday', 'remember': 'thinking remembering brain',
  'alphabet': 'alphabet letters abc', 'catfish': 'catfish swimming',
};

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`)); return; }
        resolve(JSON.parse(data));
      });
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        downloadFile(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', e => { fs.unlinkSync(dest); reject(e); });
  });
}

async function main() {
  const imgDir = path.join(__dirname, 'images');
  fs.mkdirSync(imgDir, { recursive: true });

  let done = 0, failed = 0, skipped = 0;

  for (const word of WORDS) {
    const dest = path.join(imgDir, word.w + '.jpg');
    if (fs.existsSync(dest)) { skipped++; continue; }

    const query = SEARCH_OVERRIDES[word.w] || word.w;
    const url = `https://pixabay.com/api/?key=${API_KEY}&q=${encodeURIComponent(query)}&image_type=illustration&per_page=5&safesearch=true&min_width=200&min_height=200`;

    try {
      const data = await fetchJSON(url);

      // Try illustration first, fall back to photo
      let imgUrl = null;
      if (data.hits && data.hits.length > 0) {
        imgUrl = data.hits[0].webformatURL;
      } else {
        // Retry with photo type
        const url2 = `https://pixabay.com/api/?key=${API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=5&safesearch=true&min_width=200&min_height=200`;
        const data2 = await fetchJSON(url2);
        if (data2.hits && data2.hits.length > 0) {
          imgUrl = data2.hits[0].webformatURL;
        }
      }

      if (imgUrl) {
        await downloadFile(imgUrl, dest);
        done++;
        console.log(`  ✓ ${word.w} (${done + skipped}/${WORDS.length})`);
      } else {
        console.log(`  ✗ ${word.w} — no results, will use emoji fallback`);
        failed++;
      }

      // Rate limit: Pixabay allows 100 requests/minute
      await new Promise(r => setTimeout(r, 700));
    } catch (e) {
      console.error(`  ✗ ${word.w} — ${e.message}`);
      failed++;
    }
  }

  console.log(`\nDone! Downloaded: ${done}, Skipped (existing): ${skipped}, Failed: ${failed}`);
  console.log(`Total images in folder: ${fs.readdirSync(imgDir).filter(f => f.endsWith('.jpg')).length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
