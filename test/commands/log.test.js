import { expect, test, vi } from 'vitest';
import logCommand from '../../commands/global/log';

const createMockInteraction = (options = {}) => ({
    options: {
        getString: vi.fn((name) => options[name] || null),
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
    await logCommand.execute(interaction);
    expect(interaction.reply).toMatchSnapshot();
});