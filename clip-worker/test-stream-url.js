require('dotenv').config();

console.log('='.repeat(60));
console.log('🎥 TESTING STREAM URL CONFIGURATION');
console.log('='.repeat(60));

const streamCdnUrl = process.env.BUNNY_STREAM_CDN_URL || process.env.BUNNY_CDN_URL || 'https://statjam.b-cdn.net';
const baseUrl = streamCdnUrl.startsWith('http') ? streamCdnUrl : `https://${streamCdnUrl}`;

console.log('\n📋 Environment:');
console.log(`  BUNNY_STREAM_CDN_URL: ${process.env.BUNNY_STREAM_CDN_URL || 'NOT SET'}`);
console.log(`  BUNNY_CDN_URL: ${process.env.BUNNY_CDN_URL || 'NOT SET'}`);

// Test video ID from the error
const testVideoId = '1ff9811b-158e-4736-a8ce-e46d5cdeab56';
const videoUrl = `${baseUrl}/${testVideoId}/play_720p.mp4`;

console.log(`\n🎬 Generated Video URL:`);
console.log(`  ${videoUrl}`);

// Test if URL is accessible
async function testUrl() {
  console.log('\n🧪 Testing URL accessibility...');
  try {
    const res = await fetch(videoUrl, { method: 'HEAD' });
    console.log(`  Status: ${res.status} ${res.statusText}`);
    if (res.ok) {
      console.log(`  ✅ Video is accessible!`);
      console.log(`  Content-Type: ${res.headers.get('content-type')}`);
      console.log(`  Content-Length: ${(parseInt(res.headers.get('content-length') || '0') / 1024 / 1024).toFixed(2)} MB`);
    } else if (res.status === 403) {
      console.log(`  ⚠️ Video exists but may require authentication`);
    } else {
      console.log(`  ❌ Video not accessible`);
    }
  } catch (err) {
    console.log(`  ❌ ERROR: ${err.message}`);
  }
}

testUrl().then(() => process.exit(0));
