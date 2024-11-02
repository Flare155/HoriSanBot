import { MongoMemoryServer } from 'mongodb-memory-server';
import * as mongoose from 'mongoose';

// https://typegoose.github.io/mongodb-memory-server/docs/guides/integration-examples/test-runners
module.exports = async function globalSetup() {
    const instance = await MongoMemoryServer.create();
    const uri = instance.getUri();
    (global).__MONGOINSTANCE = instance;
    process.env.MONGO_URI = uri.slice(0, uri.lastIndexOf('/'));

    // The following is to make sure the database is clean before a test suite starts
    const conn = await mongoose.connect(`${process.env.MONGO_URI}/test`);
    await conn.connection.db.dropDatabase();
    await mongoose.disconnect();
};