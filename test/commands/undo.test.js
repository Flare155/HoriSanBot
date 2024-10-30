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
