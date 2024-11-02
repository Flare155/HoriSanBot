import { afterEach, beforeEach, expect } from 'vitest';
import * as mongoose from 'mongoose';

// replace timestamps in snapshots so they are always the same
expect.addSnapshotSerializer({
    test: (val) => typeof val === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(val),
    print: () => `'TIMESTAMP'`,
});

expect.addSnapshotSerializer({
    test: (val) => typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val),
    print: () => `'DATE'`,
});

// https://typegoose.github.io/mongodb-memory-server/docs/guides/integration-examples/test-runners
beforeEach(async () => {
    // put your client connection code here, example with mongoose:
    await mongoose.connect(process.env['MONGO_URI']);
});

afterEach(async () => {
    // put your client disconnection code here, example with mongoose:
    // Makes sure each test is run in isolation
    await mongoose.disconnect();
});