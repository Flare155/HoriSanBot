import logCommand from '../../commands/global/log';
import Log from '../../models/Log';
import User from '../../models/User';

const defaultOptions = {
    medium: 'Watchtime',
    amount: '120s',
    title: 'Test Title',
    notes: 'Some notes here',
    episode_length: '30',
};

const saveLog = vi.fn();
const createMockInteraction = (options = defaultOptions) => ({
    options: {
        getString: vi.fn((name) => options[name] || null),
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
    editReply: vi.fn(), // Mock reply method to capture responses
});

test('should fail on invalid time pattern', async () => {
    const interaction = createMockInteraction({
        ...defaultOptions,
        medium: 'WatchTime',
        amount: '10',
    });
    await logCommand.execute(interaction, saveLog);
    expectCalledOnceWithSnapshot(interaction.reply);
});

test('should send embed after saving log', async () => {
    const interaction = createMockInteraction({
        ...defaultOptions,
        amount: '2'
    });
    await logCommand.execute(interaction);
    expectCalledOnceWithSnapshot(interaction.reply);
});

test('should save log', async () => {
    const amount = 300;
    const interaction = createMockInteraction({
        ...defaultOptions,
        amount: `${amount}s`
    });

    await logCommand.execute(interaction);
    const createdLog = await Log.findOne({ userId: interaction.user.id, guildId: interaction.guild.id });
    expect(createdLog).not.toBeNull('No log could be find. It probably was not created');
    expect(createdLog._doc).toEqual(
        expect.objectContaining({
            amount: {
                count: amount,
                totalSeconds: amount,
                unit: 'Seconds'
            },
            medium: defaultOptions.medium,
            notes: defaultOptions.notes,
            title: defaultOptions.title
        })
    );
});

test('should save user on new log', async () => {
    const interaction = createMockInteraction();
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