// Test the Patil parser directly
import { getPatilCoverage, generatePatilQuestions } from '../src/lib/question-bank/patil-generator';

async function main() {
  console.log('=== Patil Book Coverage ===');
  const coverage = await getPatilCoverage();
  console.log(JSON.stringify(coverage, null, 2));

  console.log('\n=== Generate 5 Patil MCQs ===');
  const result = await generatePatilQuestions({ count: 5 });
  console.log(`Generated: ${result.questions.length} questions`);
  console.log(`Coverage: ${JSON.stringify(result.coverage)}`);
  console.log('\n--- Sample Questions ---');
  for (let i = 0; i < Math.min(3, result.questions.length); i++) {
    const q = result.questions[i];
    console.log(`\nQ${i+1} [${q.type}/${q.difficulty}]:`);
    console.log(`  ${q.question.slice(0, 200)}...`);
    console.log(`  Options:`);
    for (const o of q.options) {
      console.log(`    ${o.id.toUpperCase()}. ${o.text.slice(0, 80)}${o.isCorrect ? ' ✓' : ''}`);
    }
    console.log(`  Correct: ${q.correctAnswer}`);
    console.log(`  Reason: ${q.reason.slice(0, 200)}...`);
    // Verify NO source metadata
    const sourceFields = ['source', 'bookName', 'author', 'chapter', 'reference', 'pageNumber'];
    const leaked = sourceFields.filter(f => f in q);
    if (leaked.length > 0) {
      console.log(`  ❌ SOURCE LEAKED: ${leaked}`);
    } else {
      console.log(`  ✅ No source metadata (security OK)`);
    }
  }
}

main().catch(console.error);
