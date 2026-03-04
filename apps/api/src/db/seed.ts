import { typeid } from 'typeid-js';
import { db } from './index.js';
import { channels } from './schema.js';

const defaultChannels = [
  { slug: 'general', name: 'General' },
  { slug: 'code', name: 'Code' },
  { slug: 'research', name: 'Research' },
];

async function seed() {
  for (const ch of defaultChannels) {
    await db
      .insert(channels)
      .values({
        id: typeid('ch').toString(),
        slug: ch.slug,
        name: ch.name,
      })
      .onConflictDoNothing({ target: channels.slug });
  }

  console.log(
    'Seeded channels:',
    defaultChannels.map((c) => c.slug).join(', '),
  );
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
