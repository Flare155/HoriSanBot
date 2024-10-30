import { expect } from 'vitest';
import { execute } from '../../commands/global/editLog';
import Log from '../../models/Log';
import {myTest, createMockInteraction} from '../fixtures';

myTest('should return error when log not found by id', async ({ interaction }) => {
    await execute(interaction);
    expect(interaction.editReply).toMatchSnapshot();
});

myTest('should edit log', async ({ log, interaction }) => {
    let editInteraction = createMockInteraction({
        log_id: log.id,
        title: 'new title'
    });
    editInteraction.user = interaction.user;
    editInteraction.guild = interaction.guild;

    await execute(editInteraction);
    await confirmEdit(editInteraction);
    const editedLog = await Log.findById(log._id);
    expect(editedLog.title).toBe('new title');
});

myTest('should cancel edit log', async ({log, interaction}) => {
    let editInteraction = createMockInteraction({
        log_id: log.id,
        title: 'new title'
    });
    editInteraction.user = interaction.user;
    editInteraction.guild = interaction.guild;

    await execute(editInteraction);
    await cancelEdit(editInteraction);
    const editedLog = await Log.findById(log._id);
    expect(editedLog.title).toBe(log.title);
});

async function confirmEdit(interaction) {
    const collector = interaction.channel.createMessageComponentCollector();
    const collectorHandler = collector.on.mock.calls[0][1];
    await collectorHandler({ customId: 'confirm_edit', update: vi.fn() });
}

async function cancelEdit(interaction) {
    const collector = interaction.channel.createMessageComponentCollector();
    const collectorHandler = collector.on.mock.calls[0][1];
    await collectorHandler({ customId: 'cancel_edit', update: vi.fn() });
}
