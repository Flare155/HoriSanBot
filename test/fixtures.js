import Log from '../models/Log';
import User from '../models/User';
import { test } from 'vitest';
import { DateTime } from 'luxon';

export const myTest = test.extend({
    interaction: async ({ }, use) => {
        await use(createMockInteraction());
    },
    createUser: async ({ }, use) => {
        return await use(async ({ userId, guildId, timestamp, streak, timezone, displayName }) => {
            const user = new User({
                userId: userId ?? generateRandomId(),
                guildId: guildId ?? generateRandomId(),
                timestamp: timestamp ?? new Date(),
                streak: streak ?? 1,
                timezone: timezone ?? 'UTC',
                displayName: displayName ?? 'myUser'
            });
            await user.save();
            return user;
        });
    },
    createInteraction: async ({ }, use) => await use(createMockInteraction),
    createLog: async ({ createUser }, use) => {
        return await use(async (interaction, amount) => {
            const user = await User.findOne({ id: interaction.user.id });
            if (!user) {
                await createUser({
                    userId: interaction.user.id,
                    guildId: interaction.guild.id
                });
            }

            const newLog = new Log({
                userId: interaction.user.id,
                guildId: interaction.guild.id,
                timestamp: new Date().toISOString(),
                medium: interaction.options.getString('medium'),
                title: interaction.options.getString('title'),
                notes: interaction.options.getString('notes'),
                isBackLog: false,
                amount,
            });
            await newLog.save();
            return newLog;
        });
    },
    log: async ({ createLog, interaction }, use) => {
        const log = await createLog(interaction, {
            totalSeconds: 100,
            count: 1,
            unit: 'Seconds'
        });
        await use(log);
    },
    listeningLog: async ({ createLog, createInteraction }, use) => {
        const interaction = createInteraction({
            medium: 'Listening',
            title: 'listening test',
            notes: 'listening note',
        });
        const log = await createLog(interaction, {
            totalSeconds: 10,
            count: 1,
            unit: 'Seconds'
        });
        await use(log);
    },
    watchtimeLog: async ({ createLog, createInteraction }, use) => {
        const interaction = createInteraction({
            medium: 'Watchtime',
            title: 'WatchTime test',
            notes: 'WatchTime note',
        });
        const log = await createLog(interaction, {
            totalSeconds: 10,
            count: 1,
            unit: 'Seconds'
        });
        await use(log);
    },
    readtimeLog: async ({ createLog, createInteraction }, use) => {
        const interaction = createInteraction({
            medium: 'Readtime',
            amount: '15m',
            title: 'Readtime test',
            notes: 'Readtime note',
        });
        const log = await createLog(interaction, {
            totalSeconds: 10,
            count: 1,
            unit: 'Seconds'
        });
        await use(log);
    },
    youTubeLog: async ({ createLog, createInteraction }, use) => {
        const interaction = createInteraction({
            medium: 'YouTube',
            amount: '31m',
            title: 'YouTube test',
            notes: 'YouTube note',
        });
        const log = await createLog(interaction, {
            totalSeconds: 10,
            count: 1,
            unit: 'Seconds'
        });
        await use(log);
    },
    mangaLog: async ({ createLog, createInteraction }, use) => {
        const interaction = createInteraction({
            medium: 'Manga',
            amount: '120m',
            title: 'Manga test',
            notes: 'Manga note',
        });
        const log = await createLog(interaction, {
            totalSeconds: 10,
            count: 1,
            unit: 'Seconds'
        });
        await use(log);
    },
    animeLog: async ({ createLog, createInteraction }, use) => {
        const interaction = createInteraction({
            medium: 'Anime',
            title: 'Anime test',
            notes: 'Anime note',
        });
        const log = await createLog(interaction, {
            totalSeconds: 4000,
            count: 2,
            unit: 'Episodes',
            coefficient: 2000
        });
        await use(log);
    }
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