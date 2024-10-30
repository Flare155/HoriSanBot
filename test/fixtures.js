import Log from '../models/Log';
import { test } from 'vitest';

export const myTest = test.extend({
    interaction: async({}, use) => {
        await use(createMockInteraction());
    },
    log: async ({ interaction }, use) => {
        const newLog = new Log({
            userId: interaction.user.id,
            guildId: interaction.guild.id,
            timestamp: new Date(),
            medium: interaction.options.getString('medium'),
            title: interaction.options.getString('title'),
            notes: interaction.options.getString('notes'),
            isBackLog: false,
            amount: {
                totalSeconds: 10,
                count: 1,
                unit: 'Seconds'
            },
        });
        await newLog.save();
        await use(newLog);
    },
});

export function createMockInteraction(options) {
    const defaultOptions = {
        medium: 'Watchtime',
        amount: '120s',
        title: 'Test Title',
        notes: 'Some notes here',
        episode_length: '30',
    };

    options = options ?? defaultOptions;
    const interaction = {
        options: {
            getString: vi.fn((name) => options[name] || null),
        },
        setOption: (name, value) => {
            options[name] = value;
        },
        member: {
            displayName: 'test',
            displayAvatarURL: () => 'http://example.com/image.jpg'
        },
        user: {
            id: generateRandomId(),
            displayName: 'test',
            displayAvatarURL: () => 'http://example.com/image.jpg'
        },
        guild: {
            id: generateRandomId()
        },
        reply: vi.fn(), // Mock reply method to capture responses
        editReply: vi.fn(), // Mock reply method to capture responses,
        deferReply: vi.fn(), // Mock reply method to capture responses,
        channel: {
            createMessageComponentCollector: vi.fn()
        }
    };

    // Mock collector
    const mockCollector = {
        on: vi.fn(),
        stop: vi.fn()
    };

    interaction.channel.createMessageComponentCollector.mockReturnValue(mockCollector);
    return interaction;
};

function generateRandomId(length = 10) {
    return Math.random().toString(36).substring(2, length); // Generate a random string of specified length
}