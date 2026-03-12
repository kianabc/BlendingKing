#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = process.env.GOOGLE_TTS_API_KEY;
if (!API_KEY) { console.error('Usage: GOOGLE_TTS_API_KEY=xxx node generate-audio.js'); process.exit(1); }

const VOICE = { languageCode: 'en-US', name: 'en-US-Neural2-F', ssmlGender: 'FEMALE' };
const AUDIO_CFG = { audioEncoding: 'MP3', speakingRate: 1.0 };

/* IPA for individual phoneme sounds (used in See & Sound tapping mode) */
const PH_IPA = {
  'a':'æː','e':'ɛː','i':'ɪː','o':'ɑː','u':'ʌː',
  'b':'bʌ','c':'kʌ','d':'dʌ','f':'fːː','g':'ɡʌ',
  'h':'hʌ','j':'dʒʌ','k':'kʌ','l':'lːː','m':'mːː',
  'n':'nːː','p':'pʌ','r':'ɹːː','s':'sːː','t':'tʌ',
  'v':'vːː','w':'wʌ','x':'ks','y':'jʌ','z':'zːː',
  'sh':'ʃːː','ch':'tʃʌ','th':'θːː','wh':'wʌ'
};

/* Word bank (same as index.html) */
const WORDS = [
  {w:'cat',p:['c','a','t'],lv:1},{w:'bat',p:['b','a','t'],lv:1},{w:'hat',p:['h','a','t'],lv:1},
  {w:'rat',p:['r','a','t'],lv:1},{w:'van',p:['v','a','n'],lv:1},{w:'pan',p:['p','a','n'],lv:1},
  {w:'man',p:['m','a','n'],lv:1},{w:'can',p:['c','a','n'],lv:1},{w:'map',p:['m','a','p'],lv:1},
  {w:'tap',p:['t','a','p'],lv:1},
  {w:'bed',p:['b','e','d'],lv:1},{w:'red',p:['r','e','d'],lv:1},{w:'hen',p:['h','e','n'],lv:1},
  {w:'pen',p:['p','e','n'],lv:1},{w:'ten',p:['t','e','n'],lv:1},{w:'pet',p:['p','e','t'],lv:1},
  {w:'net',p:['n','e','t'],lv:1},{w:'wet',p:['w','e','t'],lv:1},{w:'jet',p:['j','e','t'],lv:1},
  {w:'leg',p:['l','e','g'],lv:1},
  {w:'pig',p:['p','i','g'],lv:1},{w:'big',p:['b','i','g'],lv:1},{w:'dig',p:['d','i','g'],lv:1},
  {w:'hit',p:['h','i','t'],lv:1},{w:'sit',p:['s','i','t'],lv:1},{w:'pin',p:['p','i','n'],lv:1},
  {w:'fin',p:['f','i','n'],lv:1},{w:'win',p:['w','i','n'],lv:1},{w:'lip',p:['l','i','p'],lv:1},
  {w:'zip',p:['z','i','p'],lv:1},
  {w:'dog',p:['d','o','g'],lv:1},{w:'log',p:['l','o','g'],lv:1},{w:'fog',p:['f','o','g'],lv:1},
  {w:'hot',p:['h','o','t'],lv:1},{w:'pot',p:['p','o','t'],lv:1},{w:'dot',p:['d','o','t'],lv:1},
  {w:'hop',p:['h','o','p'],lv:1},{w:'mop',p:['m','o','p'],lv:1},{w:'top',p:['t','o','p'],lv:1},
  {w:'box',p:['b','o','x'],lv:1},
  {w:'bug',p:['b','u','g'],lv:1},{w:'rug',p:['r','u','g'],lv:1},{w:'hug',p:['h','u','g'],lv:1},
  {w:'sun',p:['s','u','n'],lv:1},{w:'run',p:['r','u','n'],lv:1},{w:'fun',p:['f','u','n'],lv:1},
  {w:'cup',p:['c','u','p'],lv:1},{w:'pup',p:['p','u','p'],lv:1},{w:'bus',p:['b','u','s'],lv:1},
  {w:'tub',p:['t','u','b'],lv:1},
  {w:'frog',p:['f','r','o','g'],lv:1},{w:'stop',p:['s','t','o','p'],lv:1},
  {w:'clap',p:['c','l','a','p'],lv:1},{w:'drip',p:['d','r','i','p'],lv:1},
  {w:'flag',p:['f','l','a','g'],lv:1},{w:'slip',p:['s','l','i','p'],lv:1},
  {w:'snap',p:['s','n','a','p'],lv:1},{w:'trip',p:['t','r','i','p'],lv:1},
  {w:'grab',p:['g','r','a','b'],lv:1},{w:'swim',p:['s','w','i','m'],lv:1},
  {w:'step',p:['s','t','e','p'],lv:1},{w:'drum',p:['d','r','u','m'],lv:1},
  {w:'crab',p:['c','r','a','b'],lv:1},{w:'glad',p:['g','l','a','d'],lv:1},
  {w:'grin',p:['g','r','i','n'],lv:1},{w:'flip',p:['f','l','i','p'],lv:1},
  {w:'spot',p:['s','p','o','t'],lv:1},{w:'plop',p:['p','l','o','p'],lv:1},
  {w:'jump',p:['j','u','m','p'],lv:1},{w:'best',p:['b','e','s','t'],lv:1},
  {w:'hand',p:['h','a','n','d'],lv:1},{w:'milk',p:['m','i','l','k'],lv:1},
  {w:'pond',p:['p','o','n','d'],lv:1},{w:'lamp',p:['l','a','m','p'],lv:1},
  {w:'gift',p:['g','i','f','t'],lv:1},{w:'belt',p:['b','e','l','t'],lv:1},
  {w:'dust',p:['d','u','s','t'],lv:1},{w:'nest',p:['n','e','s','t'],lv:1},
  {w:'shop',p:['sh','o','p'],lv:1},{w:'ship',p:['sh','i','p'],lv:1},
  {w:'fish',p:['f','i','sh'],lv:1},{w:'dish',p:['d','i','sh'],lv:1},
  {w:'wish',p:['w','i','sh'],lv:1},{w:'rush',p:['r','u','sh'],lv:1},
  {w:'chop',p:['ch','o','p'],lv:1},{w:'chin',p:['ch','i','n'],lv:1},
  {w:'chip',p:['ch','i','p'],lv:1},{w:'chat',p:['ch','a','t'],lv:1},
  {w:'thin',p:['th','i','n'],lv:1},{w:'bath',p:['b','a','th'],lv:1},
  {w:'math',p:['m','a','th'],lv:1},{w:'path',p:['p','a','th'],lv:1},
  {w:'crush',p:['c','r','u','sh'],lv:1},{w:'brush',p:['b','r','u','sh'],lv:1},
  {w:'fresh',p:['f','r','e','sh'],lv:1},
  // Level 2
  {w:'sunset',p:['sun','set'],lv:2},{w:'hotdog',p:['hot','dog'],lv:2},
  {w:'catnap',p:['cat','nap'],lv:2},{w:'bathtub',p:['bath','tub'],lv:2},
  {w:'catfish',p:['cat','fish'],lv:2},{w:'pigpen',p:['pig','pen'],lv:2},
  {w:'sandbox',p:['sand','box'],lv:2},{w:'cobweb',p:['cob','web'],lv:2},
  {w:'laptop',p:['lap','top'],lv:2},{w:'hilltop',p:['hill','top'],lv:2},
  {w:'zigzag',p:['zig','zag'],lv:2},{w:'sunlit',p:['sun','lit'],lv:2},
  {w:'cannot',p:['can','not'],lv:2},{w:'dustbin',p:['dust','bin'],lv:2},
  {w:'eggcup',p:['egg','cup'],lv:2},{w:'nutmeg',p:['nut','meg'],lv:2},
  {w:'rabbit',p:['rab','bit'],lv:2},{w:'kitten',p:['kit','ten'],lv:2},
  {w:'muffin',p:['muf','fin'],lv:2},{w:'button',p:['but','ton'],lv:2},
  {w:'mitten',p:['mit','ten'],lv:2},{w:'ribbon',p:['rib','bon'],lv:2},
  {w:'cotton',p:['cot','ton'],lv:2},{w:'puppet',p:['pup','pet'],lv:2},
  {w:'hammer',p:['ham','mer'],lv:2},{w:'ladder',p:['lad','der'],lv:2},
  {w:'dinner',p:['din','ner'],lv:2},{w:'letter',p:['let','ter'],lv:2},
  {w:'butter',p:['but','ter'],lv:2},{w:'summer',p:['sum','mer'],lv:2},
  {w:'winter',p:['win','ter'],lv:2},
  {w:'happy',p:['hap','py'],lv:2},{w:'funny',p:['fun','ny'],lv:2},
  {w:'sunny',p:['sun','ny'],lv:2},{w:'puppy',p:['pup','py'],lv:2},
  {w:'bunny',p:['bun','ny'],lv:2},{w:'penny',p:['pen','ny'],lv:2},
  {w:'jelly',p:['jel','ly'],lv:2},{w:'foggy',p:['fog','gy'],lv:2},
  {w:'muddy',p:['mud','dy'],lv:2},{w:'silly',p:['sil','ly'],lv:2},
  // Level 3
  {w:'banana',p:['ba','na','na'],lv:3},{w:'tomato',p:['to','ma','to'],lv:3},
  {w:'potato',p:['po','ta','to'],lv:3},{w:'animal',p:['an','i','mal'],lv:3},
  {w:'elephant',p:['el','e','phant'],lv:3},{w:'umbrella',p:['um','brel','la'],lv:3},
  {w:'dinosaur',p:['di','no','saur'],lv:3},{w:'butterfly',p:['but','ter','fly'],lv:3},
  {w:'ladybug',p:['la','dy','bug'],lv:3},{w:'kangaroo',p:['kan','ga','roo'],lv:3},
  {w:'octopus',p:['oc','to','pus'],lv:3},{w:'broccoli',p:['broc','co','li'],lv:3},
  {w:'pineapple',p:['pine','ap','ple'],lv:3},{w:'hamburger',p:['ham','bur','ger'],lv:3},
  {w:'lemonade',p:['lem','on','ade'],lv:3},{w:'alphabet',p:['al','pha','bet'],lv:3},
  {w:'basketball',p:['bas','ket','ball'],lv:3},{w:'wonderful',p:['won','der','ful'],lv:3},
  {w:'adventure',p:['ad','ven','ture'],lv:3},{w:'fantastic',p:['fan','tas','tic'],lv:3},
  {w:'dragonfly',p:['drag','on','fly'],lv:3},{w:'grandfather',p:['grand','fa','ther'],lv:3},
  {w:'understand',p:['un','der','stand'],lv:3},{w:'together',p:['to','geth','er'],lv:3},
  {w:'yesterday',p:['yes','ter','day'],lv:3},{w:'crocodile',p:['croc','o','dile'],lv:3},
  {w:'strawberry',p:['straw','ber','ry'],lv:3},{w:'trampoline',p:['tram','po','line'],lv:3},
  {w:'important',p:['im','por','tant'],lv:3},{w:'remember',p:['re','mem','ber'],lv:3},
];

/* ===== API CALL ===== */
function callTTS(ssml) {
  const body = JSON.stringify({
    input: { ssml },
    voice: VOICE,
    audioConfig: AUDIO_CFG,
  });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'texttospeech.googleapis.com',
      path: `/v1/text:synthesize?key=${API_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`TTS API ${res.statusCode}: ${data}`));
          return;
        }
        const json = JSON.parse(data);
        resolve(Buffer.from(json.audioContent, 'base64'));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function save(dir, name, buf) {
  const p = path.join('audio', dir, name + '.mp3');
  fs.writeFileSync(p, buf);
}

/* ===== SSML BUILDERS ===== */

// Blended audio: say the ACTUAL WORD very slowly (natural stretching)
function blendSSML(word) {
  if (word.lv === 1) {
    // Say the real word at x-slow — TTS naturally stretches the sounds
    return `<speak><prosody rate="x-slow" pitch="-2st">${word.w}</prosody></speak>`;
  } else {
    // Syllable-by-syllable with pauses
    const parts = word.p.map(s => `<prosody rate="slow">${s}</prosody>`);
    return `<speak>${parts.join('<break time="700ms"/>')}</speak>`;
  }
}

// Normal word audio
function wordSSML(w) {
  return `<speak><prosody rate="92%">${w}</prosody></speak>`;
}

// Individual phoneme/syllable audio (for tapping in See & Sound mode)
function segSSML(seg, isPhoneme) {
  if (isPhoneme && PH_IPA[seg]) {
    // Use IPA phoneme tag for accurate phoneme sounds
    return `<speak><prosody rate="slow"><phoneme alphabet="ipa" ph="${PH_IPA[seg]}">${seg}</phoneme></prosody></speak>`;
  }
  // Syllable — just say it clearly
  return `<speak><prosody rate="85%">${seg}</prosody></speak>`;
}

/* ===== MAIN ===== */
async function main() {
  // Create directories
  ['words', 'blend', 'seg'].forEach(d => fs.mkdirSync(path.join('audio', d), { recursive: true }));

  // Delete all existing audio files to force regeneration
  ['words', 'blend', 'seg'].forEach(dir => {
    const dirPath = path.join('audio', dir);
    fs.readdirSync(dirPath).forEach(f => fs.unlinkSync(path.join(dirPath, f)));
  });

  const total = [];

  // 1. Normal word audio
  for (const w of WORDS) {
    total.push({ dir: 'words', name: w.w, ssml: wordSSML(w.w) });
  }

  // 2. Blended word audio
  for (const w of WORDS) {
    total.push({ dir: 'blend', name: w.w, ssml: blendSSML(w) });
  }

  // 3. Individual segment audio (phonemes + syllables)
  const seenSegs = new Set();
  for (const w of WORDS) {
    for (const seg of w.p) {
      if (seenSegs.has(seg)) continue;
      seenSegs.add(seg);
      const isPhoneme = w.lv === 1 && seg.length <= 2 && PH_IPA[seg];
      total.push({ dir: 'seg', name: seg, ssml: segSSML(seg, isPhoneme) });
    }
  }

  console.log(`Generating ${total.length} audio files...`);
  let done = 0;
  let failed = 0;

  for (const item of total) {
    try {
      const buf = await callTTS(item.ssml);
      save(item.dir, item.name, buf);
      done++;
      if (done % 10 === 0 || done === total.length) {
        console.log(`  ${done}/${total.length} done`);
      }
      await new Promise(r => setTimeout(r, 100));
    } catch (e) {
      console.error(`  FAILED: ${item.dir}/${item.name} - ${e.message}`);
      failed++;
      // Retry once with fallback SSML (no IPA)
      if (item.dir === 'seg') {
        try {
          const fallback = `<speak><prosody rate="slow">${item.name}</prosody></speak>`;
          const buf = await callTTS(fallback);
          save(item.dir, item.name, buf);
          done++;
          console.log(`  RETRIED OK: ${item.name}`);
        } catch (e2) {
          console.error(`  RETRY FAILED: ${item.name}`);
        }
      }
    }
  }

  console.log(`\nDone! Generated ${done} files, ${failed} failures.`);
}

main().catch(e => { console.error(e); process.exit(1); });
