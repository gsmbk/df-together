import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const CATALOG_URL =
  'https://reg.salesforce.com/flow/plus/df26/sessioncatalog/page/catalog';
const CHROME_PATH =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const EVENT_YEAR = 2026;
const EVENT_TIME_ZONE = 'America/Los_Angeles';
const EVENT_UTC_OFFSET = '-07:00';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(scriptDir, '../src/data/sessions.json');

const monthNumbers = {
  Jan: '01',
  Feb: '02',
  Mar: '03',
  Apr: '04',
  May: '05',
  Jun: '06',
  Jul: '07',
  Aug: '08',
  Sep: '09',
  Oct: '10',
  Nov: '11',
  Dec: '12',
};

function to24Hour(timeLabel) {
  const match = timeLabel.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = match[2];
  const meridiem = match[3].toUpperCase();
  if (meridiem === 'AM' && hour === 12) hour = 0;
  if (meridiem === 'PM' && hour !== 12) hour += 12;
  return `${String(hour).padStart(2, '0')}:${minute}:00`;
}

function toIso(dateLabel, timeLabel) {
  const match = dateLabel.match(/([A-Z][a-z]{2})\s+(\d{1,2})/);
  const clock = to24Hour(timeLabel);
  if (!match || !clock) return null;
  const month = monthNumbers[match[1]];
  if (!month) return null;
  const day = match[2].padStart(2, '0');
  return `${EVENT_YEAR}-${month}-${day}T${clock}${EVENT_UTC_OFFSET}`;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

async function loadAllSessions(page) {
  await page.waitForSelector('li.catalog-result', { timeout: 120_000 });

  let previousCount = 0;
  let clicks = 0;

  while (true) {
    const cards = page.locator('li.catalog-result');
    const count = await cards.count();
    const showMore = page.getByRole('button', { name: /^Show more$/i });

    if ((await showMore.count()) === 0 || !(await showMore.isVisible())) {
      console.log(`Catalog fully loaded: ${count} sessions.`);
      break;
    }

    if (count <= previousCount && clicks > 0) {
      throw new Error(`Catalog stopped growing after ${count} sessions.`);
    }

    previousCount = count;
    await showMore.scrollIntoViewIfNeeded();
    await showMore.click();
    clicks += 1;

    await page
      .waitForFunction(
        (before) =>
          document.querySelectorAll('li.catalog-result').length > before,
        previousCount,
        { timeout: 60_000 },
      )
      .catch(() => undefined);

    await page.waitForTimeout(250);

    const currentCount = await cards.count();
    console.log(`Loaded ${currentCount} sessions (${clicks} expansions).`);
  }
}

async function extractSessions(page) {
  return page.locator('li.catalog-result').evaluateAll((cards) => {
    const text = (root, selector) =>
      root.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

    const valuesFor = (card, attribute) =>
      [...card.querySelectorAll(`.badge-attribute-${attribute}`)]
        .map((element) => element.textContent?.replace(/\s+/g, ' ').trim() ?? '')
        .filter(Boolean);

    return cards.map((card) => {
      const id = card.getAttribute('data-session-id') ?? '';
      const catalogBadges = valuesFor(card, 'catalogbadges');
      const times = [...card.querySelectorAll('button[data-sessiontime-id]')].map(
        (button) => {
          const row = button.closest('li') ?? button.parentElement ?? card;
          const timeLabel = text(row, '.session-time');
          const [startTime = '', endTime = ''] = timeLabel
            .replace(/\s+(PDT|PST)$/i, '')
            .split(/\s+-\s+/);
          return {
            id: button.getAttribute('data-sessiontime-id') ?? '',
            dateLabel: text(row, '.session-date'),
            startTime,
            endTime,
            timeZoneAbbreviation:
              timeLabel.match(/\s(PDT|PST)$/i)?.[1]?.toUpperCase() ?? 'PDT',
            location: text(row, '[data-test="room-name"]'),
            seating: text(row, '[data-test="reservation-type"]'),
            actionLabel: button.textContent?.replace(/\s+/g, ' ').trim() ?? '',
          };
        },
      );

      return {
        id,
        title: text(card, '.title-text'),
        abstract: text(card, '[data-test="abstract-component"]'),
        officialUrl: id
          ? `https://reg.salesforce.com/flow/plus/df26/sessioncatalog/page/catalog/session/${id}`
          : '',
        formats: valuesFor(card, 'sessionformat'),
        products: valuesFor(card, 'product'),
        roles: valuesFor(card, 'role'),
        industries: valuesFor(card, 'industry'),
        topics: valuesFor(card, 'topic'),
        levels: valuesFor(card, 'sessionlevel'),
        locations: valuesFor(card, 'location'),
        days: valuesFor(card, 'day'),
        requiredEquipment: valuesFor(card, 'requiredequipment'),
        objectives: [
          ...valuesFor(card, 'objective1'),
          ...valuesFor(card, 'objective2'),
          ...valuesFor(card, 'objective3'),
        ],
        community: valuesFor(card, 'community'),
        // Best effort: RainFocus renders speakers outside the badge attributes. Empty
        // until the selector is confirmed against the live catalog markup.
        speakers: [...card.querySelectorAll('[data-test="speaker-name"], .speaker-name, .rf-speaker-name')]
          .map((element) => element.textContent?.replace(/\s+/g, ' ').trim() ?? '')
          .filter(Boolean),
        viewingOptions: valuesFor(card, 'viewingoptions'),
        catalogBadges,
        times,
      };
    });
  });
}

async function main() {
  console.log('Opening the Dreamforce 2026 catalog...');
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--disable-gpu', '--no-first-run', '--no-default-browser-check'],
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
    page.setDefaultTimeout(120_000);
    await page.goto(CATALOG_URL, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await loadAllSessions(page);

    const rawSessions = await extractSessions(page);
    const sessions = rawSessions
      .map((session) => ({
        ...session,
        formats: unique(session.formats),
        products: unique(session.products),
        roles: unique(session.roles),
        industries: unique(session.industries),
        topics: unique(session.topics),
        levels: unique(session.levels),
        locations: unique(session.locations),
        days: unique(session.days),
        requiredEquipment: unique(session.requiredEquipment),
        objectives: unique(session.objectives),
        community: unique(session.community),
        speakers: unique(session.speakers ?? []),
        viewingOptions: unique(session.viewingOptions),
        catalogBadges: unique(session.catalogBadges),
        times: session.times.map((time) => ({
          ...time,
          startAt: toIso(time.dateLabel, time.startTime),
          endAt: toIso(time.dateLabel, time.endTime),
        })),
      }))
      .filter((session) => session.id && session.title);

    const uniqueIds = new Set(sessions.map((session) => session.id));
    if (uniqueIds.size !== sessions.length) {
      throw new Error(
        `Expected unique session IDs, found ${sessions.length - uniqueIds.size} duplicates.`,
      );
    }

    const payload = {
      metadata: {
        event: 'Dreamforce 2026',
        eventCode: 'df26',
        sourceUrl: CATALOG_URL,
        importedAt: new Date().toISOString(),
        timeZone: EVENT_TIME_ZONE,
        sessionCount: sessions.length,
        sessionTimeCount: sessions.reduce(
          (total, session) => total + session.times.length,
          0,
        ),
        disclaimer:
          'This independent planner does not reserve seats or update the official Dreamforce agenda.',
      },
      sessions,
    };

    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    console.log(
      `Wrote ${payload.metadata.sessionCount} sessions and ${payload.metadata.sessionTimeCount} times to ${outputPath}`,
    );
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
