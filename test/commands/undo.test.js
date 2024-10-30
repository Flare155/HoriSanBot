import {myTest} from '../fixtures';
import {execute} from '../../commands/global/undo';
import { expect } from 'vitest';
import Log from '../../models/Log';

myTest('should not delete when no logs', async ({interaction}) => {
    await execute(interaction);
    expect(interaction.reply).toMatchSnapshot();
});

myTest('should undo log', async ({log, interaction}) => {
    await execute(interaction);
    expect(interaction.reply).toMatchSnapshot();
    const deletedLog = await Log.findById(log._id);
    expect(deletedLog).toBeNull();
});

myTest('should undo only most recent log', async ({createLog, interaction}) => {
    const oldLog = await createLog(interaction);
    const newLog = await createLog(interaction)
    await execute(interaction);
    expect(await Log.findById(oldLog._id)).not.toBeNull();
    expect(await Log.findById(newLog._id)).toBeNull();
});

myTest('should not undo log from other user', async ({log, interaction}) => {
    interaction.user.id = 'another-user';
    await execute(interaction);
    expect(await Log.findById(log._id)).not.toBeNull();
    expect(interaction.reply).toMatchSnapshot();
});
