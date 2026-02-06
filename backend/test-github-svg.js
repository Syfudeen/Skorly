const axios = require('axios');
const cheerio = require('cheerio');

async function testGitHubSVG(username) {
  try {
    console.log(`\n=== Testing GitHub SVG for: ${username} ===\n`);
    
    const response = await axios.get(`https://github.com/users/${username}/contributions`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers['content-type']);
    console.log('Data length:', response.data.length);
    console.log('\nFirst 500 chars:');
    console.log(response.data.substring(0, 500));
    
    const $ = cheerio.load(response.data, { xmlMode: true });
    
    let total = 0;
    $('rect').each((i, elem) => {
      const count = $(elem).attr('data-count');
      if (count) {
        total += parseInt(count) || 0;
      }
    });
    
    console.log('\n✅ Total contributions from SVG:', total);
    console.log('Total rect elements:', $('rect').length);
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data.substring(0, 200));
    }
  }
}

testGitHubSVG('Syfudeen');
