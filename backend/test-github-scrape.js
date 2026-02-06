const axios = require('axios');
const cheerio = require('cheerio');

async function testGitHubScrape(username) {
  try {
    console.log(`\n=== Testing GitHub scraping for: ${username} ===\n`);
    
    const response = await axios.get(`https://github.com/${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    const $ = cheerio.load(response.data);
    
    console.log('Method 1: Looking in H2 tags...');
    let found = false;
    $('h2').each((i, elem) => {
      const text = $(elem).text();
      if (text.includes('contribution')) {
        console.log('  Found H2:', text.trim().substring(0, 100));
        const match = text.match(/([0-9,]+)\s+contributions?\s+in\s+the\s+last\s+year/i);
        if (match) {
          console.log('  ✅ Contributions:', match[1]);
          found = true;
        }
      }
    });
    
    if (!found) {
      console.log('  ❌ Not found in H2 tags');
      
      console.log('\nMethod 2: Searching body text...');
      const bodyText = $('body').text();
      const match = bodyText.match(/([0-9,]+)\s+contributions?\s+in\s+the\s+last\s+year/i);
      if (match) {
        console.log('  ✅ Found in body:', match[0]);
        console.log('  ✅ Contributions:', match[1]);
        found = true;
      } else {
        console.log('  ❌ Not found in body text');
      }
    }
    
    if (!found) {
      console.log('\nMethod 3: Looking for SVG contribution calendar...');
      let total = 0;
      $('svg.js-calendar-graph-svg rect').each((i, elem) => {
        const dataCount = $(elem).attr('data-count');
        if (dataCount) {
          total += parseInt(dataCount) || 0;
        }
      });
      if (total > 0) {
        console.log('  ✅ Counted from SVG:', total);
      } else {
        console.log('  ❌ No SVG data found');
      }
    }
    
    console.log('\n=== Test complete ===\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Test with the username
testGitHubScrape('Syfudeen');
