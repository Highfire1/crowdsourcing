import { parsePrerequisiteText } from './lib/prerequisite-parser.ts';

// Test cases for permission detection
const testCases = [
  {
    text: "PSYC 201, 210, 260, permission of the instructor.",
    expected: ["Permission of the instructor."]
  },
  {
    text: "MATH 100 and permission of the department.",
    expected: ["Permission of the department."]
  },
  {
    text: "CHEM 101 with permission of the instructor. Also need permission of the department.",
    expected: ["Permission of the instructor.", "Permission of the department."]
  },
  {
    text: "ENGL 100 and permission of department",
    expected: ["Permission of department"]
  },
  {
    text: "HIST 200 or instructor permission",
    expected: ["Instructor permission"]
  }
];

console.log('Testing permission detection...\n');

testCases.forEach((testCase, index) => {
  const result = parsePrerequisiteText(testCase.text);
  const actualPermissions = result.permissions.map(p => p.note);
  
  console.log(`Test ${index + 1}:`);
  console.log(`Input: "${testCase.text}"`);
  console.log(`Expected: [${testCase.expected.map(p => `"${p}"`).join(', ')}]`);
  console.log(`Actual: [${actualPermissions.map(p => `"${p}"`).join(', ')}]`);
  
  const passed = JSON.stringify(actualPermissions.sort()) === JSON.stringify(testCase.expected.sort());
  console.log(`Status: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log();
});