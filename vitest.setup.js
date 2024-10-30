import { afterEach, expect } from 'vitest';
import * as mongoose from 'mongoose';
import Log from './models/Log';
import User from './models/User';
import Timeout from './models/Timeout';

// replace timestamps in snapshots so they are always the same
expect.addSnapshotSerializer({
    test: (val) => typeof val === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(val),
    print: () => `"TIMESTAMP"`,
});

// delete all entries in db between each test to prevent state leaking over
afterEach(async () => {
    await Promise.all([
        Log.deleteMany({}),
        User.deleteMany({}),
        Timeout.deleteMany({}),
        // Add more models after they are created here
    ]);
});

// https://typegoose.github.io/mongodb-memory-server/docs/guides/integration-examples/test-runners
beforeAll(async () => {
    // put your client connection code here, example with mongoose:
    await mongoose.connect(process.env['MONGO_URI']);
});

afterAll(async () => {
    // put your client disconnection code here, example with mongoose:
    await mongoose.disconnect();
});