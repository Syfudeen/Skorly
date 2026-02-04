const XLSX = require('xlsx');
const path = require('path');

/**
 * Generate Sample Excel File with Student Data
 * This script creates a sample Excel file for testing
 */

const sampleStudents = [
  {
    name: 'Aarav Sharma',
    regNo: '21CS001',
    dept: 'Computer Science',
    year: '3rd Year',
    codechef: 'aarav_cc',
    leetcode: 'aarav_lc',
    codeforces: 'aarav_cf',
    atcoder: 'aarav_at',
    codolio: 'aarav_cd',
    github: 'aarav-sharma'
  },
  {
    name: 'Priya Patel',
    regNo: '21CS002',
    dept: 'Computer Science',
    year: '3rd Year',
    codechef: 'priya_cc',
    leetcode: 'priya_lc',
    codeforces: 'priya_cf',
    atcoder: '',
    codolio: 'priya_cd',
    github: 'priya-patel'
  },
  {
    name: 'Rohan Kumar',
    regNo: '21IT003',
    dept: 'Information Technology',
    year: '2nd Year',
    codechef: 'rohan_cc',
    leetcode: 'rohan_lc',
    codeforces: 'rohan_cf',
    atcoder: 'rohan_at',
    codolio: '',
    github: 'rohan-kumar'
  },
  {
    name: 'Ananya Singh',
    regNo: '21CS004',
    dept: 'Computer Science',
    year: '2nd Year',
    codechef: '',
    leetcode: 'ananya_lc',
    codeforces: 'ananya_cf',
    atcoder: 'ananya_at',
    codolio: 'ananya_cd',
    github: 'ananya-singh'
  },
  {
    name: 'Vikram Reddy',
    regNo: '21ECE005',
    dept: 'Electronics',
    year: '3rd Year',
    codechef: 'vikram_cc',
    leetcode: 'vikram_lc',
    codeforces: 'vikram_cf',
    atcoder: '',
    codolio: 'vikram_cd',
    github: ''
  }
];

// Generate more students
for (let i = 6; i <= 20; i++) {
  const depts = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical'];
  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  
  sampleStudents.push({
    name: `Student ${i}`,
    regNo: `21CS${i.toString().padStart(3, '0')}`,
    dept: depts[i % depts.length],
    year: years[i % years.length],
    codechef: `student${i}_cc`,
    leetcode: `student${i}_lc`,
    codeforces: `student${i}_cf`,
    atcoder: i % 3 === 0 ? `student${i}_at` : '',
    codolio: i % 2 === 0 ? `student${i}_cd` : '',
    github: `student${i}-gh`
  });
}

// Convert to array format for Excel
const headers = [
  'Name',
  'Reg No',
  'Dept',
  'Year',
  'CodeChef ID',
  'LeetCode ID',
  'Codeforces ID',
  'AtCoder ID',
  'Codolio ID',
  'GitHub ID'
];

const data = [headers];

sampleStudents.forEach(student => {
  data.push([
    student.name,
    student.regNo,
    student.dept,
    student.year,
    student.codechef,
    student.leetcode,
    student.codeforces,
    student.atcoder,
    student.codolio,
    student.github
  ]);
});

// Create workbook
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.aoa_to_sheet(data);

// Set column widths
worksheet['!cols'] = [
  { wch: 20 }, // Name
  { wch: 12 }, // Reg No
  { wch: 25 }, // Dept
  { wch: 12 }, // Year
  { wch: 15 }, // CodeChef ID
  { wch: 15 }, // LeetCode ID
  { wch: 15 }, // Codeforces ID
  { wch: 15 }, // AtCoder ID
  { wch: 15 }, // Codolio ID
  { wch: 15 }, // GitHub ID
];

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

// Write to file
const outputPath = path.join(__dirname, '../sample-student-data.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log('✅ Sample Excel file generated successfully!');
console.log(`📁 File location: ${outputPath}`);
console.log(`📊 Total students: ${sampleStudents.length}`);
console.log('');
console.log('You can now upload this file to test the system:');
console.log('  curl -F "file=@sample-student-data.xlsx" http://localhost:5000/api/upload');