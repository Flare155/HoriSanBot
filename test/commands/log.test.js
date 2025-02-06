import logCommand from '../../commands/global/log';
import Log from '../../models/Log';
import User from '../../models/User';
import { myTest } from '../fixtures';
import { expect } from 'vitest';

myTest('should fail on invalid time pattern', async ({interaction}) => {
    interaction.setOption('medium', 'WatchTime');
    interaction.setOption('amount', '10');
    await logCommand.execute(interaction);
    expectCalledOnceWithSnapshot(interaction.reply);
});

myTest('should send embed after saving log', async ({interaction}) => {
    await logCommand.execute(interaction);
    expectCalledOnceWithSnapshot(interaction.reply);
});

myTest('should save log', async ({interaction}) => {
    const amount = 100;
    interaction.setOption('amount', `${amount}s`);
    await logCommand.execute(interaction);
    const createdLog = await Log.findOne({ userId: interaction.user.id, guildId: interaction.guild.id });
    expect(createdLog).not.toBeNull('No log could be found. It probably was not created');
    expect(createdLog._doc).toEqual(
        expect.objectContaining({
            amount: {
                count: amount,
                totalSeconds: amount,
                unit: 'Seconds'
            },
            medium: interaction.options.getString('medium'),
            notes: interaction.options.getString('notes'),
            title: interaction.options.getString('title')
        })
    );
});

myTest('should save user on new log', async ({interaction}) => {
    await logCommand.execute(interaction);
    const createdUser = await User.findOne({ userId: interaction.user.id });
    expect(createdUser._doc).toEqual(
        expect.objectContaining({
            displayName: interaction.user.displayName,
            guildId: interaction.guild.id,
            streak: 0
        })
    );
});

const expectCalledOnceWithSnapshot = (obj) => {
    expect(obj).toHaveBeenCalledOnce();
    expect(obj).toMatchSnapshot();
}

function generateRandomId(length = 10) {
    return Math.random().toString(36).substring(2, length); // Generate a random string of specified length
}