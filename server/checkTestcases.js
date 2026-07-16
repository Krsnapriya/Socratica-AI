const mongoose = require('mongoose');
const TestCase = require('./models/TestCase');

async function check() {
  await mongoose.connect('mongodb://localhost:27018/socratica');
  
  const cases = await TestCase.find({}).sort({problemId: 1, language: 1, visibility: 1});
  
  const byProblem = {};
  cases.forEach(tc => {
    if (!byProblem[tc.problemId]) byProblem[tc.problemId] = {python: {public: 0, hidden: 0}, javascript: {public: 0, hidden: 0}, cpp: {public: 0, hidden: 0}};
    byProblem[tc.problemId][tc.language][tc.visibility]++;
  });
  
  console.log('\n=== TEST CASES COVERAGE MATRIX ===\n');
  console.log('Problem'.padEnd(30) + 'Python(Pub/Hid)'.padEnd(18) + 'JS(Pub/Hid)'.padEnd(18) + 'C++(Pub/Hid)'.padEnd(18) + 'Total');
  console.log('─'.repeat(100));
  
  let totalPublic = 0, totalHidden = 0;
  const sortedProblems = Object.keys(byProblem).sort();
  sortedProblems.forEach(prob => {
    const d = byProblem[prob];
    const pyP = d.python.public, pyH = d.python.hidden;
    const jsP = d.javascript.public, jsH = d.javascript.hidden;
    const cppP = d.cpp.public, cppH = d.cpp.hidden;
    const total = pyP + pyH + jsP + jsH + cppP + cppH;
    totalPublic += pyP + jsP + cppP;
    totalHidden += pyH + jsH + cppH;
    console.log(prob.padEnd(30) + `${pyP}/${pyH}`.padEnd(18) + `${jsP}/${jsH}`.padEnd(18) + `${cppP}/${cppH}`.padEnd(18) + total);
  });
  console.log('─'.repeat(100));
  console.log('TOTALS'.padEnd(30) + `${totalPublic}`.padEnd(18) + `${totalHidden}`.padEnd(18) + ''.padEnd(18) + `Public: ${totalPublic} | Hidden: ${totalHidden} | Grand: ${totalPublic + totalHidden}`);
  
  console.log('\n\n=== HIDDEN TEST CASES (FULL DETAIL) ===\n');
  console.log('#'.padEnd(4) + 'Problem'.padEnd(30) + 'Language'.padEnd(12) + 'Category'.padEnd(14) + 'Input'.padEnd(30) + 'Expected Output');
  console.log('─'.repeat(110));
  
  let idx = 1;
  const hidden = cases.filter(tc => tc.visibility === 'hidden');
  hidden.forEach(tc => {
    const input = tc.input.length > 28 ? tc.input.substring(0, 25) + '...' : tc.input;
    const expected = tc.expectedOutput.length > 40 ? tc.expectedOutput.substring(0, 37) + '...' : tc.expectedOutput;
    console.log(`${idx}`.padEnd(4) + tc.problemId.padEnd(30) + tc.language.padEnd(12) + (tc.category || 'hidden').padEnd(14) + input.padEnd(30) + expected);
    idx++;
  });
  
  console.log(`\nTotal Hidden: ${hidden.length}`);
  
  console.log('\n\n=== PUBLIC SAMPLE CASES (FULL DETAIL) ===\n');
  console.log('#'.padEnd(4) + 'Problem'.padEnd(30) + 'Language'.padEnd(12) + 'Input'.padEnd(30) + 'Expected Output');
  console.log('─'.repeat(100));
  
  idx = 1;
  const publics = cases.filter(tc => tc.visibility === 'public');
  publics.forEach(tc => {
    const input = tc.input.length > 28 ? tc.input.substring(0, 25) + '...' : tc.input;
    const expected = tc.expectedOutput.length > 40 ? tc.expectedOutput.substring(0, 37) + '...' : tc.expectedOutput;
    console.log(`${idx}`.padEnd(4) + tc.problemId.padEnd(30) + tc.language.padEnd(12) + input.padEnd(30) + expected);
    idx++;
  });
  
  console.log(`\nTotal Public: ${publics.length}`);
  
  await mongoose.disconnect();
}
check();
