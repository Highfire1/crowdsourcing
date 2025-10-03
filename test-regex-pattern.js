// Simple test to manually check the regex pattern

const testCases = [
  "All of PSYC 820B, 821B, 822, 823, and 824;",
  "MATH 100, 101, and 102.",
  "BUSM 200 or 300",
  "ENGL 101; MATH 200"
];

// Test the new pattern
const newPattern = /\b(\d{3}[A-Z]?)(?=[,\s;.]|$)/g;

testCases.forEach((text, index) => {
  const matches = [...text.matchAll(newPattern)];
  console.log(`Test ${index + 1}:`, text);
  console.log('Matches:', matches.map(m => m[1]));
  console.log('');
});