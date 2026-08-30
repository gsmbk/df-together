import { readFile } from 'node:fs/promises';

const catalog = JSON.parse(
  await readFile(new URL('../src/data/sessions.json', import.meta.url), 'utf8'),
);

const fail = (message) => {
  throw new Error(`Catalog validation failed: ${message}`);
};

if (!Array.isArray(catalog.sessions) || catalog.sessions.length === 0) {
  fail('no sessions were found');
}
if (catalog.metadata.sessionCount !== catalog.sessions.length) {
  fail('sessionCount does not match the bundled session array');
}
if (!catalog.metadata.sourceUrl?.includes('/df26/sessioncatalog/')) {
  fail('the catalog source URL is not the Dreamforce 2026 catalog');
}
if (!catalog.metadata.disclaimer?.includes('does not reserve seats')) {
  fail('the planning-only disclaimer is missing');
}

const sessionIds = new Set();
const occurrenceIds = new Set();
let occurrenceCount = 0;

for (const session of catalog.sessions) {
  if (!session.id || !session.title || !session.officialUrl) {
    fail(`a session is missing an id, title, or official URL`);
  }
  if (sessionIds.has(session.id)) fail(`duplicate session id ${session.id}`);
  sessionIds.add(session.id);
  if (!Array.isArray(session.times) || session.times.length === 0) {
    fail(`session ${session.id} has no scheduled occurrence`);
  }

  for (const time of session.times) {
    occurrenceCount += 1;
    if (occurrenceIds.has(time.id)) fail(`duplicate occurrence id ${time.id}`);
    occurrenceIds.add(time.id);
    if (Number.isNaN(Date.parse(time.startAt)) || Number.isNaN(Date.parse(time.endAt))) {
      fail(`occurrence ${time.id} has an invalid timestamp`);
    }
    if (Date.parse(time.endAt) <= Date.parse(time.startAt)) {
      fail(`occurrence ${time.id} does not end after it starts`);
    }
  }
}

if (catalog.metadata.sessionTimeCount !== occurrenceCount) {
  fail('sessionTimeCount does not match the bundled occurrences');
}

console.log(
  `Catalog valid: ${catalog.sessions.length.toLocaleString()} sessions and ${occurrenceCount.toLocaleString()} scheduled occurrences.`,
);
