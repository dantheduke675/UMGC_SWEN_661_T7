// Jest entry point for the shared test harness (tests/harness.cjs).
// Each app instance is torn down after its test; a page error fails the test.
const { createApp } = require('../harness.cjs');

const open = [];
afterEach(() => {
  while (open.length) open.pop().dispose();
});

function setupApp(storage = {}, opts = {}) {
  const h = createApp(storage, opts);
  open.push(h);
  return h;
}

module.exports = { setupApp };
