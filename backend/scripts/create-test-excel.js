const XLSX = require('xlsx');
const path = require('path');

// Create test data with ALL platforms
const testData = [
  {
    'Reg No': '711523BCB036',
    'Name': 'Mohammed Syfudeen S',
    'Dept': 'BCB',
    'Year': '3rd Year',
    'CodeChef': 'syfudeen',
    'LeetCode': 'Syfudeen_17',
    'Codeforces': 'tourist',  // Using famous Codeforces user for testing
    'GitHub': 'Syfudeen',
    'AtCoder': '',
    'Codolio': ''
  }
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(testData);
XLSX.utils.book_append_sheet(wb, ws, 'Students');

const outputPath = path.join(__dirname, '../test-all-platforms.xlsx');
XLSX.writeFile(wb, outputPath);

console.log('✅ Test Excel file created!');
console.log(`📁 Location: ${outputPath}`);
console.log('\n📊 Platforms included:');
console.log('  ✅ CodeChef: syfudeen');
console.log('  ✅ LeetCode: Syfudeen_17');
console.log('  ✅ Codeforces: tourist (test user)');
console.log('  ✅ GitHub: Syfudeen');
console.log('\n💡 Upload this file to test Codeforces filtering!');
