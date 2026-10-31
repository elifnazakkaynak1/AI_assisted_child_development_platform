async function generateSummary({ role, records = [] }) {
  const mode = process.env.AI_MODE || 'mock';

  if (mode === 'mock') {
    return {
      label: 'AI-generated',
      role,
      text: `Mock summary for ${role}: ${records.length} record(s) reviewed. This is a suggestion only; a human makes the decision.`,
      sources: records.map((record) => record.id),
    };
  }

  throw new Error(`AI mode "${mode}" is not implemented yet`);
}

module.exports = { generateSummary };