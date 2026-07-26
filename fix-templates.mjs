import mongoose from 'mongoose';
import Problem from './server/models/Problem.js';

async function fixTemplates() {
  await mongoose.connect('mongodb://127.0.0.1:58036/', { serverSelectionTimeoutMS: 5000 });
  
  const problems = await Problem.find({}).lean();
  
  for (const p of problems) {
    const oracle = p.oracleSolutions || {};
    const starter = { ...p.starterCode };
    let needsUpdate = false;
    
    for (const lang of ['python', 'javascript', 'cpp']) {
      const oracleFn = p.oracleSolutions?.[lang];
      const starterFn = p.starterCode?.[lang];
      
      if (oracleFn && starterFn) {
        let oracleName = '';
        if (lang === 'python') {
          const match = oracleFn.match(/def\s+(\w+)\s*\(/);
          oracleName = match ? match[1] : '';
        } else if (lang === 'javascript') {
          const match = oracleFn.match(/function\s+(\w+)\s*\(/);
          oracleName = match ? match[1] : '';
        } else if (lang === 'cpp') {
          const match = oracleFn.match(/(\w+)\s*\([^)]*\)\s*{/);
          oracleName = match ? match[1] : '';
        }
        
        let starterName = '';
        if (starterFn) {
          if (lang === 'python') {
            const match = starterFn.match(/def\s+(\w+)\s*\(/);
            starterName = match ? match[1] : '';
          } else if (lang === 'javascript') {
            const match = starterFn.match(/function\s+(\w+)\s*\(/);
            starterName = match ? match[1] : '';
          } else if (lang === 'cpp') {
            const match = starterFn.match(/(\w+)\s*\([^)]*\)\s*{/);
            starterName = match ? match[1] : '';
          }
        }
        
        if (oracleName && starterName && oracleName !== starterName) {
          console.log(lang + ': ' + p.problemId + ': oracle=' + oracleName + ' starter=' + starterName);
          
          if (lang === 'python') {
            starter[lang] = starterFn.replace(/def\s+\w+\s*\(/, 'def ' + oracleName + '(');
          } else if (lang === 'javascript') {
            starter[lang] = starterFn.replace(/function\s+\w+\s*\(/, 'function ' + oracleName + '(');
          } else if (lang === 'cpp') {
            starter[lang] = starterFn.replace(/(\w+)\s*\([^)]*\)\s*{/, oracleName + '(');
          }
        }
      }
    }
    
    let changed = false;
    for (const lang of ['python', 'javascript', 'cpp']) {
      if (p.starterCode?.[lang] !== starter[lang]) {
        changed = true;
        break;
      }
    }
    
    if (Object.keys(starter).some(k => p.starterCode?.[k] !== starter[k])) {
      await Problem.findByIdAndUpdate(p._id, { $set: { starterCode: starter } });
      console.log('Updated ' + p.problemId);
    }
  }
  
  console.log('Done!');
  process.exit(0);
}

fixTemplates().catch(e => { console.error(e); process.exit(1); });
