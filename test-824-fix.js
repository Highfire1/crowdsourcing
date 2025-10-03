const fs = require('fs');

// Read and execute the parser file
const parserCode = fs.readFileSync('lib/prerequisite-parser.ts', 'utf8');

// Convert TypeScript to basic JavaScript (remove types and export)
const jsCode = parserCode
  .replace(/export /g, '')
  .replace(/: string\[\]/g, '')
  .replace(/: string/g, '')
  .replace(/: RequirementCourse\[\]/g, '')
  .replace(/: RequirementHSCourse\[\]/g, '')
  .replace(/: RequirementCreditCount\[\]/g, '')
  .replace(/: RequirementPermission\[\]/g, '')
  .replace(/: ParsedPrerequisites/g, '')
  .replace(/interface.*?{[\s\S]*?}/g, '')
  .replace(/type.*?=[\s\S]*?(?=\n\n|\nexport|\nconst|\nfunction|$)/g, '');

eval(jsCode);

// Test the specific case
const testText = "All of PSYC 820B, 821B, 822, 823, and 824;";

console.log('Testing:', testText);
const result = parsePrerequisiteText(testText);
console.log('Parsed courses:', result.courses);

// Check if 824 is detected
const has824 = result.courses.some(course => course.number === '824' && course.department === 'PSYC');
console.log('Found PSYC 824:', has824);

if (has824) {
  console.log('✅ Fix successful! PSYC 824 is now detected.');
} else {
  console.log('❌ Fix failed. PSYC 824 is still not detected.');
}