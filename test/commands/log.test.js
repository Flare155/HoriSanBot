import { expect, test, vi } from 'vitest';
import logCommand from '../../commands/global/log';

const saveLog = vi.fn();
const createMockInteraction = (options = {}) => ({
    options: {
        getString: vi.fn((name) => options[name] || null),
    },
    user: {
        displayName: 'test',
        displayAvatarURL: () => 'http://example.com/image.jpg'
    },
    reply: vi.fn(), // Mock reply method to capture responses
});

test('should fail on invalid time pattern', async () => {
    const interaction = createMockInteraction({
        medium: 'Watchtime',
        amount: '10',
        title: 'Test Title',
        notes: 'Some notes here',
        episode_length: '30',
    });
    await logCommand.execute(interaction, saveLog);
    expectCalledOnceWithSnapshot(interaction.reply);
});

test('should save log', async () => {
    const interaction = createMockInteraction({
        medium: 'Watchtime',
        amount: '10m',
        title: 'Test Title',
        notes: 'Some notes here',
        episode_length: '30',
    });
    await logCommand.execute(interaction, saveLog);
    expectCalledOnceWithSnapshot(interaction.reply);
    expect(saveLog).toHaveBeenCalledOnce();
    expect(saveLog.mock.lastCall[0]).toMatchSnapshot();
});

const expectCalledOnceWithSnapshot = (obj) => {
    expect(obj).toHaveBeenCalledOnce();
    expect(obj).toMatchSnapshot();
}