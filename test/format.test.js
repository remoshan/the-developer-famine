const test = require('node:test');
const assert = require('node:assert/strict');
const { parseLogInput, formatStandupMarkdown } = require('../out/format.js');

test('parseLogInput: /win with content', () => {
  assert.deepEqual(parseLogInput('/win Fixed the memory leak'), { type: 'win', content: 'Fixed the memory leak' });
});

test('parseLogInput: bare /win has empty content', () => {
  assert.deepEqual(parseLogInput('/win'), { type: 'win', content: '' });
});

test('parseLogInput: /block and /blocker both map to blocker', () => {
  assert.equal(parseLogInput('/block Waiting on AWS keys').type, 'blocker');
  assert.equal(parseLogInput('/blocker Waiting on AWS keys').type, 'blocker');
});

test('parseLogInput: /todo', () => {
  assert.deepEqual(parseLogInput('/todo Write tests'), { type: 'todo', content: 'Write tests' });
});

test('parseLogInput: unrecognized prefix falls back to note', () => {
  assert.deepEqual(parseLogInput('/winFoo'), { type: 'note', content: '/winFoo' });
});

test('parseLogInput: plain text is a note', () => {
  assert.deepEqual(parseLogInput('just a note'), { type: 'note', content: 'just a note' });
});

test('formatStandupMarkdown: sections only appear when non-empty', () => {
  const entries = [
    { id: '1', timestamp: 1, type: 'win', content: 'Shipped X' },
    { id: '2', timestamp: 2, type: 'todo', content: 'Write docs' },
    { id: '3', timestamp: 3, type: 'todo', content: 'Fix bug', done: true }
  ];
  const md = formatStandupMarkdown(entries);
  assert.match(md, /\*\*Wins\*\*\n- Shipped X/);
  assert.match(md, /\*\*Todos\*\*\n- Write docs/);
  assert.match(md, /\*\*Done\*\*\n- Fix bug/);
  assert.doesNotMatch(md, /\*\*Blockers\*\*/);
  assert.doesNotMatch(md, /\*\*Notes\*\*/);
});

test('formatStandupMarkdown: empty input yields empty string', () => {
  assert.equal(formatStandupMarkdown([]), '');
});
