import { expect } from 'vitest';

// replace timestamps in snapshots so they are always the same
expect.addSnapshotSerializer({
    test: (val) => typeof val === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(val),
    print: () => `"TIMESTAMP"`,
});