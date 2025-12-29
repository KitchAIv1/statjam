require('dotenv').config();

const videoId = '1ff9811b-158e-4736-a8ce-e46d5cdeab56';
const cdnBase = process.env.BUNNY_STREAM_CDN_URL;

console.log('='.repeat(60));
console.log('🎥 TESTING VIDEO ACCESS FORMATS');
console.log('='.repeat(60));

// Different URL formats Bunny Stream might use
const formats = [
  { name: '720p', url: `${cdnBase}/${videoId}/play_720p.mp4` },
  { name: '480p', url: `${cdnBase}/${videoId}/play_480p.mp4` },
  { name: '360p', url: `${cdnBase}/${videoId}/play_360p.mp4` },
  { name: 'playlist', url: `${cdnBase}/${videoId}/playlist.m3u8` },
  { name: 'original', url: `${cdnBase}/${videoId}/original` },
  { name: 'play', url: `${cdnBase}/${videoId}/play.mp4` },
];

async function testFormats() {
  for (const format of formats) {
    console.log(`\n📋 Testing ${format.name}:`);
    console.log(`   ${format.url}`);
    try {
      const res = await fetch(format.url, { 
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; StatJam/1.0)',
          'Referer': 'https://statjam.net/'
        }
      });
      console.log(`   Status: ${res.status} ${res.statusText}`);
      if (res.ok) {
        console.log(`   ✅ ACCESSIBLE!`);
        console.log(`   Content-Type: ${res.headers.get('content-type')}`);
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
    }
  }
}

testFormats().then(() => {
  console.log('\n' + '='.repeat(60));
  console.log('NOTE: If all return 403, the Bunny Stream library may have:');
  console.log('  - Token authentication enabled');
  console.log('  - Referer restrictions');
  console.log('  - Geo-blocking');
  console.log('Check your Bunny Stream library security settings.');
  console.log('='.repeat(60));
  process.exit(0);
});
