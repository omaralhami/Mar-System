/**
 * Mar System - Discord Bot
 * All-in-one Discord bot with welcome functionality, slash commands, embeds, buttons, and image handling
 * 
 * نظام مار - بوت ديسكورد
 * بوت ديسكورد شامل مع وظائف الترحيب، أوامر سلاش، إمبدز، أزرار، ومعالجة الصور
 */
require('dotenv').config();
const keepAlive = require('./keep_alive');
const { 
    Client, 
    Collection, 
    GatewayIntentBits, 
    Partials, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder,
    ButtonStyle,
    AttachmentBuilder,
    Events,
    REST,
    Routes,
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    PermissionFlagsBits,
    ChannelType,
    VoiceState
} = require('discord.js');
const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource,
    NoSubscriberBehavior, 
    VoiceConnectionStatus, 
    entersState,
    AudioPlayerStatus
} = require('@discordjs/voice');

// Bot configuration
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// Optional: Add file system module for persistence
const fs = require('fs');
const path = require('path');

// Path for persistent voice connection data
const VOICE_DATA_PATH = path.join(__dirname, 'voice_connections.json');
// Path for bot settings data
const SETTINGS_PATH = path.join(__dirname, 'settings.json');

// Path for giveaways data
const GIVEAWAYS_PATH = path.join(__dirname, 'giveaways.json');

// Create client with necessary intents and partials
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,  // Make sure this intent is included
        GatewayIntentBits.GuildInvites       // Add this intent for invite tracking
    ],
    partials: [Partials.Channel, Partials.Message, Partials.GuildMember]
});

// Color mapping for common color names
const COLORS = {
    red: '#FF0000',
    blue: '#0000FF',
    green: '#00FF00',
    yellow: '#FFFF00',
    purple: '#800080',
    pink: '#FFC0CB',
    orange: '#FFA500',
    black: '#000000',
    white: '#FFFFFF',
    aqua: '#00FFFF',
    gray: '#808080',
    gold: '#FFD700',
    silver: '#C0C0C0',
    blurple: '#5865F2',  // Discord blurple
    green: '#57F287',    // Discord green
    yellow: '#FEE75C',   // Discord yellow
    fuchsia: '#EB459E',  // Discord fuchsia
    red: '#ED4245'       // Discord red
};

// Slash commands configuration
const commands = [
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with pong and bot latency'),
    
    new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Send a welcome message to the channel'),
    
    new SlashCommandBuilder()
        .setName('setwelcome')
        .setDescription('Set the welcome channel for new member announcements')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send welcome messages to')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)),
    
    // New rules command
    new SlashCommandBuilder()
        .setName('rules')
        .setDescription('Display the server rules')
        .addBooleanOption(option =>
            option.setName('public')
                .setDescription('Whether to show the rules publicly (default: false)')
                .setRequired(false)),
    
    // New visual embed builder command
    new SlashCommandBuilder()
        .setName('create')
        .setDescription('Open a visual builder for embeds and buttons')
        .addSubcommand(subcommand =>
            subcommand
                .setName('embed')
                .setDescription('Create a feature-rich embed with visual editor'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('buttons')
                .setDescription('Create buttons with a visual form'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('poll')
                .setDescription('Create an interactive poll with voting options')),
                
    // New simple send commands
    new SlashCommandBuilder()
        .setName('send')
        .setDescription('Send various types of content to the channel')
        .addSubcommand(subcommand =>
            subcommand
                .setName('message')
                .setDescription('Create and send a message with visual editor'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('image')
                .setDescription('Send an image to the channel')
                .addStringOption(option => 
                    option.setName('url')
                        .setDescription('The URL of the image to send')
                        .setRequired(true))
                .addStringOption(option => 
                    option.setName('caption')
                        .setDescription('Optional caption to include with the image')
                        .setRequired(false))),
                        
    // Channel clear command
    new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Delete and recreate this channel with the same permissions')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for clearing the channel')
                .setRequired(false)),
                
    // Voice channel commands
    new SlashCommandBuilder()
        .setName('voice')
        .setDescription('Voice channel commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('join')
                .setDescription('Join a voice channel and stay connected')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The voice channel to join')
                        .setRequired(true))
                .addBooleanOption(option =>
                    option.setName('persistent')
                        .setDescription('Stay connected even if disconnected (default: true)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leave')
                .setDescription('Leave the voice channel'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check the current voice connection status'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('mute')
                .setDescription('Mute the bot in voice channel'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('unmute')
                .setDescription('Unmute the bot in voice channel'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('deafen')
                .setDescription('Deafen the bot in voice channel'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('undeafen')
                .setDescription('Undeafen the bot in voice channel')),
                
    // Giveaway commands
    new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Create and manage giveaways')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new giveaway')
                .addStringOption(option =>
                    option.setName('prize')
                        .setDescription('What prize are you giving away?')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('duration')
                        .setDescription('Duration of the giveaway (e.g., 1d, 12h, 30m)')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('winners')
                        .setDescription('Number of winners (default: 1)')
                        .setMinValue(1)
                        .setMaxValue(10)
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Optional description for the giveaway')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('image')
                        .setDescription('Optional image URL for the prize')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('end')
                .setDescription('End a giveaway early')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('The message ID of the giveaway')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reroll')
                .setDescription('Reroll the winners of a giveaway')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('The message ID of the giveaway')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('winners')
                        .setDescription('Number of winners to reroll (default: all)')
                        .setMinValue(1)
                        .setRequired(false))),
];

// Register slash commands when bot starts
const registerCommands = async () => {
    try {
        console.log('\x1b[34m✦ \x1b[0mStarted refreshing application slash commands...');
        
        const rest = new REST({ version: '10' }).setToken(TOKEN);
        
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands },
        );
        
        console.log('\x1b[32m✦ \x1b[1mSuccessfully reloaded application slash commands!\x1b[0m');
    } catch (error) {
        console.error('\x1b[31m✦ Error registering commands:\x1b[0m', error);
    }
};

// Function to save persistent voice connections to file
function savePersistentConnections() {
    const data = {};
    
    // Convert Map to object for saving
    client.voiceManager.persistentChannels.forEach((channelId, guildId) => {
        data[guildId] = channelId;
    });
    
    // Write to file
    fs.writeFileSync(VOICE_DATA_PATH, JSON.stringify(data, null, 2));
    console.log('\x1b[34m✦ \x1b[0mSaved persistent voice connections to file');
}

// Function to load persistent voice connections from file
function loadPersistentConnections() {
    try {
        if (fs.existsSync(VOICE_DATA_PATH)) {
            const data = JSON.parse(fs.readFileSync(VOICE_DATA_PATH, 'utf8'));
            
            // Convert object back to Map
            Object.entries(data).forEach(([guildId, channelId]) => {
                client.voiceManager.persistentChannels.set(guildId, channelId);
            });
            
            console.log('\x1b[34m✦ \x1b[0mLoaded persistent voice connections from file');
            return true;
        }
    } catch (error) {
        console.error('\x1b[31m✦ Error loading persistent voice connections:\x1b[0m', error);
    }
    
    return false;
}

// Store voice connection data
client.voiceManager = {
    connections: new Map(),
    persistentChannels: new Map(), // Channels to rejoin automatically
    reconnectTimers: new Map(),
    reconnectAttempts: new Map(), // Track reconnection attempts
    maxReconnectAttempts: 10, // Maximum number of reconnect attempts
    reconnectInterval: 5000, // 5 seconds between reconnect attempts
    audioPlayers: new Map(), // Audio players for each guild
    audioState: new Map() // Track mute/deafen state for each guild
};

// Store bot settings
client.settings = new Map(); // Guild settings like welcome channels

// Function to save settings to file
function saveSettings() {
    const data = {};
    
    // Convert Map to object for saving
    client.settings.forEach((settings, guildId) => {
        data[guildId] = settings;
    });
    
    // Write to file
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2));
    console.log('\x1b[34m✦ \x1b[0mSaved settings to file');
}

// Function to load settings from file
function loadSettings() {
    try {
        if (fs.existsSync(SETTINGS_PATH)) {
            const data = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
            
            // Convert object back to Map
            Object.entries(data).forEach(([guildId, settings]) => {
                client.settings.set(guildId, settings);
            });
            
            console.log('\x1b[34m✦ \x1b[0mLoaded settings from file');
            return true;
        }
    } catch (error) {
        console.error('\x1b[31m✦ Error loading settings:\x1b[0m', error);
    }
    
    return false;
}

// Store invite cache for tracking who invited who
const inviteCache = new Map();

// Store active giveaways
client.giveaways = new Map();

// Function to save giveaways to file
function saveGiveaways() {
    const data = Array.from(client.giveaways.entries()).map(([messageId, giveaway]) => {
        return {
            messageId,
            channelId: giveaway.channelId,
            guildId: giveaway.guildId,
            prize: giveaway.prize,
            description: giveaway.description,
            imageUrl: giveaway.imageUrl,
            winnerCount: giveaway.winnerCount,
            hostId: giveaway.hostId,
            endsAt: giveaway.endsAt,
            participants: Array.from(giveaway.participants)
        };
    });
    
    // Write to file
    fs.writeFileSync(GIVEAWAYS_PATH, JSON.stringify(data, null, 2));
    console.log('\x1b[34m✦ \x1b[0mSaved giveaways to file');
}

// Function to load giveaways from file
function loadGiveaways() {
    try {
        if (fs.existsSync(GIVEAWAYS_PATH)) {
            const data = JSON.parse(fs.readFileSync(GIVEAWAYS_PATH, 'utf8'));
            
            // Convert objects back to Map
            data.forEach(giveaway => {
                client.giveaways.set(giveaway.messageId, {
                    channelId: giveaway.channelId,
                    guildId: giveaway.guildId,
                    prize: giveaway.prize,
                    description: giveaway.description,
                    imageUrl: giveaway.imageUrl,
                    winnerCount: giveaway.winnerCount,
                    hostId: giveaway.hostId,
                    endsAt: giveaway.endsAt,
                    participants: new Set(giveaway.participants),
                    timer: null // Will be set up after loading
                });
            });
            
            console.log('\x1b[34m✦ \x1b[0mLoaded giveaways from file');
            return true;
        }
    } catch (error) {
        console.error('\x1b[31m✦ Error loading giveaways:\x1b[0m', error);
    }
    
    return false;
}

// Function to parse duration string (e.g., "1d 12h 30m") to milliseconds
function parseDuration(durationStr) {
    const durationRegex = /(\d+)([dhms])/gi;
    let match;
    let ms = 0;
    
    while ((match = durationRegex.exec(durationStr)) !== null) {
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        
        switch (unit) {
            case 'd':
                ms += value * 24 * 60 * 60 * 1000; // days to ms
                break;
            case 'h':
                ms += value * 60 * 60 * 1000; // hours to ms
                break;
            case 'm':
                ms += value * 60 * 1000; // minutes to ms
                break;
            case 's':
                ms += value * 1000; // seconds to ms
                break;
        }
    }
    
    return ms || 0;
}

// Function to format time remaining
function formatTimeRemaining(endsAt) {
    const now = Date.now();
    const timeLeft = endsAt - now;
    
    if (timeLeft <= 0) {
        return "Ended";
    }
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
    
    return parts.join(' ');
}

// Function to create a giveaway embed
function createGiveawayEmbed(giveaway, timeRemaining, ended = false) {
    const embed = new EmbedBuilder()
        .setTitle(`🎉 ${giveaway.prize}`)
        .setColor('#FFFFFF') // White color for giveaways
        .setTimestamp();
    
    if (giveaway.description) {
        embed.setDescription(giveaway.description);
    }
    
    if (giveaway.imageUrl) {
        embed.setImage(giveaway.imageUrl);
    }
    
    const participantCount = giveaway.participants ? giveaway.participants.size : 0;
    
    if (!ended) {
        embed.addFields(
            { name: '✦ Time Remaining', value: timeRemaining, inline: true },
            { name: '✦ Winners', value: `${giveaway.winnerCount}`, inline: true },
            { name: '✦ Entries', value: `${participantCount}`, inline: true },
            { name: '✦ Hosted by', value: `<@${giveaway.hostId}>`, inline: false }
        )
        .setFooter({ text: 'Click the button below to enter!', iconURL: client.user.displayAvatarURL() });
    } else {
        // For ended giveaways
        if (giveaway.winners && giveaway.winners.length > 0) {
            const winnerMentions = giveaway.winners.map(id => `<@${id}>`).join(', ');
            embed.addFields(
                { name: '✦ Winners', value: winnerMentions, inline: false },
                { name: '✦ Total Entries', value: `${participantCount}`, inline: true },
                { name: '✦ Hosted by', value: `<@${giveaway.hostId}>`, inline: true }
            )
            .setFooter({ text: 'Giveaway has ended', iconURL: client.user.displayAvatarURL() });
        } else {
            embed.addFields(
                { name: '✦ Winners', value: 'No valid winners', inline: false },
                { name: '✦ Total Entries', value: `${participantCount}`, inline: true },
                { name: '✦ Hosted by', value: `<@${giveaway.hostId}>`, inline: true }
            )
            .setFooter({ text: 'Giveaway has ended with no winners', iconURL: client.user.displayAvatarURL() });
        }
    }
    
    return embed;
}

// Function to select random winners from participants
function selectWinners(giveaway) {
    const participants = Array.from(giveaway.participants);
    const winnerCount = Math.min(giveaway.winnerCount, participants.length);
    const winners = [];
    
    // Shuffle participants using Fisher-Yates algorithm
    for (let i = participants.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [participants[i], participants[j]] = [participants[j], participants[i]];
    }
    
    // Select the first N participants as winners
    for (let i = 0; i < winnerCount; i++) {
        winners.push(participants[i]);
    }
    
    return winners;
}

// Function to end a giveaway
async function endGiveaway(messageId, forced = false) {
    try {
        const giveaway = client.giveaways.get(messageId);
        if (!giveaway) return false;
        
        // Clear the timer if it exists
        if (giveaway.timer) {
            clearTimeout(giveaway.timer);
            giveaway.timer = null;
        }
        
        // Get the guild and channel
        const guild = client.guilds.cache.get(giveaway.guildId);
        if (!guild) return false;
        
        const channel = guild.channels.cache.get(giveaway.channelId);
        if (!channel) return false;
        
        try {
            // Get the message
            const message = await channel.messages.fetch(messageId);
            if (!message) return false;
            
            // Select winners
            const winners = selectWinners(giveaway);
            giveaway.winners = winners;
            
            // Update the giveaway in the map
            client.giveaways.set(messageId, giveaway);
            
            // Create the ended embed
            const endedEmbed = createGiveawayEmbed(giveaway, "Ended", true);
            
            // Create buttons for rerolling
            const endedButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`giveaway_reroll_${messageId}`)
                        .setLabel('Reroll Winners')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🎲')
                );
            
            // Update the message
            await message.edit({
                embeds: [endedEmbed],
                components: [endedButtons]
            });
            
            // Send winner announcement
            if (winners.length > 0) {
                const winnerMentions = winners.map(id => `<@${id}>`).join(', ');
                const congratsMessage = `🎉 Congratulations ${winnerMentions}! You won **${giveaway.prize}**!`;
                await channel.send({ content: congratsMessage });
            } else {
                await channel.send({ content: `No valid winners for the giveaway **${giveaway.prize}**.` });
            }
            
            // Save giveaways to file
            saveGiveaways();
            
            return true;
        } catch (error) {
            console.error('\x1b[31m✦ Error ending giveaway:\x1b[0m', error);
            return false;
        }
    } catch (error) {
        console.error('\x1b[31m✦ Error ending giveaway:\x1b[0m', error);
        return false;
    }
}

// Function to setup timers for active giveaways
function setupGiveawayTimers() {
    client.giveaways.forEach((giveaway, messageId) => {
        const timeLeft = giveaway.endsAt - Date.now();
        
        // If the giveaway has already ended, end it now
        if (timeLeft <= 0) {
            endGiveaway(messageId);
            return;
        }
        
        // Set up a timer for the giveaway
        giveaway.timer = setTimeout(() => {
            endGiveaway(messageId);
        }, timeLeft);
        
        client.giveaways.set(messageId, giveaway);
    });
    
    console.log(`\x1b[34m✦ \x1b[0mSet up timers for ${client.giveaways.size} active giveaways`);
}

// Bot ready event
// حدث جاهزية البوت
client.once(Events.ClientReady, async () => {
    // Create a colorful ASCII art banner
    console.log('\n\x1b[36m' + '╔════════════════════════════════════════════════════════╗');
    console.log('\x1b[36m' + '║                                                        ║');
    console.log('\x1b[36m' + '║  \x1b[33m███╗   ███╗ █████╗ ██████╗     \x1b[35m███████╗██╗   ██╗███████╗\x1b[36m  ║');
    console.log('\x1b[36m' + '║  \x1b[33m████╗ ████║██╔══██╗██╔══██╗    \x1b[35m██╔════╝╚██╗ ██╔╝██╔════╝\x1b[36m  ║');
    console.log('\x1b[36m' + '║  \x1b[33m██╔████╔██║███████║██████╔╝    \x1b[35m███████╗ ╚████╔╝ ███████╗\x1b[36m  ║');
    console.log('\x1b[36m' + '║  \x1b[33m██║╚██╔╝██║██╔══██║██╔══██╗    \x1b[35m╚════██║  ╚██╔╝  ╚════██║\x1b[36m  ║');
    console.log('\x1b[36m' + '║  \x1b[33m██║ ╚═╝ ██║██║  ██║██║  ██║    \x1b[35m███████║   ██║   ███████║\x1b[36m  ║');
    console.log('\x1b[36m' + '║  \x1b[33m╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝    \x1b[35m╚══════╝   ╚═╝   ╚══════╝\x1b[36m  ║');
    console.log('\x1b[36m' + '║                                                        ║');
    console.log('\x1b[36m' + '╚════════════════════════════════════════════════════════╝\x1b[0m');
    
    console.log('\n\x1b[32m✦ \x1b[1mMar System Bot Online!\x1b[0m');
    console.log(`\x1b[32m✦ \x1b[0mLogged in as \x1b[33m${client.user.tag}\x1b[0m`);
    console.log(`\x1b[32m✦ \x1b[0mServing \x1b[33m${client.guilds.cache.size}\x1b[0m servers`);
    console.log(`\x1b[32m✦ \x1b[0mWatching \x1b[33m${client.users.cache.size}\x1b[0m users\n`);
    
    // Set the bot's activity to "Listening"
    client.user.setActivity('to your commands', { type: 2 }); // 2 corresponds to LISTENING
    
    // Register commands
    registerCommands();
    
    // Load settings
    // تحميل الإعدادات
    loadSettings();
    
    // Load giveaways and set up timers
    // تحميل الهدايا وإعداد المؤقتات
    if (loadGiveaways()) {
        setupGiveawayTimers();
    }
    
    // Cache all current invites for each guild
    // تخزين جميع الدعوات الحالية لكل سيرفر
    client.guilds.cache.forEach(async guild => {
        try {
            // Check if the bot has permissions to view invites
            // التحقق مما إذا كان البوت لديه أذونات لعرض الدعوات
            if (guild.members.me.permissions.has(PermissionFlagsBits.ManageGuild)) {
                const guildInvites = await guild.invites.fetch();
                inviteCache.set(guild.id, new Map(guildInvites.map(invite => [invite.code, invite.uses])));
                console.log(`\x1b[34m✦ \x1b[0mCached \x1b[33m${guildInvites.size}\x1b[0m invites for guild \x1b[36m${guild.name}\x1b[0m`);
            }
        } catch (error) {
            console.error(`\x1b[31m✦ Error caching invites for guild ${guild.id}:\x1b[0m`, error);
        }
    });
    
    // Load persistent voice connections and reconnect
    // تحميل اتصالات الصوت الدائمة وإعادة الاتصال
    if (loadPersistentConnections()) {
        console.log('\x1b[34m✦ \x1b[0mAttempting to reconnect to persistent voice channels...');
        
        // Reconnect to all persistent voice channels
        // إعادة الاتصال بجميع قنوات الصوت الدائمة
        for (const [guildId, channelId] of client.voiceManager.persistentChannels.entries()) {
            try {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) {
                    console.log(`\x1b[33m✦ \x1b[0mGuild ${guildId} not found, skipping reconnection`);
                    continue;
                }
                
                const channel = guild.channels.cache.get(channelId);
                if (!channel) {
                    console.log(`\x1b[33m✦ \x1b[0mChannel ${channelId} in guild ${guildId} not found, skipping reconnection`);
                    continue;
                }
                
                console.log(`\x1b[34m✦ \x1b[0mReconnecting to voice channel \x1b[36m${channel.name}\x1b[0m in \x1b[36m${guild.name}\x1b[0m`);
                await joinVoiceChannelAndSetup(guild, channel, true);
                console.log(`\x1b[32m✦ \x1b[0mSuccessfully reconnected to voice channel \x1b[36m${channel.name}\x1b[0m in \x1b[36m${guild.name}\x1b[0m`);
            } catch (error) {
                console.error(`\x1b[31m✦ Failed to reconnect to voice channel in guild ${guildId}:\x1b[0m`, error);
            }
        }
    }
    
    console.log('\x1b[35m✦ \x1b[1mMar System is ready to serve!\x1b[0m');
    console.log('\x1b[36m════════════════════════════════════════════════════════\x1b[0m\n');
});

// Track when new invites are created
client.on(Events.InviteCreate, invite => {
    const guildInvites = inviteCache.get(invite.guild.id) || new Map();
    guildInvites.set(invite.code, {
        uses: invite.uses,
        inviterId: invite.inviter ? invite.inviter.id : null
    });
    inviteCache.set(invite.guild.id, guildInvites);
    console.log(`\x1b[34m✦ \x1b[0mInvite ${invite.code} created for guild \x1b[36m${invite.guild.name}\x1b[0m`);
});

// Format a date in a user-friendly way
function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
}

// Calculate how many days ago an account was created
function getAccountAge(createdTimestamp) {
    const createdDate = new Date(createdTimestamp);
    const now = new Date();
    const diffTime = Math.abs(now - createdDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Handle voice state updates (for reconnecting if disconnected)
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    // Check if this update is for our bot
    if (newState.member.id !== client.user.id) return;
    
    const guildId = newState.guild.id;
    
    // If the bot was disconnected from a voice channel
    if (oldState.channelId && !newState.channelId) {
        // Check if this channel was set to be persistent
        const persistentChannelId = client.voiceManager.persistentChannels.get(guildId);
        
        if (persistentChannelId) {
            console.log(`Bot was disconnected from voice in guild ${guildId}. Will attempt to reconnect.`);
            
            // Clear any existing reconnect timer
            if (client.voiceManager.reconnectTimers.has(guildId)) {
                clearTimeout(client.voiceManager.reconnectTimers.get(guildId));
            }
            
            // Initialize reconnect attempts counter if not exists
            if (!client.voiceManager.reconnectAttempts.has(guildId)) {
                client.voiceManager.reconnectAttempts.set(guildId, 0);
            }
            
            // Set a timer to reconnect with exponential backoff
            const attempts = client.voiceManager.reconnectAttempts.get(guildId);
            const backoffTime = Math.min(30000, client.voiceManager.reconnectInterval * Math.pow(1.5, attempts)); // Max 30 seconds
            
            console.log(`Scheduling reconnect attempt ${attempts + 1} in ${backoffTime}ms`);
            
            const timer = setTimeout(async () => {
                try {
                    const guild = client.guilds.cache.get(guildId);
                    if (!guild) return;
                    
                    const channel = guild.channels.cache.get(persistentChannelId);
                    if (!channel) return;
                    
                    // Attempt to rejoin the channel
                    await joinVoiceChannelAndSetup(guild, channel, true);
                    console.log(`Successfully reconnected to voice channel ${channel.name} in ${guild.name}`);
                    
                    // Reset reconnect attempts on success
                    client.voiceManager.reconnectAttempts.set(guildId, 0);
                } catch (error) {
                    console.error(`Failed to reconnect to voice channel in guild ${guildId}:`, error);
                    
                    // Increment reconnect attempts
                    const newAttempts = client.voiceManager.reconnectAttempts.get(guildId) + 1;
                    client.voiceManager.reconnectAttempts.set(guildId, newAttempts);
                    
                    // If we haven't reached max attempts, schedule another reconnect
                    if (newAttempts < client.voiceManager.maxReconnectAttempts) {
                        // This will trigger another reconnect with increased backoff
                        client.emit(Events.VoiceStateUpdate, oldState, newState);
                    } else {
                        console.log(`Reached maximum reconnect attempts (${client.voiceManager.maxReconnectAttempts}) for guild ${guildId}`);
                    }
                }
            }, backoffTime);
            
            client.voiceManager.reconnectTimers.set(guildId, timer);
        }
    } else if (newState.channelId && (!oldState.channelId || oldState.channelId !== newState.channelId)) {
        // Bot has successfully connected or moved to a new channel
        // Reset reconnect attempts
        client.voiceManager.reconnectAttempts.set(guildId, 0);
    }
});

// Welcome event - when a new member joins
client.on(Events.GuildMemberAdd, async (member) => {
    // Check if there's a custom welcome channel set
    let welcomeChannelId = null;
    if (client.settings.has(member.guild.id)) {
        const guildSettings = client.settings.get(member.guild.id);
        welcomeChannelId = guildSettings.welcomeChannelId;
    }
    
    // Find the welcome channel, system channel, or the first text channel to send welcome message
    const channel = welcomeChannelId ? member.guild.channels.cache.get(welcomeChannelId) :
                    member.guild.systemChannel || 
                    member.guild.channels.cache.find(ch => 
                        ch.type === 0 && ch.permissionsFor(member.guild.members.me).has('SendMessages')
                    );
    
    if (!channel) return;
    
    // Try to find who invited the member
    let inviterId = null;
    let inviterMention = "Unknown";
    try {
        if (member.guild.members.me.permissions.has(PermissionFlagsBits.ManageGuild)) {
            // Fetch the new invite counts
            const newInvites = await member.guild.invites.fetch();
            // Get the cached invite counts
            const oldInvites = inviteCache.get(member.guild.id) || new Map();
            
            // Find the invite that was used
            const usedInvite = newInvites.find(invite => {
                const oldInviteData = oldInvites.get(invite.code);
                const oldUses = oldInviteData ? oldInviteData.uses : 0;
                return invite.uses > oldUses;
            });
            
            // Update the cache with new invite counts
            inviteCache.set(member.guild.id, new Map(
                newInvites.map(invite => [
                    invite.code, 
                    {
                        uses: invite.uses,
                        inviterId: invite.inviter ? invite.inviter.id : null
                    }
                ])
            ));
            
            // If we found the invite, get the inviter
            if (usedInvite && usedInvite.inviter) {
                inviterId = usedInvite.inviter.id;
                inviterMention = `<@${inviterId}>`;
            }
        }
    } catch (error) {
        console.error(`\x1b[31m✦ Error tracking invite for guild ${member.guild.id}:\x1b[0m`, error);
    }
    
    // Get account creation date info
    const accountCreated = formatDate(member.user.createdAt);
    const accountAge = getAccountAge(member.user.createdTimestamp);
    
    // Create welcome embed with simplified design
    const welcomeEmbed = new EmbedBuilder()
        .setColor('#FFFFFF') // White color
        .setTitle('✦ New Member')
        .setDescription(`**Hey** ${member.user} Welcome to ${member.guild.name}!\n\n✦ We're glad to have you here.\n✦ Feel free to introduce yourself.\n✦ Check out our channels and get involved!`)
        .addFields(
            { name: '✦ Member ', value: `${member.guild.memberCount}`, inline: true },
            { name: '✦ Account Created', value: `\`${accountCreated}\``, inline: true }
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setFooter({ text: 'Mar System Welcomer', iconURL: client.user.displayAvatarURL() });
    
    // Add inviter field if available
    if (inviterId) {
        welcomeEmbed.addFields({ name: '✦ Invited By', value: inviterMention, inline: true });
    }
    
    // Create welcome buttons
    const welcomeButtons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('rules')
                .setLabel('Rules')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('custom_service')
                .setLabel('Want a custom service?')
                .setStyle(ButtonStyle.Secondary)
        );
    
    await channel.send({ embeds: [welcomeEmbed], components: [welcomeButtons] });
});

// Function to get the appropriate suffix for numbers
function getSuffix(num) {
    const j = num % 10;
    const k = num % 100;
    
    if (j === 1 && k !== 11) {
        return 'st';
    }
    if (j === 2 && k !== 12) {
        return 'nd';
    }
    if (j === 3 && k !== 13) {
        return 'rd';
    }
    return 'th';
}

// Helper function to resolve color names or hex codes
function resolveColor(color) {
    if (!color) return '#FFFFFF'; // Default white instead of Discord blurple
    
    // If it's a hex code already, return it
    if (color.startsWith('#')) {
        return color;
    }
    
    // Convert to lowercase for case-insensitive matching
    const lowerColor = color.toLowerCase();
    
    // If it's a recognized color name, return the hex
    if (COLORS[lowerColor]) {
        return COLORS[lowerColor];
    }
    
    // Default color if not found
    return '#FFFFFF';
}

// Function to create a button based on input parameters
function createButton(label, style, emoji, url, customId) {
    const button = new ButtonBuilder()
        .setLabel(label);
    
    // Set style
    switch (style.toLowerCase()) {
        case 'primary':
            button.setStyle(ButtonStyle.Primary);
            break;
        case 'success':
            button.setStyle(ButtonStyle.Success);
            break;
        case 'danger':
            button.setStyle(ButtonStyle.Danger);
            break;
        case 'link':
            button.setStyle(ButtonStyle.Link);
            if (url) {
                button.setURL(url);
            } else {
                button.setURL('https://discord.com'); // Default URL
            }
            break;
        default:
            button.setStyle(ButtonStyle.Secondary); // Default to Secondary instead of Primary
    }
    
    // Add emoji if provided
    if (emoji) {
        button.setEmoji(emoji);
    }
    
    // Set custom ID for non-link buttons
    if (style.toLowerCase() !== 'link') {
        button.setCustomId(customId);
    }
    
    return button;
}

// Create a color selector menu
function createColorSelector() {
    const colorOptions = Object.keys(COLORS).map(color => {
        return new StringSelectMenuOptionBuilder()
            .setLabel(color.charAt(0).toUpperCase() + color.slice(1))
            .setValue(color)
            .setDescription(`Set embed color to ${color}`)
    });

    const colorSelector = new StringSelectMenuBuilder()
        .setCustomId('color_selector')
        .setPlaceholder('Select a color for your embed')
        .addOptions(colorOptions);

    return new ActionRowBuilder().addComponents(colorSelector);
}

// Create a visual progress bar
function createProgressBar(percentage) {
    const filledBlocks = Math.round(percentage / 10);
    const emptyBlocks = 10 - filledBlocks;
    
    const filledChar = '█';
    const emptyChar = '░';
    
    return filledChar.repeat(filledBlocks) + emptyChar.repeat(emptyBlocks);
}

// Store button response messages
const buttonResponses = new Map();

// Store poll data
const pollData = new Map();

// Handle slash commands
client.on(Events.InteractionCreate, async interaction => {
    // Only handle slash commands in this handler
    if (!interaction.isChatInputCommand()) return;
    
    try {
        const { commandName, options } = interaction;
        console.log(`Received command: ${commandName}`);
        
        // Check if the user has Administrator permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            await interaction.reply({
                content: 'You need Administrator permissions to use this bot.',
                ephemeral: true
            });
            return;
        }
        
        // Ping command
        if (commandName === 'ping') {
            await interaction.reply('Pong! ' + client.ws.ping + 'ms');
        }
        
        // Welcome command
        else if (commandName === 'welcome') {
            // Create welcome embed with simplified design
            const welcomeEmbed = new EmbedBuilder()
                .setColor('#FFFFFF')
                .setTitle('✦ New Member')
                .setDescription(`**Hey** ${interaction.user}. Welcome to **${interaction.guild.name}**!\n\n✦ We're glad to have you here.\n✦ Feel free to introduce yourself.\n✦ Check out our channels and get involved!`)
                .addFields(
                    { name: '✦ Member', value: `${interaction.guild.memberCount}`, inline: true },
                    { name: '✦ Account Created', value: `\`${formatDate(interaction.user.createdAt)}\``, inline: true },
                    { name: '✦ Invited By', value: `<@${client.user.id}>`, inline: true } // Use bot as example inviter
                )
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 256 }))
                .setFooter({ text: 'Mar System Welcomer', iconURL: client.user.displayAvatarURL() });
            
            // Create welcome buttons
            const welcomeButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('rules')
                        .setLabel('Rules')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('custom_service')
                        .setLabel('Want a custom service?')
                        .setStyle(ButtonStyle.Secondary)
                );
            
            await interaction.reply({ embeds: [welcomeEmbed], components: [welcomeButtons] });
        }
        
        // Set Welcome Channel command
        else if (commandName === 'setwelcome') {
            // Check if the user has permission to manage the server
            if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
                await interaction.reply({
                    content: 'You need the "Manage Server" permission to use this command.',
                    ephemeral: true
                });
                return;
            }
            
            const channel = options.getChannel('channel');
            
            // Validate channel type
            if (channel.type !== ChannelType.GuildText) {
                await interaction.reply({
                    content: 'Please select a text channel for welcome messages.',
                    ephemeral: true
                });
                return;
            }
            
            // Check bot permissions in the channel
            const permissions = channel.permissionsFor(interaction.guild.members.me);
            if (!permissions.has('SendMessages') || !permissions.has('EmbedLinks')) {
                await interaction.reply({
                    content: `I don't have permission to send messages or embeds in ${channel}. Please give me the required permissions first.`,
                    ephemeral: true
                });
                return;
            }
            
            // Initialize guild settings if they don't exist
            if (!client.settings.has(interaction.guildId)) {
                client.settings.set(interaction.guildId, {});
            }
            
            // Update the welcome channel
            const guildSettings = client.settings.get(interaction.guildId);
            guildSettings.welcomeChannelId = channel.id;
            
            // Save settings
            saveSettings();
            
            // Create confirmation embed
            const confirmEmbed = new EmbedBuilder()
                .setColor('#FFFFFF')
                .setTitle('Welcome Channel Set')
                .setDescription(`Welcome messages will now be sent to ${channel}`)
                .setTimestamp()
                .setFooter({ text: 'Mar System Settings', iconURL: client.user.displayAvatarURL() });
            
            await interaction.reply({
                embeds: [confirmEmbed],
                ephemeral: true
            });
        }
        
        // Rules command
        else if (commandName === 'rules') {
            // Get the public option (default: false)
            const isPublic = options.getBoolean('public') ?? false;
            
            // Create rules embed (same as the one used in the button handler)
            const rulesEmbed = new EmbedBuilder()
                .setColor('#FFFFFF')
                .setTitle('Server Rules')
                .setDescription('Please follow these guidelines to ensure a positive experience for everyone:')
                .addFields(
                    { name: '✦ Respect Others', value: 'Treat everyone with kindness and respect.' },
                    { name: '✦ No Spam', value: 'Avoid spamming messages, mentions, or excessive emotes.' },
                    { name: '✦ Appropriate Content', value: 'Keep all content suitable for all audiences.' },
                    { name: '✦ Follow Discord ToS', value: 'Adhere to Discord\'s Terms of Service at all times.' }
                )
                .setFooter({ text: 'Mar System Rules', iconURL: client.user.displayAvatarURL() });
            
            // Reply with the rules embed, making it ephemeral based on the public option
            await interaction.reply({ 
                embeds: [rulesEmbed], 
                ephemeral: !isPublic 
            });
        }
        
        // Removing embed command handler
        
        // Removing button command handler
        
        // Voice commands
        else if (commandName === 'voice') {
            const subcommand = options.getSubcommand();
            
            if (subcommand === 'join') {
                const channel = options.getChannel('channel');
                const persistent = options.getBoolean('persistent') ?? true;
                
                if (channel.type !== ChannelType.GuildVoice) {
                    return await interaction.reply({ 
                        content: 'Please select a voice channel.',
                        ephemeral: true
                    });
                }
                
                try {
                    await joinVoiceChannelAndSetup(interaction.guild, channel, persistent);
                    await interaction.reply({ 
                        content: `Joined ${channel.name}. ${persistent ? 'I will try to stay connected even if disconnected.' : ''}`,
                        ephemeral: true
                    });
                } catch (error) {
                    console.error('Error joining voice channel:', error);
                    await interaction.reply({ 
                        content: `Failed to join ${channel.name}. Please check my permissions and try again.`,
                        ephemeral: true
                    });
                }
            }
            else if (subcommand === 'leave') {
                const connection = client.voiceManager.connections.get(interaction.guildId);
                
                if (connection) {
                    // Remove from persistent connections if it was persistent
                    client.voiceManager.persistentChannels.delete(interaction.guildId);
                    savePersistentConnections();
                    
                    // Destroy the connection
                    connection.destroy();
                    client.voiceManager.connections.delete(interaction.guildId);
                    
                    await interaction.reply({ 
                        content: 'Left the voice channel.',
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({ 
                        content: 'I am not connected to any voice channel in this server.',
                        ephemeral: true
                    });
                }
            }
            else if (subcommand === 'status') {
                const connection = client.voiceManager.connections.get(interaction.guildId);
                const persistentChannelId = client.voiceManager.persistentChannels.get(interaction.guildId);
                
                if (connection) {
                    const channel = interaction.guild.channels.cache.get(connection.joinConfig.channelId);
                    const audioState = client.voiceManager.audioState.get(interaction.guildId) || { muted: false, deafened: false };
                    
                    const statusEmbed = new EmbedBuilder()
                        .setTitle('Voice Connection Status')
                        .setColor('#FFFFFF')
                        .addFields(
                            { name: 'Connected to', value: channel ? channel.name : 'Unknown channel', inline: true },
                            { name: 'Persistent', value: persistentChannelId ? 'Yes' : 'No', inline: true },
                            { name: 'Status', value: connection.state.status, inline: true },
                            { name: 'Muted', value: audioState.muted ? 'Yes' : 'No', inline: true },
                            { name: 'Deafened', value: audioState.deafened ? 'Yes' : 'No', inline: true }
                        );
                        
                    await interaction.reply({ 
                        embeds: [statusEmbed],
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({ 
                        content: 'I am not connected to any voice channel in this server.',
                        ephemeral: true
                    });
                }
            }
            else if (subcommand === 'mute') {
                const connection = client.voiceManager.connections.get(interaction.guildId);
                
                if (connection) {
                    // Update the bot's mute state
                    const newState = updateBotAudioState(interaction.guildId, { muted: true });
                    
                    // Actually mute the bot in the voice channel
                    await interaction.guild.members.me.voice.setMute(true);
                    
                    await interaction.reply({ 
                        content: 'I am now muted in the voice channel.',
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({ 
                        content: 'I am not connected to any voice channel in this server.',
                        ephemeral: true
                    });
                }
            }
            else if (subcommand === 'unmute') {
                const connection = client.voiceManager.connections.get(interaction.guildId);
                
                if (connection) {
                    // Update the bot's mute state
                    const newState = updateBotAudioState(interaction.guildId, { muted: false });
                    
                    // Actually unmute the bot in the voice channel
                    await interaction.guild.members.me.voice.setMute(false);
                    
                    await interaction.reply({ 
                        content: 'I am now unmuted in the voice channel.',
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({ 
                        content: 'I am not connected to any voice channel in this server.',
                        ephemeral: true
                    });
                }
            }
            else if (subcommand === 'deafen') {
                const connection = client.voiceManager.connections.get(interaction.guildId);
                
                if (connection) {
                    // Update the bot's deaf state
                    const newState = updateBotAudioState(interaction.guildId, { deafened: true });
                    
                    // Actually deafen the bot in the voice channel
                    await interaction.guild.members.me.voice.setDeaf(true);
                    
                    await interaction.reply({ 
                        content: 'I am now deafened in the voice channel.',
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({ 
                        content: 'I am not connected to any voice channel in this server.',
                        ephemeral: true
                    });
                }
            }
            else if (subcommand === 'undeafen') {
                const connection = client.voiceManager.connections.get(interaction.guildId);
                
                if (connection) {
                    // Update the bot's deaf state
                    const newState = updateBotAudioState(interaction.guildId, { deafened: false });
                    
                    // Actually undeafen the bot in the voice channel
                    await interaction.guild.members.me.voice.setDeaf(false);
                    
                    await interaction.reply({ 
                        content: 'I am now undeafened in the voice channel.',
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({ 
                        content: 'I am not connected to any voice channel in this server.',
                        ephemeral: true
                    });
                }
            }
        }
        
        // Giveaway commands
        else if (commandName === 'giveaway') {
            const subcommand = options.getSubcommand();
            
            // Create a new giveaway
            if (subcommand === 'create') {
                // Get options
                const prize = options.getString('prize');
                const winnerCount = options.getInteger('winners') || 1;
                const durationStr = options.getString('duration');
                const description = options.getString('description');
                const imageUrl = options.getString('image');
                
                // Parse duration
                const duration = parseDuration(durationStr);
                
                if (duration <= 0) {
                    return await interaction.reply({
                        content: 'Invalid duration format. Please use a format like "1d 12h 30m" (days, hours, minutes).',
                        ephemeral: true
                    });
                }
                
                // Calculate end time
                const endsAt = Date.now() + duration;
                
                // Create giveaway data
                const giveawayData = {
                    channelId: interaction.channelId,
                    guildId: interaction.guildId,
                    prize,
                    description,
                    imageUrl,
                    winnerCount,
                    hostId: interaction.user.id,
                    endsAt,
                    participants: new Set(),
                    timer: null
                };
                
                // Defer reply while we set up the giveaway
                await interaction.deferReply({ ephemeral: true });
                
                try {
                    // Create the giveaway embed
                    const timeRemaining = formatTimeRemaining(endsAt);
                    const giveawayEmbed = createGiveawayEmbed(giveawayData, timeRemaining);
                    
                    // Create the entry button
                    const entryButton = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('giveaway_enter')
                                .setLabel('Enter Giveaway')
                                .setStyle(ButtonStyle.Secondary)
                                .setEmoji('🎉')
                        );
                    
                    // Send the giveaway message
                    const giveawayMessage = await interaction.channel.send({
                        embeds: [giveawayEmbed],
                        components: [entryButton]
                    });
                    
                    // Store the message ID in the giveaway data
                    const messageId = giveawayMessage.id;
                    
                    // Set up timer for the giveaway
                    giveawayData.timer = setTimeout(() => {
                        endGiveaway(messageId);
                    }, duration);
                    
                    // Store the giveaway in the map
                    client.giveaways.set(messageId, giveawayData);
                    
                    // Save giveaways to file
                    saveGiveaways();
                    
                    // Reply to the user
                    await interaction.followUp({
                        content: `Giveaway for **${prize}** created! It will end in ${timeRemaining}.`,
                        ephemeral: true
                    });
                } catch (error) {
                    console.error('\x1b[31m✦ Error creating giveaway:\x1b[0m', error);
                    await interaction.followUp({
                        content: 'There was an error creating the giveaway. Please try again.',
                        ephemeral: true
                    });
                }
            }
            
            // End a giveaway early
            else if (subcommand === 'end') {
                const messageId = options.getString('message_id');
                
                // Check if the giveaway exists
                if (!client.giveaways.has(messageId)) {
                    return await interaction.reply({
                        content: 'Giveaway not found. Please check the message ID and try again.',
                        ephemeral: true
                    });
                }
                
                // Check if the user is the host or has manage server permission
                const giveaway = client.giveaways.get(messageId);
                const isHost = giveaway.hostId === interaction.user.id;
                const hasPermission = interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);
                
                if (!isHost && !hasPermission) {
                    return await interaction.reply({
                        content: 'You do not have permission to end this giveaway.',
                        ephemeral: true
                    });
                }
                
                // Defer reply
                await interaction.deferReply({ ephemeral: true });
                
                try {
                    // End the giveaway
                    const success = await endGiveaway(messageId, true);
                    
                    if (success) {
                        await interaction.followUp({
                            content: `The giveaway for **${giveaway.prize}** has been ended.`,
                            ephemeral: true
                        });
                    } else {
                        await interaction.followUp({
                            content: 'There was an error ending the giveaway. Please try again.',
                            ephemeral: true
                        });
                    }
                } catch (error) {
                    console.error('\x1b[31m✦ Error ending giveaway:\x1b[0m', error);
                    await interaction.followUp({
                        content: 'There was an error ending the giveaway. Please try again.',
                        ephemeral: true
                    });
                }
            }
            
            // Reroll winners for a giveaway
            else if (subcommand === 'reroll') {
                const messageId = options.getString('message_id');
                const winnerCount = options.getInteger('winners');
                
                // Check if the giveaway exists
                if (!client.giveaways.has(messageId)) {
                    return await interaction.reply({
                        content: 'Giveaway not found. Please check the message ID and try again.',
                        ephemeral: true
                    });
                }
                
                // Check if the user is the host or has manage server permission
                const giveaway = client.giveaways.get(messageId);
                const isHost = giveaway.hostId === interaction.user.id;
                const hasPermission = interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);
                
                if (!isHost && !hasPermission) {
                    return await interaction.reply({
                        content: 'You do not have permission to reroll this giveaway.',
                        ephemeral: true
                    });
                }
                
                // Check if the giveaway has ended
                if (!giveaway.winners) {
                    return await interaction.reply({
                        content: 'This giveaway has not ended yet.',
                        ephemeral: true
                    });
                }
                
                // Check if there are enough participants
                if (!giveaway.participants || giveaway.participants.size === 0) {
                    return await interaction.reply({
                        content: 'There are no participants to reroll.',
                        ephemeral: true
                    });
                }
                
                // Defer reply
                await interaction.deferReply({ ephemeral: true });
                
                try {
                    // Determine how many winners to reroll
                    const rerollCount = winnerCount || giveaway.winnerCount;
                    
                    // Select new winners
                    const newWinners = selectWinners(giveaway).slice(0, rerollCount);
                    
                    // Update the giveaway winners
                    giveaway.winners = newWinners;
                    client.giveaways.set(messageId, giveaway);
                    
                    // Save giveaways to file
                    saveGiveaways();
                    
                    // Get the channel
                    const channel = interaction.guild.channels.cache.get(giveaway.channelId);
                    
                    if (channel) {
                        // Update the giveaway message
                        try {
                            const message = await channel.messages.fetch(messageId);
                            if (message) {
                                const endedEmbed = createGiveawayEmbed(giveaway, "Ended", true);
                                
                                await message.edit({
                                    embeds: [endedEmbed],
                                    components: [
                                        new ActionRowBuilder()
                                            .addComponents(
                                                new ButtonBuilder()
                                                    .setCustomId(`giveaway_reroll_${messageId}`)
                                                    .setLabel('Reroll Winners')
                                                    .setStyle(ButtonStyle.Secondary)
                                                    .setEmoji('🎲')
                                            )
                                    ]
                                });
                            }
                        } catch (error) {
                            console.error('\x1b[31m✦ Error updating giveaway message:\x1b[0m', error);
                        }
                        
                        // Send winner announcement
                        if (newWinners.length > 0) {
                            const winnerMentions = newWinners.map(id => `<@${id}>`).join(', ');
                            const congratsMessage = `🎉 Rerolled! Congratulations ${winnerMentions}! You won **${giveaway.prize}**!`;
                            await channel.send({ content: congratsMessage });
                        } else {
                            await channel.send({ content: `Reroll failed. No valid winners for the giveaway **${giveaway.prize}**.` });
                        }
                    }
                    
                    await interaction.followUp({
                        content: `Rerolled ${rerollCount} winners for the giveaway **${giveaway.prize}**.`,
                        ephemeral: true
                    });
                } catch (error) {
                    console.error('\x1b[31m✦ Error rerolling giveaway:\x1b[0m', error);
                    await interaction.followUp({
                        content: 'There was an error rerolling the giveaway. Please try again.',
                        ephemeral: true
                    });
                }
            }
        }
        
        // Create command with subcommands
        else if (commandName === 'create') {
            const subcommand = options.getSubcommand();
            console.log(`Processing create subcommand: ${subcommand}`);
            
            if (subcommand === 'embed') {
                // Create modal for embed creation
                const embedModal = new ModalBuilder()
                    .setCustomId('advanced_embed_modal')
                    .setTitle('Create Advanced Embed');
                
                // Add inputs for embed properties
                const titleInput = new TextInputBuilder()
                    .setCustomId('embed_title')
                    .setLabel('Title')
                    .setPlaceholder('Enter embed title')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);
                    
                const descriptionInput = new TextInputBuilder()
                    .setCustomId('embed_description')
                    .setLabel('Description')
                    .setPlaceholder('Enter embed description')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);
                    
                const colorInput = new TextInputBuilder()
                    .setCustomId('embed_color')
                    .setLabel('Color (name or hex)')
                    .setPlaceholder('e.g., red, blue, #FF0000')
                    .setStyle(TextInputStyle.Short)
                    .setValue('white')
                    .setRequired(false);
                    
                const authorInput = new TextInputBuilder()
                    .setCustomId('embed_author')
                    .setLabel('Author Name (optional)')
                    .setPlaceholder('Enter author name')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false);
                    
                const thumbnailInput = new TextInputBuilder()
                    .setCustomId('embed_thumbnail')
                    .setLabel('Thumbnail URL (optional)')
                    .setPlaceholder('https://example.com/image.png')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false);
                
                // Add inputs to modal
                const row1 = new ActionRowBuilder().addComponents(titleInput);
                const row2 = new ActionRowBuilder().addComponents(descriptionInput);
                const row3 = new ActionRowBuilder().addComponents(colorInput);
                const row4 = new ActionRowBuilder().addComponents(authorInput);
                const row5 = new ActionRowBuilder().addComponents(thumbnailInput);
                
                embedModal.addComponents(row1, row2, row3, row4, row5);
                
                // Show the modal
                await interaction.showModal(embedModal);
            }
            else if (subcommand === 'buttons') {
                // Create modal for buttons message
                const buttonsModal = new ModalBuilder()
                    .setCustomId('buttons_creator_modal')
                    .setTitle('Create Message with Buttons');
                
                // Add input for message text
                const messageInput = new TextInputBuilder()
                    .setCustomId('message_text')
                    .setLabel('Message Text')
                    .setPlaceholder('Enter the message to show with buttons')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);
                
                // Add input to modal
                const row = new ActionRowBuilder().addComponents(messageInput);
                buttonsModal.addComponents(row);
                
                // Show the modal
                await interaction.showModal(buttonsModal);
            }
            else if (subcommand === 'poll') {
                // Create modal for poll creation
                const pollModal = new ModalBuilder()
                    .setCustomId('poll_creator_modal')
                    .setTitle('Create a Poll');
                
                // Add inputs for poll properties
                const questionInput = new TextInputBuilder()
                    .setCustomId('poll_question')
                    .setLabel('Poll Question')
                    .setPlaceholder('What would you like to ask?')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);
                    
                const option1Input = new TextInputBuilder()
                    .setCustomId('poll_option1')
                    .setLabel('Option 1')
                    .setPlaceholder('First option')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);
                    
                const option2Input = new TextInputBuilder()
                    .setCustomId('poll_option2')
                    .setLabel('Option 2')
                    .setPlaceholder('Second option')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);
                    
                const option3Input = new TextInputBuilder()
                    .setCustomId('poll_option3')
                    .setLabel('Option 3 (optional)')
                    .setPlaceholder('Third option')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false);
                    
                const option4Input = new TextInputBuilder()
                    .setCustomId('poll_option4')
                    .setLabel('Option 4 (optional)')
                    .setPlaceholder('Fourth option')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false);
                
                // Add inputs to modal
                const row1 = new ActionRowBuilder().addComponents(questionInput);
                const row2 = new ActionRowBuilder().addComponents(option1Input);
                const row3 = new ActionRowBuilder().addComponents(option2Input);
                const row4 = new ActionRowBuilder().addComponents(option3Input);
                const row5 = new ActionRowBuilder().addComponents(option4Input);
                
                pollModal.addComponents(row1, row2, row3, row4, row5);
                
                // Show the modal
                await interaction.showModal(pollModal);
            }
        }
        
        // Send command with subcommands
        else if (commandName === 'send') {
            const subcommand = options.getSubcommand();
            
            if (subcommand === 'message') {
                // Create modal for message creation
                const messageModal = new ModalBuilder()
                    .setCustomId('message_creator_modal')
                    .setTitle('Create a Message');
                
                // Add input for message content
                const contentInput = new TextInputBuilder()
                    .setCustomId('message_content')
                    .setLabel('Message Content')
                    .setPlaceholder('Enter your message here')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);
                
                // Add input to modal
                const row = new ActionRowBuilder().addComponents(contentInput);
                messageModal.addComponents(row);
                
                // Show the modal
                await interaction.showModal(messageModal);
            }
            else if (subcommand === 'image') {
                const url = options.getString('url');
                const caption = options.getString('caption');
                
                try {
                    // Validate URL format
                    new URL(url);
                    
                    // Send the image with optional caption
                    await interaction.reply({
                        content: caption || null,
                        files: [url]
                    });
                } catch (error) {
                    await interaction.reply({
                        content: 'Invalid image URL. Please provide a valid direct link to an image.',
                        ephemeral: true
                    });
                }
            }
        }
        
        // Clear channel command
        else if (commandName === 'clear') {
            const reason = options.getString('reason') || 'No reason provided';
            
            // Check if the user has permission to manage channels
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                await interaction.reply({
                    content: 'You do not have permission to use this command.',
                    ephemeral: true
                });
                return;
            }
            
            // Check if the bot has permission to manage channels
            if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
                await interaction.reply({
                    content: 'I do not have permission to manage channels.',
                    ephemeral: true
                });
                return;
            }
            
            // Ask for confirmation
            const confirmEmbed = new EmbedBuilder()
                .setTitle('⚠️ Clear Channel Confirmation')
                .setDescription('This will **delete and recreate** this channel with the same permissions.\nAll messages will be permanently deleted.\n\nAre you sure you want to continue?')
                .setColor('#FFFFFF')
                .addFields({ name: 'Reason', value: reason });
            
            const confirmRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_clear')
                        .setLabel('Yes, Clear Channel')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('cancel_clear')
                        .setLabel('Cancel')
                        .setStyle(ButtonStyle.Secondary)
                );
            
            // Store channel data for the confirmation handler
            client.clearChannelData = {
                channelId: interaction.channelId,
                channelName: interaction.channel.name,
                channelTopic: interaction.channel.topic,
                channelNsfw: interaction.channel.nsfw,
                channelRateLimitPerUser: interaction.channel.rateLimitPerUser,
                channelParent: interaction.channel.parentId,
                channelPosition: interaction.channel.position,
                permissionOverwrites: interaction.channel.permissionOverwrites.cache,
                guildId: interaction.guildId,
                userId: interaction.user.id,
                reason: reason
            };
            
            await interaction.reply({
                embeds: [confirmEmbed],
                components: [confirmRow],
                ephemeral: true
            });
        }
        
        // Other commands
        else {
            // Handle other commands as needed
            await interaction.reply({ content: `Command received: /${commandName}`, ephemeral: true });
        }
    } catch (error) {
        console.error('Error executing command:', error);
        
        // Reply with error if we haven't replied yet
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ 
                content: 'There was an error executing this command!', 
                ephemeral: true 
            }).catch(console.error);
        }
    }
});

// Create a silent audio resource (used for keeping connection alive)
const createSilenceResource = () => {
    try {
        // Import the required modules
        const { createAudioResource } = require('@discordjs/voice');
        const { Readable } = require('stream');
        
        // Create a simple silent buffer (PCM format)
        const buffer = Buffer.alloc(1920); // Small buffer of silence
        const silenceStream = Readable.from(buffer);
        
        // Create and return the audio resource without opus
        return createAudioResource(silenceStream, { 
            inputType: 'raw',
            inlineVolume: true 
        });
    } catch (error) {
        console.error('Error creating silence resource:', error);
        return null;
    }
};

// Handle button interactions
client.on(Events.InteractionCreate, async interaction => {
    // Skip if this is a slash command (handled by the other listener)
    if (interaction.isChatInputCommand()) return;
    
    try {
        // Handle button clicks
        if (interaction.isButton()) {
            console.log(`Button clicked: ${interaction.customId}`);
            
            // Rules button handler
            if (interaction.customId === 'rules') {
                const rulesEmbed = new EmbedBuilder()
                    .setColor('#FFFFFF')
                    .setTitle('Server Rules')
                    .setDescription('Please follow these guidelines to ensure a positive experience for everyone:')
                    .addFields(
                        { name: '✦ Respect Others', value: 'Treat everyone with kindness and respect.' },
                        { name: '✦ No Spam', value: 'Avoid spamming messages, mentions, or excessive emotes.' },
                        { name: '✦ Appropriate Content', value: 'Keep all content suitable for all audiences.' },
                        { name: '✦ Follow Discord ToS', value: 'Adhere to Discord\'s Terms of Service at all times.' }
                    )
                    .setFooter({ text: 'Mar System Rules', iconURL: client.user.displayAvatarURL() });
                
                await interaction.reply({ embeds: [rulesEmbed], ephemeral: true });
            } 
            // Custom service button handler
            else if (interaction.customId === 'custom_service') {
                const serviceEmbed = new EmbedBuilder()
                    .setColor('#FFFFFF')
                    .setTitle('Custom Services')
                    .setDescription('Need a custom Discord bot, website, or other digital solution? Don\'t hesitate to reach out!')
                    .addFields(
                        { name: '✦ What We Offer', value: 'Discord bots, websites, automation tools, and more tailored to your specific needs.' },
                        { name: '✦ How to Get Started', value: 'Create a ticket with us to discuss your requirements and get a personalized quote.' },
                        { name: '✦ Why Choose Us', value: 'Professional service, competitive pricing, and ongoing support for all our solutions.' },
                        { name: '✦ Visit Our Website', value: 'Check out our portfolio and services at [Mar Services](https://marservices.cc)' }
                    )
                    .setFooter({ text: 'Mar System Services', iconURL: client.user.displayAvatarURL() });
                
                // Create service buttons
                const serviceButtons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('Visit Website')
                            .setURL('https://marservices.cc')
                            .setStyle(ButtonStyle.Link)
                    );
                
                await interaction.reply({ embeds: [serviceEmbed], components: [serviceButtons], ephemeral: true });
            }
            
            // Add handler for edit_message_content button
            else if (interaction.customId === 'edit_message_content') {
                try {
                    // Check if the user has an active message session
                    if (!client.messageSessions || !client.messageSessions[interaction.user.id]) {
                        await interaction.reply({
                            content: 'Your message session has expired. Please create a new message.',
                            ephemeral: true
                        });
                        return;
                    }
                    
                    // Create a modal for editing the message
                    const editModal = new ModalBuilder()
                        .setCustomId('edit_message_modal')
                        .setTitle('Edit Message');
                    
                    // Add input for message content
                    const contentInput = new TextInputBuilder()
                        .setCustomId('message_content')
                        .setLabel('Message Content')
                        .setPlaceholder('Enter your message here')
                        .setStyle(TextInputStyle.Paragraph)
                        .setValue(client.messageSessions[interaction.user.id].content)
                        .setRequired(true);
                    
                    // Add input to modal
                    const row = new ActionRowBuilder().addComponents(contentInput);
                    editModal.addComponents(row);
                    
                    // Show the modal
                    await interaction.showModal(editModal);
                } catch (error) {
                    console.error('Error processing edit message button:', error);
                    await interaction.reply({
                        content: 'There was an error editing your message. Please try again.',
                        ephemeral: true
                    });
                }
            }
            
            // Add handler for add_message_button button
            else if (interaction.customId === 'add_message_button') {
                try {
                    // Check if the user has an active message session
                    if (!client.messageSessions || !client.messageSessions[interaction.user.id]) {
                        await interaction.reply({
                            content: 'Your message session has expired. Please create a new message.',
                            ephemeral: true
                        });
                        return;
                    }
                    
                    // Create a modal for button input
                    const buttonModal = new ModalBuilder()
                        .setCustomId('message_button_creator_modal')
                        .setTitle('Add Button');
                    
                    // Add inputs for button properties
                    const buttonLabelInput = new TextInputBuilder()
                        .setCustomId('button_label')
                        .setLabel('Button Label')
                        .setPlaceholder('Enter button text')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true);
                        
                    const buttonStyleInput = new TextInputBuilder()
                        .setCustomId('button_style')
                        .setLabel('Button Style')
                        .setPlaceholder('secondary, primary, success, danger, or link')
                        .setStyle(TextInputStyle.Short)
                        .setValue('secondary')
                        .setRequired(true);
                        
                    const buttonEmojiInput = new TextInputBuilder()
                        .setCustomId('button_emoji')
                        .setLabel('Button Emoji (optional)')
                        .setPlaceholder('Enter emoji (Unicode or Discord emoji ID)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false);
                        
                    const buttonURLInput = new TextInputBuilder()
                        .setCustomId('button_url')
                        .setLabel('Button URL (only for link style)')
                        .setPlaceholder('https://example.com')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false);
                    
                    const buttonResponseInput = new TextInputBuilder()
                        .setCustomId('button_response')
                        .setLabel('Response when clicked (optional)')
                        .setPlaceholder('Enter text to show when button is clicked')
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(false);
                    
                    // Add inputs to modal
                    const row1 = new ActionRowBuilder().addComponents(buttonLabelInput);
                    const row2 = new ActionRowBuilder().addComponents(buttonStyleInput);
                    const row3 = new ActionRowBuilder().addComponents(buttonEmojiInput);
                    const row4 = new ActionRowBuilder().addComponents(buttonURLInput);
                    const row5 = new ActionRowBuilder().addComponents(buttonResponseInput);
                    
                    buttonModal.addComponents(row1, row2, row3, row4, row5);
                    
                    // Show the modal
                    await interaction.showModal(buttonModal);
                } catch (error) {
                    console.error('Error processing add button modal:', error);
                    await interaction.reply({
                        content: 'There was an error adding a button. Please try again.',
                        ephemeral: true
                    });
                }
            }
            
            // Poll vote button handler
            else if (interaction.customId.startsWith('poll_vote_')) {
                try {
                    // Extract poll ID and option index from the button ID
                    const parts = interaction.customId.split('_');
                    const pollId = parts[2];
                    const optionIndex = parseInt(parts[3]);
                    
                    // Check if the poll exists
                    if (!pollData.has(pollId)) {
                        await interaction.reply({
                            content: 'This poll no longer exists or has expired.',
                            ephemeral: true
                        });
                        return;
                    }
                    
                    const poll = pollData.get(pollId);
                    const userId = interaction.user.id;
                    
                    // Check if the user has already voted for this option
                    if (poll.options[optionIndex].voters.includes(userId)) {
                        await interaction.reply({
                            content: 'You have already voted for this option.',
                            ephemeral: true
                        });
                        return;
                    }
                    
                    // Remove user's vote from any other option they may have voted for
                    poll.options.forEach(option => {
                        const voterIndex = option.voters.indexOf(userId);
                        if (voterIndex !== -1) {
                            option.voters.splice(voterIndex, 1);
                            option.votes--;
                            poll.totalVotes--;
                        }
                    });
                    
                    // Add the vote to the selected option
                    poll.options[optionIndex].voters.push(userId);
                    poll.options[optionIndex].votes++;
                    poll.totalVotes++;
                    
                    await interaction.reply({
                        content: `You voted for: ${poll.options[optionIndex].text}`,
                        ephemeral: true
                    });
                    
                } catch (error) {
                    console.error('Error processing poll vote:', error);
                    await interaction.reply({
                        content: 'There was an error processing your vote. Please try again.',
                        ephemeral: true
                    });
                }
            }
            // Poll results button handler
            else if (interaction.customId.startsWith('poll_results_')) {
                try {
                    // Extract poll ID from the button ID
                    const pollId = interaction.customId.split('_')[2];
                    
                    // Check if the poll exists
                    if (!pollData.has(pollId)) {
                        await interaction.reply({
                            content: 'This poll no longer exists or has expired.',
                            ephemeral: true
                        });
                        return;
                    }
                    
                    const poll = pollData.get(pollId);
                    
                    // Create an embed to show the results
                    const resultsEmbed = new EmbedBuilder()
                        .setTitle(`Poll Results: ${poll.question}`)
                        .setColor('#FFFFFF')
                        .setDescription(`Total votes: ${poll.totalVotes}`)
                        .setTimestamp();
                    
                    // Add fields for each option with percentage and progress bar
                    poll.options.forEach((option, index) => {
                        const percentage = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
                        const progressBar = createProgressBar(percentage);
                        
                        resultsEmbed.addFields({
                            name: `${index + 1}. ${option.text}`,
                            value: `${option.votes} votes (${percentage}%)\n${progressBar}`
                        });
                    });
                    
                    await interaction.reply({
                        embeds: [resultsEmbed],
                        ephemeral: true
                    });
                    
                } catch (error) {
                    console.error('Error showing poll results:', error);
                    await interaction.reply({
                        content: 'There was an error showing the poll results. Please try again.',
                        ephemeral: true
                    });
                }
            }
            // Poll end button handler
            else if (interaction.customId.startsWith('poll_end_')) {
                try {
                    // Extract poll ID from the button ID
                    const pollId = interaction.customId.split('_')[2];
                    
                    // Check if the poll exists
                    if (!pollData.has(pollId)) {
                        await interaction.reply({
                            content: 'This poll no longer exists or has expired.',
                            ephemeral: true
                        });
                        return;
                    }
                    
                    const poll = pollData.get(pollId);
                    
                    // Check if the user is the poll creator
                    if (interaction.user.id !== poll.creator) {
                        await interaction.reply({
                            content: 'Only the poll creator can end this poll.',
                            ephemeral: true
                        });
                        return;
                    }
                    
                    // Create an embed to show the final results
                    const finalResultsEmbed = new EmbedBuilder()
                        .setTitle(`Poll Ended: ${poll.question}`)
                        .setColor('#FFFFFF')
                        .setDescription(`Final results (Total votes: ${poll.totalVotes})`)
                        .setTimestamp();
                    
                    // Add fields for each option with percentage and progress bar
                    poll.options.forEach((option, index) => {
                        const percentage = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
                        const progressBar = createProgressBar(percentage);
                        
                        finalResultsEmbed.addFields({
                            name: `${index + 1}. ${option.text}`,
                            value: `${option.votes} votes (${percentage}%)\n${progressBar}`
                        });
                    });
                    
                    // Add footer with poll creator
                    finalResultsEmbed.setFooter({
                        text: `Poll ended by ${interaction.user.username}`,
                        iconURL: interaction.user.displayAvatarURL()
                    });
                    
                    // Update the original message with the final results and remove buttons
                    await interaction.update({
                        embeds: [finalResultsEmbed],
                        components: []
                    });
                    
                    // Clean up poll data
                    pollData.delete(pollId);
                    
                } catch (error) {
                    console.error('Error ending poll:', error);
                    await interaction.reply({
                        content: 'There was an error ending the poll. Please try again.',
                        ephemeral: true
                    });
                }
            }
            else if (interaction.customId.startsWith('custom_button_')) {
                // Check if there's a custom response for this button
                if (client.buttonResponses && client.buttonResponses.has(interaction.customId)) {
                    const customResponse = client.buttonResponses.get(interaction.customId);
                    await interaction.reply({ content: customResponse, ephemeral: true });
                } else {
                    // Default response if no custom response is set
                    await interaction.reply({ content: `You clicked ${interaction.component.label}!`, ephemeral: true });
                }
            }
            // Buttons for message creation
            else if (interaction.customId === 'edit_message') {
                // Check if the user has an active message session
                if (!client.messageSessions || !client.messageSessions[interaction.user.id]) {
                    await interaction.reply({
                        content: 'Your message session has expired. Please create a new message.',
                        ephemeral: true
                    });
                    return;
                }
                
                // Create a modal for editing the message
                const editModal = new ModalBuilder()
                    .setCustomId('edit_message_modal')
                    .setTitle('Edit Message');
                
                // Add input for message content
                const contentInput = new TextInputBuilder()
                    .setCustomId('message_content')
                    .setLabel('Message Content')
                    .setPlaceholder('Enter your message here')
                    .setStyle(TextInputStyle.Paragraph)
                    .setValue(client.messageSessions[interaction.user.id].content)
                    .setRequired(true);
                
                // Add input to modal
                const row = new ActionRowBuilder().addComponents(contentInput);
                editModal.addComponents(row);
                
                // Show the modal
                await interaction.showModal(editModal);
            }
            else if (interaction.customId === 'show_button_styles') {
                // Create an embed showing different button styles
                const stylesEmbed = new EmbedBuilder()
                    .setColor('#FFFFFF')
                    .setTitle('Button Style Guide')
                    .setDescription('Here are the available button styles:')
                    .addFields(
                        { name: 'Secondary (Default)', value: 'Gray color - `secondary`', inline: true },
                        { name: 'Primary', value: 'Blue color - `primary`', inline: true },
                        { name: 'Success', value: 'Green color - `success`', inline: true },
                        { name: 'Danger', value: 'Red color - `danger`', inline: true },
                        { name: 'Link', value: 'Gray color, opens URL - `link`\nRequires URL parameter', inline: true }
                    )
                    .setFooter({ text: 'Use these values in the "Button Style" field', iconURL: client.user.displayAvatarURL() });
                
                // Create example buttons
                const exampleRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('example_secondary')
                            .setLabel('Secondary')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('example_primary')
                            .setLabel('Primary')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('example_success')
                            .setLabel('Success')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('example_danger')
                            .setLabel('Danger')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setLabel('Link')
                            .setStyle(ButtonStyle.Link)
                            .setURL('https://discord.com')
                    );
                
                await interaction.reply({
                    embeds: [stylesEmbed],
                    components: [exampleRow],
                    ephemeral: true
                });
            }
            // Add Button to message handler
            else if (interaction.customId === 'add_button') {
                // Check if the user has an active message session or embed session
                const hasMessageSession = client.messageSessions && client.messageSessions[interaction.user.id];
                const hasEmbedSession = client.embedSessions && client.embedSessions[interaction.user.id];
                
                if (!hasMessageSession && !hasEmbedSession) {
                    await interaction.reply({
                        content: 'Your session has expired. Please create a new message or embed.',
                        ephemeral: true
                    });
                    return;
                }
                
                // Create a modal for button input
                const buttonModal = new ModalBuilder()
                    .setCustomId(hasEmbedSession ? 'button_creator_modal' : 'message_button_creator_modal')
                    .setTitle('Add Button');
                
                // Add inputs for button properties
                const buttonLabelInput = new TextInputBuilder()
                    .setCustomId('button_label')
                    .setLabel('Button Label')
                    .setPlaceholder('Enter button text')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);
                    
                const buttonStyleInput = new TextInputBuilder()
                    .setCustomId('button_style')
                    .setLabel('Button Style')
                    .setPlaceholder('secondary, primary, success, danger, or link')
                    .setStyle(TextInputStyle.Short)
                    .setValue('secondary')
                    .setRequired(true);
                    
                const buttonEmojiInput = new TextInputBuilder()
                    .setCustomId('button_emoji')
                    .setLabel('Button Emoji (optional)')
                    .setPlaceholder('Enter emoji (Unicode or Discord emoji ID)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false);
                    
                const buttonURLInput = new TextInputBuilder()
                    .setCustomId('button_url')
                    .setLabel('Button URL (only for link style)')
                    .setPlaceholder('https://example.com')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false);
                
                const buttonResponseInput = new TextInputBuilder()
                    .setCustomId('button_response')
                    .setLabel('Response when clicked (optional)')
                    .setPlaceholder('Enter text to show when button is clicked')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(false);
                
                // Add inputs to modal
                const row1 = new ActionRowBuilder().addComponents(buttonLabelInput);
                const row2 = new ActionRowBuilder().addComponents(buttonStyleInput);
                const row3 = new ActionRowBuilder().addComponents(buttonEmojiInput);
                const row4 = new ActionRowBuilder().addComponents(buttonURLInput);
                const row5 = new ActionRowBuilder().addComponents(buttonResponseInput);
                
                buttonModal.addComponents(row1, row2, row3, row4, row5);
                
                // Show the modal
                await interaction.showModal(buttonModal);
            }
            // Add Field button handler
            else if (interaction.customId === 'add_field') {
                // Check if the user has an active embed session
                if (!client.embedSessions || !client.embedSessions[interaction.user.id]) {
                    await interaction.reply({
                        content: 'Your embed session has expired. Please create a new embed.',
                        ephemeral: true
                    });
                    return;
                }
                
                // Create a modal for field input
                const fieldModal = new ModalBuilder()
                    .setCustomId('field_creator_modal')
                    .setTitle('Add Field to Embed');
                
                // Add inputs for field properties
                const fieldNameInput = new TextInputBuilder()
                    .setCustomId('field_name')
                    .setLabel('Field Name')
                    .setPlaceholder('Enter field name/title')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);
                    
                const fieldValueInput = new TextInputBuilder()
                    .setCustomId('field_value')
                    .setLabel('Field Value')
                    .setPlaceholder('Enter field content/value')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);
                    
                const inlineInput = new TextInputBuilder()
                    .setCustomId('field_inline')
                    .setLabel('Inline? (yes/no)')
                    .setPlaceholder('Type "yes" for inline, "no" for not inline')
                    .setStyle(TextInputStyle.Short)
                    .setValue('yes')
                    .setRequired(true);
                
                // Add inputs to modal
                const row1 = new ActionRowBuilder().addComponents(fieldNameInput);
                const row2 = new ActionRowBuilder().addComponents(fieldValueInput);
                const row3 = new ActionRowBuilder().addComponents(inlineInput);
                
                fieldModal.addComponents(row1, row2, row3);
                
                // Show the modal
                await interaction.showModal(fieldModal);
            }
            // Add Image button handler
            else if (interaction.customId === 'add_image') {
                // Check if the user has an active embed session
                if (!client.embedSessions || !client.embedSessions[interaction.user.id]) {
                    await interaction.reply({
                        content: 'Your embed session has expired. Please create a new embed.',
                        ephemeral: true
                    });
                    return;
                }
                
                // Create a modal for image input
                const imageModal = new ModalBuilder()
                    .setCustomId('image_creator_modal')
                    .setTitle('Add Image to Embed');
                
                // Add input for image URL
                const imageURLInput = new TextInputBuilder()
                    .setCustomId('image_url')
                    .setLabel('Image URL')
                    .setPlaceholder('https://example.com/image.png')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);
                
                // Add input to modal
                const row = new ActionRowBuilder().addComponents(imageURLInput);
                imageModal.addComponents(row);
                
                // Show the modal
                await interaction.showModal(imageModal);
            }
            // Add Thumbnail button handler
            else if (interaction.customId === 'add_thumbnail') {
                // Check if the user has an active embed session
                if (!client.embedSessions || !client.embedSessions[interaction.user.id]) {
                    await interaction.reply({
                        content: 'Your embed session has expired. Please create a new embed.',
                        ephemeral: true
                    });
                    return;
                }
                
                // Create a modal for thumbnail input
                const thumbnailModal = new ModalBuilder()
                    .setCustomId('thumbnail_creator_modal')
                    .setTitle('Add Thumbnail to Embed');
                
                // Add input for thumbnail URL
                const thumbnailURLInput = new TextInputBuilder()
                    .setCustomId('thumbnail_url')
                    .setLabel('Thumbnail URL')
                    .setPlaceholder('https://example.com/thumbnail.png')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);
                
                // Add input to modal
                const row = new ActionRowBuilder().addComponents(thumbnailURLInput);
                thumbnailModal.addComponents(row);
                
                // Show the modal
                await interaction.showModal(thumbnailModal);
            }
            // Preview Embed button handler
            else if (interaction.customId === 'preview_embed') {
                // Check if the user has an active embed session
                if (!client.embedSessions || !client.embedSessions[interaction.user.id]) {
                    await interaction.reply({
                        content: 'Your embed session has expired. Please create a new embed.',
                        ephemeral: true
                    });
                    return;
                }
                
                const embedSession = client.embedSessions[interaction.user.id];
                
                // Send a preview of the embed
                await interaction.reply({
                    content: 'Here\'s a preview of your embed:',
                    embeds: [embedSession.embed],
                    components: embedSession.components || [],
                    ephemeral: true
                });
            }
            // Send Embed button handler
            else if (interaction.customId === 'send_embed') {
                // Check if the user has an active embed session
                if (!client.embedSessions || !client.embedSessions[interaction.user.id]) {
                    await interaction.reply({
                        content: 'Your embed session has expired. Please create a new embed.',
                        ephemeral: true
                    });
                    return;
                }
                
                const embedSession = client.embedSessions[interaction.user.id];
                
                try {
                    // Send the embed to the channel
                    await interaction.channel.send({
                        embeds: [embedSession.embed],
                        components: embedSession.components || []
                    });
                    
                    // Notify the user
                    await interaction.reply({
                        content: 'Your embed has been sent to the channel!',
                        ephemeral: true
                    });
                    
                    // Clean up the session
                    delete client.embedSessions[interaction.user.id];
                } catch (error) {
                    console.error('Error sending embed:', error);
                    await interaction.reply({
                        content: 'There was an error sending your embed. Please check my permissions and try again.',
                        ephemeral: true
                    });
                }
            }
            // Handle clear channel confirmation
            else if (interaction.customId === 'confirm_clear') {
                try {
                    // Check if the user who clicked is the same one who initiated
                    const clearData = client.clearChannelData;
                    
                    if (!clearData || interaction.user.id !== clearData.userId) {
                        await interaction.reply({
                            content: 'You did not initiate this clear command or the request has expired.',
                            ephemeral: true
                        });
                        return;
                    }
                    
                    // Get the guild and channel
                    const guild = client.guilds.cache.get(clearData.guildId);
                    const channelToDelete = guild.channels.cache.get(clearData.channelId);
                    
                    if (!channelToDelete) {
                        await interaction.reply({
                            content: 'The channel no longer exists.',
                            ephemeral: true
                        });
                        return;
                    }
                    
                    // Update the message to show processing
                    await interaction.update({
                        content: 'Processing channel clear...',
                        embeds: [],
                        components: []
                    });
                    
                    // Create the new channel with the same settings
                    const newChannel = await guild.channels.create({
                        name: clearData.channelName,
                        type: ChannelType.GuildText,
                        topic: clearData.channelTopic,
                        nsfw: clearData.channelNsfw,
                        rateLimitPerUser: clearData.channelRateLimitPerUser,
                        parent: clearData.channelParent,
                        reason: clearData.reason,
                        permissionOverwrites: clearData.permissionOverwrites
                    });
                    
                    // Set the position of the new channel
                    await newChannel.setPosition(clearData.channelPosition);
                    
                    // Send a notification in the new channel
                    const notificationEmbed = new EmbedBuilder()
                        .setTitle('Channel Cleared')
                        .setDescription(`This channel was cleared by ${interaction.user.tag}`)
                        .setColor('#FFFFFF')
                        .setTimestamp();
                    
                    if (clearData.reason) {
                        notificationEmbed.addFields({ name: 'Reason', value: clearData.reason });
                    }
                    
                    await newChannel.send({ embeds: [notificationEmbed] });
                    
                    // Delete the original channel
                    await channelToDelete.delete(clearData.reason);
                    
                    // Clean up stored data
                    delete client.clearChannelData;
                    
                } catch (error) {
                    console.error('Error clearing channel:', error);
                    
                    try {
                        await interaction.followUp({
                            content: 'There was an error clearing the channel. Please check my permissions and try again.',
                            ephemeral: true
                        });
                    } catch (e) {
                        // If the original message was deleted with the channel, this might fail
                        console.error('Could not send error message:', e);
                    }
                }
            }
            else if (interaction.customId === 'cancel_clear') {
                // Check if the user who clicked is the same one who initiated
                const clearData = client.clearChannelData;
                
                if (!clearData || interaction.user.id !== clearData.userId) {
                    await interaction.reply({
                        content: 'You did not initiate this clear command.',
                        ephemeral: true
                    });
                    return;
                }
                
                // Clean up stored data
                delete client.clearChannelData;
                
                // Update the message
                await interaction.update({
                    content: 'Channel clear cancelled.',
                    embeds: [],
                    components: []
                });
            }
            // Preview Message button handler
            else if (interaction.customId === 'preview_message') {
                // Check if the user has an active message session
                if (!client.messageSessions || !client.messageSessions[interaction.user.id]) {
                    await interaction.reply({
                        content: 'Your message session has expired. Please create a new message.',
                        ephemeral: true
                    });
                    return;
                }
                
                const messageSession = client.messageSessions[interaction.user.id];
                
                // Send a preview of the message
                await interaction.reply({
                    content: 'Here\'s a preview of your message:',
                    ephemeral: true
                });
                
                // Send the actual preview as a follow-up
                await interaction.followUp({
                    content: messageSession.content,
                    components: messageSession.components || [],
                    ephemeral: true
                });
            }
            // Send Message button handler
            else if (interaction.customId === 'send_message') {
                // Check if the user has an active message session
                if (!client.messageSessions || !client.messageSessions[interaction.user.id]) {
                    await interaction.reply({
                        content: 'Your message session has expired. Please create a new message.',
                        ephemeral: true
                    });
                    return;
                }
                
                const messageSession = client.messageSessions[interaction.user.id];
                
                // If in review mode, show confirmation buttons first
                if (messageSession.inReviewMode && !messageSession.confirmSend) {
                    // Create confirmation buttons
                    const confirmRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('confirm_send_message')
                                .setLabel('Yes, Send Message')
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setCustomId('cancel_send_message')
                                .setLabel('Cancel')
                                .setStyle(ButtonStyle.Secondary)
                        );
                    
                    // Set flag to indicate confirmation was shown
                    messageSession.confirmSend = true;
                    
                    // Show confirmation message with preview
                    await interaction.reply({
                        content: '**Are you sure you want to send this message?**\n\n' + 
                                 '**Message Preview:**\n' + messageSession.content,
                        components: [confirmRow, ...(messageSession.components || [])],
                        ephemeral: true
                    });
                    return;
                }
                
                try {
                    // Send the message to the channel
                    await interaction.channel.send({
                        content: messageSession.content,
                        components: messageSession.components || []
                    });
                    
                    // Notify the user
                    await interaction.reply({
                        content: 'Your message has been sent to the channel!',
                        ephemeral: true
                    });
                    
                    // Clean up the session
                    delete client.messageSessions[interaction.user.id];
                } catch (error) {
                    console.error('Error sending message:', error);
                    await interaction.reply({
                        content: 'There was an error sending your message. Please check my permissions and try again.',
                        ephemeral: true
                    });
                }
            }
            // Confirm Send Message button handler
            else if (interaction.customId === 'confirm_send_message') {
                // Check if the user has an active message session
                if (!client.messageSessions || !client.messageSessions[interaction.user.id]) {
                    await interaction.reply({
                        content: 'Your message session has expired. Please create a new message.',
                        ephemeral: true
                    });
                    return;
                }
                
                const messageSession = client.messageSessions[interaction.user.id];
                
                try {
                    // Send the message to the channel
                    await interaction.channel.send({
                        content: messageSession.content,
                        components: messageSession.components || []
                    });
                    
                    // Notify the user
                    await interaction.reply({
                        content: 'Your message has been sent to the channel!',
                        ephemeral: true
                    });
                    
                    // Clean up the session
                    delete client.messageSessions[interaction.user.id];
                } catch (error) {
                    console.error('Error sending message:', error);
                    await interaction.reply({
                        content: 'There was an error sending your message. Please check my permissions and try again.',
                        ephemeral: true
                    });
                }
            }
            // Cancel Send Message button handler
            else if (interaction.customId === 'cancel_send_message') {
                // Check if the user has an active message session
                if (!client.messageSessions || !client.messageSessions[interaction.user.id]) {
                    await interaction.reply({
                        content: 'Your message session has expired. Please create a new message.',
                        ephemeral: true
                    });
                    return;
                }
                
                const messageSession = client.messageSessions[interaction.user.id];
                
                // Reset confirmation flag
                messageSession.confirmSend = false;
                
                // Create control buttons for the message
                const controlRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('edit_message')
                            .setLabel('Edit Message')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('add_button')
                            .setLabel('+ Add Button')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('show_button_styles')
                            .setLabel('Button Style Guide')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('preview_message')
                            .setLabel('Preview')
                            .setStyle(ButtonStyle.Secondary)
                    );
                
                // Create a second row for the Send Message button
                const sendRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('send_message')
                            .setLabel('Send Message')
                            .setStyle(ButtonStyle.Success)
                    );
                
                // Return to editing mode
                await interaction.reply({
                    content: `**Message Preview:**\n\n${messageSession.content}\n\nSending canceled. Continue editing your message:`,
                    components: [controlRow, sendRow, ...(messageSession.components || [])],
                    ephemeral: true
                });
            }
            // Giveaway entry button handler
            else if (interaction.customId === 'giveaway_enter') {
                // Get the message ID
                const messageId = interaction.message.id;
                
                // Check if the giveaway exists
                if (!client.giveaways.has(messageId)) {
                    await interaction.reply({
                        content: 'This giveaway no longer exists or has ended.',
                        ephemeral: true
                    });
                    return;
                }
                
                // Get the giveaway data
                const giveaway = client.giveaways.get(messageId);
                
                // Check if the giveaway has ended
                if (giveaway.endsAt <= Date.now()) {
                    await interaction.reply({
                        content: 'This giveaway has already ended.',
                        ephemeral: true
                    });
                    return;
                }
                
                // Check if the user has already entered
                const userId = interaction.user.id;
                const hasEntered = giveaway.participants.has(userId);
                
                if (hasEntered) {
                    // Remove the user from participants
                    giveaway.participants.delete(userId);
                    
                    // Update the giveaway in the map
                    client.giveaways.set(messageId, giveaway);
                    
                    // Save giveaways to file
                    saveGiveaways();
                    
                    // Update the giveaway message
                    const timeRemaining = formatTimeRemaining(giveaway.endsAt);
                    const updatedEmbed = createGiveawayEmbed(giveaway, timeRemaining);
                    
                    await interaction.message.edit({
                        embeds: [updatedEmbed],
                        components: [interaction.message.components[0]]
                    });
                    
                    await interaction.reply({
                        content: `You have withdrawn from the giveaway for **${giveaway.prize}**.`,
                        ephemeral: true
                    });
                } else {
                    // Add the user to participants
                    giveaway.participants.add(userId);
                    
                    // Update the giveaway in the map
                    client.giveaways.set(messageId, giveaway);
                    
                    // Save giveaways to file
                    saveGiveaways();
                    
                    // Update the giveaway message
                    const timeRemaining = formatTimeRemaining(giveaway.endsAt);
                    const updatedEmbed = createGiveawayEmbed(giveaway, timeRemaining);
                    
                    await interaction.message.edit({
                        embeds: [updatedEmbed],
                        components: [interaction.message.components[0]]
                    });
                    
                    await interaction.reply({
                        content: `You have entered the giveaway for **${giveaway.prize}**! Good luck!`,
                        ephemeral: true
                    });
                }
            }
            
            // Giveaway reroll button handler
            else if (interaction.customId.startsWith('giveaway_reroll_')) {
                // Extract message ID from the button ID
                const messageId = interaction.customId.replace('giveaway_reroll_', '');
                
                // Check if the giveaway exists
                if (!client.giveaways.has(messageId)) {
                    await interaction.reply({
                        content: 'This giveaway no longer exists.',
                        ephemeral: true
                    });
                    return;
                }
                
                // Get the giveaway data
                const giveaway = client.giveaways.get(messageId);
                
                // Check if the user is the host or has manage server permission
                const isHost = giveaway.hostId === interaction.user.id;
                const hasPermission = interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);
                
                if (!isHost && !hasPermission) {
                    await interaction.reply({
                        content: 'You do not have permission to reroll this giveaway.',
                        ephemeral: true
                    });
                    return;
                }
                
                // Check if there are enough participants
                if (!giveaway.participants || giveaway.participants.size === 0) {
                    await interaction.reply({
                        content: 'There are no participants to reroll.',
                        ephemeral: true
                    });
                    return;
                }
                
                // Defer reply
                await interaction.deferReply({ ephemeral: true });
                
                try {
                    // Select new winners
                    const newWinners = selectWinners(giveaway);
                    
                    // Update the giveaway winners
                    giveaway.winners = newWinners;
                    client.giveaways.set(messageId, giveaway);
                    
                    // Save giveaways to file
                    saveGiveaways();
                    
                    // Update the giveaway message
                    const endedEmbed = createGiveawayEmbed(giveaway, "Ended", true);
                    
                    await interaction.message.edit({
                        embeds: [endedEmbed],
                        components: [interaction.message.components[0]]
                    });
                    
                    // Send winner announcement
                    if (newWinners.length > 0) {
                        const winnerMentions = newWinners.map(id => `<@${id}>`).join(', ');
                        const congratsMessage = `🎉 Rerolled! Congratulations ${winnerMentions}! You won **${giveaway.prize}**!`;
                        await interaction.channel.send({ content: congratsMessage });
                    } else {
                        await interaction.channel.send({ content: `Reroll failed. No valid winners for the giveaway **${giveaway.prize}**.` });
                    }
                    
                    await interaction.followUp({
                        content: `Rerolled winners for the giveaway **${giveaway.prize}**.`,
                        ephemeral: true
                    });
                } catch (error) {
                    console.error('\x1b[31m✦ Error rerolling giveaway:\x1b[0m', error);
                    await interaction.followUp({
                        content: 'There was an error rerolling the giveaway. Please try again.',
                        ephemeral: true
                    });
                }
            }
            
            // Handle other button interactions...
            else {
                await interaction.reply({ content: `Button clicked: ${interaction.customId}`, ephemeral: true });
            }
        }
        
        // Handle modal submissions
        else if (interaction.isModalSubmit()) {
            console.log(`Modal submitted: ${interaction.customId}`);
            
            // Edit message modal
            if (interaction.customId === 'edit_message_modal') {
                try {
                    // Check if the user has an active message session
                    if (!client.messageSessions || !client.messageSessions[interaction.user.id]) {
                        await interaction.reply({
                            content: 'Your message session has expired. Please create a new message.',
                            ephemeral: true
                        });
                        return;
                    }
                    
                    // Get the new message content
                    const content = interaction.fields.getTextInputValue('message_content');
                    
                    // Get the user's message session
                    const messageSession = client.messageSessions[interaction.user.id];
                    
                    // Update the message session
                    messageSession.content = content;
                    
                    // Reset confirmation flag if it was set
                    if (messageSession.confirmSend) {
                        messageSession.confirmSend = false;
                    }
                    
                    // Create control buttons for the message
                    const controlRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('edit_message_content')
                                .setLabel('Edit Content')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('add_message_button')
                                .setLabel('+ Add Button')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('preview_message')
                                .setLabel('Preview')
                                .setStyle(ButtonStyle.Secondary)
                        );
                        
                    // Create a second row for the Send Message button
                    const sendRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('send_message')
                                .setLabel('Send Message')
                                .setStyle(ButtonStyle.Success)
                        );
                    
                    // Reply with the updated message
                    await interaction.reply({
                        content: `**Message Preview:**\n\n${content}\n\nUse the buttons below to continue editing:`,
                        components: [controlRow, sendRow, ...(messageSession.components || [])],
                        ephemeral: true
                    });
                    
                } catch (error) {
                    console.error('Error processing edit message modal:', error);
                    await interaction.reply({
                        content: 'There was an error updating your message. Please try again.',
                        ephemeral: true
                    });
                }
            }
            
            // Field creator modal
            else if (interaction.customId === 'field_creator_modal') {
                try {
                    // Check if the user has an active embed session
                    if (!client.embedSessions || !client.embedSessions[interaction.user.id]) {
                        await interaction.reply({
                            content: 'Your embed session has expired. Please create a new embed.',
                            ephemeral: true
                        });
                        return;
                    }
                    
                    // Get field values from modal
                    const fieldName = interaction.fields.getTextInputValue('field_name');
                    const fieldValue = interaction.fields.getTextInputValue('field_value');
                    const fieldInline = interaction.fields.getTextInputValue('field_inline').toLowerCase() === 'yes';
                    
                    // Get the user's embed session
                    const embedSession = client.embedSessions[interaction.user.id];
                    
                    // Add the field to the embed
                    embedSession.embed.addFields({
                        name: fieldName,
                        value: fieldValue,
                        inline: fieldInline
                    });
                    
                    // Create control buttons for the embed
                    const controlRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('add_field')
                                .setLabel('+ Add Field')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('add_button')
                                .setLabel('+ Add Button')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('add_image')
                                .setLabel('Main Image')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('add_thumbnail')
                                .setLabel('Thumbnail')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('preview_embed')
                                .setLabel('Preview')
                                .setStyle(ButtonStyle.Secondary)
                        );
                    
                    // Create a second row for the Send Embed button
                    const sendRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('send_embed')
                                .setLabel('Send Embed')
                                .setStyle(ButtonStyle.Success)
                        );
                    
                    // Reply with the updated embed
                    await interaction.reply({
                        content: 'Field added to your embed:',
                        embeds: [embedSession.embed],
                        components: [controlRow, sendRow],
                        ephemeral: true
                    });
                    
                } catch (error) {
                    console.error('Error processing field creator modal:', error);
                    await interaction.reply({
                        content: 'There was an error adding the field to your embed. Please try again.',
                        ephemeral: true
                    });
                }
            }
            
            // Button creator modal
            else if (interaction.customId === 'button_creator_modal') {
                try {
                    // Check if the user has an active embed session
                    if (!client.embedSessions || !client.embedSessions[interaction.user.id]) {
                        await interaction.reply({
                            content: 'Your embed session has expired. Please create a new embed.',
                            ephemeral: true
                        });
                        return;
                    }
                    
                    // Get button values from modal
                    const buttonLabel = interaction.fields.getTextInputValue('button_label');
                    const buttonStyle = interaction.fields.getTextInputValue('button_style');
                    const buttonEmoji = interaction.fields.getTextInputValue('button_emoji') || null;
                    const buttonURL = interaction.fields.getTextInputValue('button_url') || null;
                    const buttonResponse = interaction.fields.getTextInputValue('button_response') || null;
                    
                    // Get the user's embed session
                    const embedSession = client.embedSessions[interaction.user.id];
                    
                    // Initialize components array if it doesn't exist
                    embedSession.components = embedSession.components || [];
                    
                    // Create a unique ID for the button
                    const buttonId = `custom_button_${Date.now()}`;
                    
                    // Create the button
                    const button = createButton(buttonLabel, buttonStyle, buttonEmoji, buttonURL, buttonId);
                    
                    // Store the button response if provided
                    if (buttonResponse) {
                        // Initialize button responses map if it doesn't exist
                        client.buttonResponses = client.buttonResponses || new Map();
                        client.buttonResponses.set(buttonId, buttonResponse);
                    }
                    
                    // Add the button to a new or existing action row
                    let actionRow;
                    
                    // Check if there's an action row with space for another button (max 5 buttons per row)
                    if (embedSession.components.length === 0 || 
                        embedSession.components[embedSession.components.length - 1].components.length >= 5) {
                        // Create a new action row
                        actionRow = new ActionRowBuilder();
                        embedSession.components.push(actionRow);
                    } else {
                        // Use the last action row
                        actionRow = embedSession.components[embedSession.components.length - 1];
                    }
                    
                    // Add the button to the action row
                    actionRow.addComponents(button);
                    
                    // Create control buttons for the embed
                    const controlRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('add_field')
                                .setLabel('+ Add Field')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('add_button')
                                .setLabel('+ Add Button')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('add_image')
                                .setLabel('Main Image')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('add_thumbnail')
                                .setLabel('Thumbnail')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('preview_embed')
                                .setLabel('Preview')
                                .setStyle(ButtonStyle.Secondary)
                        );
                    
                    // Create a second row for the Send Embed button
                    const sendRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('send_embed')
                                .setLabel('Send Embed')
                                .setStyle(ButtonStyle.Success)
                        );
                    
                    // Reply with the updated embed
                    await interaction.reply({
                        content: 'Button added to your embed:',
                        embeds: [embedSession.embed],
                        components: [controlRow, sendRow, ...embedSession.components],
                        ephemeral: true
                    });
                    
                } catch (error) {
                    console.error('Error processing button creator modal:', error);
                    await interaction.reply({
                        content: 'There was an error adding the button to your embed. Please try again.',
                        ephemeral: true
                    });
                }
            }
            
            // Image creator modal
            else if (interaction.customId === 'image_creator_modal') {
                try {
                    // Check if the user has an active embed session
                    if (!client.embedSessions || !client.embedSessions[interaction.user.id]) {
                        await interaction.reply({
                            content: 'Your embed session has expired. Please create a new embed.',
                            ephemeral: true
                        });
                        return;
                    }
                    
                    // Get image URL from modal
                    const imageURL = interaction.fields.getTextInputValue('image_url');
                    
                    // Validate URL format
                    try {
                        new URL(imageURL);
                    } catch (e) {
                        await interaction.reply({
                            content: 'Invalid image URL. Please provide a valid URL.',
                            ephemeral: true
                        });
                        return;
                    }
                    
                    // Get the user's embed session
                    const embedSession = client.embedSessions[interaction.user.id];
                    
                    // Add the image to the embed
                    embedSession.embed.setImage(imageURL);
                    
                    // Create control buttons for the embed
                    const controlRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('add_field')
                                .setLabel('+ Add Field')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('add_button')
                                .setLabel('+ Add Button')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('add_image')
                                .setLabel('Main Image')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('add_thumbnail')
                                .setLabel('Thumbnail')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('preview_embed')
                                .setLabel('Preview')
                                .setStyle(ButtonStyle.Secondary)
                        );
                    
                    // Create a second row for the Send Embed button
                    const sendRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('send_embed')
                                .setLabel('Send Embed')
                                .setStyle(ButtonStyle.Success)
                        );
                    
                    // Reply with the updated embed
                    await interaction.reply({
                        content: 'Image added to your embed:',
                        embeds: [embedSession.embed],
                        components: [controlRow, sendRow, ...(embedSession.components || [])],
                        ephemeral: true
                    });
                    
                } catch (error) {
                    console.error('Error processing image creator modal:', error);
                    await interaction.reply({
                        content: 'There was an error adding the image to your embed. Please try again.',
                        ephemeral: true
                    });
                }
            }
            
            // Thumbnail creator modal
            else if (interaction.customId === 'thumbnail_creator_modal') {
                try {
                    // Check if the user has an active embed session
                    if (!client.embedSessions || !client.embedSessions[interaction.user.id]) {
                        await interaction.reply({
                            content: 'Your embed session has expired. Please create a new embed.',
                            ephemeral: true
                        });
                        return;
                    }
                    
                    // Get thumbnail URL from modal
                    const thumbnailURL = interaction.fields.getTextInputValue('thumbnail_url');
                    
                    // Validate URL format
                    try {
                        new URL(thumbnailURL);
                    } catch (e) {
                        await interaction.reply({
                            content: 'Invalid thumbnail URL. Please provide a valid URL.',
                            ephemeral: true
                        });
                        return;
                    }
                    
                    // Get the user's embed session
                    const embedSession = client.embedSessions[interaction.user.id];
                    
                    // Add the thumbnail to the embed
                    embedSession.embed.setThumbnail(thumbnailURL);
                    
                    // Create control buttons for the embed
                    const controlRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('add_field')
                                .setLabel('+ Add Field')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('add_button')
                                .setLabel('+ Add Button')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('add_image')
                                .setLabel('Main Image')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('add_thumbnail')
                                .setLabel('Thumbnail')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('preview_embed')
                                .setLabel('Preview')
                                .setStyle(ButtonStyle.Secondary)
                        );
                    
                    // Create a second row for the Send Embed button
                    const sendRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('send_embed')
                                .setLabel('Send Embed')
                                .setStyle(ButtonStyle.Success)
                        );
                    
                    // Reply with the updated embed
                    await interaction.reply({
                        content: 'Thumbnail added to your embed:',
                        embeds: [embedSession.embed],
                        components: [controlRow, sendRow, ...(embedSession.components || [])],
                        ephemeral: true
                    });
                    
                } catch (error) {
                    console.error('Error processing thumbnail creator modal:', error);
                    await interaction.reply({
                        content: 'There was an error adding the thumbnail to your embed. Please try again.',
                        ephemeral: true
                    });
                }
            }
            
            // Advanced embed modal
            else if (interaction.customId === 'advanced_embed_modal') {
                try {
                    const title = interaction.fields.getTextInputValue('embed_title');
                    const description = interaction.fields.getTextInputValue('embed_description');
                    const colorInput = interaction.fields.getTextInputValue('embed_color');
                    const authorName = interaction.fields.getTextInputValue('embed_author');
                    const thumbnailUrl = interaction.fields.getTextInputValue('embed_thumbnail');
                    
                    // Resolve color from name or hex code
                    const color = resolveColor(colorInput);
                    
                    // Create the embed
                    const advancedEmbed = new EmbedBuilder()
                        .setTitle(title)
                        .setDescription(description)
                        .setColor(color)
                        .setTimestamp();
                    
                    // Add author if provided
                    if (authorName && authorName.trim() !== '') {
                        advancedEmbed.setAuthor({
                            name: authorName,
                            iconURL: interaction.user.displayAvatarURL()
                        });
                    }
                    
                    // Add thumbnail if provided
                    if (thumbnailUrl && thumbnailUrl.trim() !== '') {
                        try {
                            // Validate URL format
                            new URL(thumbnailUrl);
                            advancedEmbed.setThumbnail(thumbnailUrl);
                        } catch (e) {
                            // If not a valid URL, notify the user but continue creating the embed
                            console.log('Invalid thumbnail URL provided:', thumbnailUrl);
                        }
                    }
                    
                    // Set default footer
                    advancedEmbed.setFooter({ 
                        text: 'Mar System', 
                        iconURL: client.user.displayAvatarURL() 
                    });
                    
                    // Store the embed in session for adding fields
                    client.embedSessions = client.embedSessions || {};
                    client.embedSessions[interaction.user.id] = {
                        embed: advancedEmbed,
                        fields: []
                    };
                    
                    // Create control buttons for the embed
                    const controlRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('add_field')
                                .setLabel('+ Add Field')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('add_button')
                                .setLabel('+ Add Button')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('add_image')
                                .setLabel('Main Image')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('add_thumbnail')
                                .setLabel('Thumbnail')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('preview_embed')
                                .setLabel('Preview')
                                .setStyle(ButtonStyle.Secondary)
                        );
                    
                    // Create a second row for the Send Embed button
                    const sendRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('send_embed')
                                .setLabel('Send Embed')
                                .setStyle(ButtonStyle.Success)
                        );
                    
                    // Show the initial embed with controls
                    await interaction.reply({
                        content: 'Your advanced embed is being created. Add fields or buttons to enhance it:',
                        embeds: [advancedEmbed],
                        components: [controlRow, sendRow],
                        ephemeral: true
                    });
                    
                } catch (error) {
                    console.error('Error creating advanced embed:', error);
                    await interaction.reply({
                        content: 'There was an error creating your advanced embed. Please try again.',
                        ephemeral: true
                    });
                }
            }
            
            // Buttons creator modal
            else if (interaction.customId === 'buttons_creator_modal') {
                try {
                    const message = interaction.fields.getTextInputValue('message_text');
                    
                    // Initialize a proper message session for the user
                    client.messageSessions = client.messageSessions || {};
                    client.messageSessions[interaction.user.id] = {
                        content: message,
                        components: [],
                        inReviewMode: true
                    };
                    
                    // Create control buttons for the message
                    const controlRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('edit_message')
                                .setLabel('Edit Message')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('add_button')
                                .setLabel('+ Add Button')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('show_button_styles')
                                .setLabel('Button Style Guide')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('preview_message')
                                .setLabel('Preview')
                                .setStyle(ButtonStyle.Secondary)
                        );
                    
                    // Create a second row for the Send Message button
                    const sendRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('send_message')
                                .setLabel('Send Message')
                                .setStyle(ButtonStyle.Success)
                        );
                    
                    // Reply with the message in review mode
                    await interaction.reply({ 
                        content: `**Message Preview:**\n\n${message}\n\nYour message is in review mode. Use the buttons below to customize it before sending:`,
                        components: [controlRow, sendRow],
                        ephemeral: true
                    });
                } catch (error) {
                    console.error('Error handling buttons creator modal:', error);
                    await interaction.reply({
                        content: 'There was an error creating your message with buttons. Please try again.',
                        ephemeral: true
                    });
                }
            }
            
            // Poll creator modal
            else if (interaction.customId === 'poll_creator_modal') {
                try {
                    const question = interaction.fields.getTextInputValue('poll_question');
                    const option1 = interaction.fields.getTextInputValue('poll_option1');
                    const option2 = interaction.fields.getTextInputValue('poll_option2');
                    const option3 = interaction.fields.getTextInputValue('poll_option3') || null;
                    const option4 = interaction.fields.getTextInputValue('poll_option4') || null;
                    
                    // Create poll embed
                    const pollEmbed = new EmbedBuilder()
                        .setTitle('📊 ' + question)
                        .setColor('#FFFFFF')
                        .setDescription('Vote by clicking one of the buttons below!')
                        .setTimestamp()
                        .setFooter({ text: 'Poll created by ' + interaction.user.username, iconURL: interaction.user.displayAvatarURL() });
                    
                    // Create poll ID
                    const pollId = Date.now().toString();
                    
                    // Initialize poll data
                    pollData.set(pollId, {
                        question,
                        options: [
                            { text: option1, votes: 0, voters: [] },
                            { text: option2, votes: 0, voters: [] }
                        ],
                        creator: interaction.user.id,
                        totalVotes: 0
                    });
                    
                    // Add optional options if provided
                    if (option3) pollData.get(pollId).options.push({ text: option3, votes: 0, voters: [] });
                    if (option4) pollData.get(pollId).options.push({ text: option4, votes: 0, voters: [] });
                    
                    // Create buttons for voting
                    const voteRow = new ActionRowBuilder();
                    
                    // Add buttons for each option
                    pollData.get(pollId).options.forEach((option, index) => {
                        voteRow.addComponents(
                            new ButtonBuilder()
                                .setCustomId(`poll_vote_${pollId}_${index}`)
                                .setLabel(`${index + 1}. ${option.text}`)
                                .setStyle(ButtonStyle.Secondary)
                        );
                    });
                    
                    // Add results button
                    const controlRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`poll_results_${pollId}`)
                                .setLabel('Show Results')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId(`poll_end_${pollId}`)
                                .setLabel('End Poll')
                                .setStyle(ButtonStyle.Danger)
                        );
                    
                    // Send the poll
                    await interaction.reply({
                        embeds: [pollEmbed],
                        components: [voteRow, controlRow]
                    });
                    
                } catch (error) {
                    console.error('Error creating poll:', error);
                    await interaction.reply({
                        content: 'There was an error creating your poll. Please try again.',
                        ephemeral: true
                    });
                }
            }
            
            // Message creator modal
            else if (interaction.customId === 'message_creator_modal') {
                try {
                    const content = interaction.fields.getTextInputValue('message_content');
                    
                    // Store the message content in session for editing
                    client.messageSessions = client.messageSessions || {};
                    client.messageSessions[interaction.user.id] = {
                        content: content
                    };
                    
                    // Create control buttons for the message
                    const controlRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('edit_message_content')
                                .setLabel('Edit Content')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('add_message_button')
                                .setLabel('+ Add Button')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('preview_message')
                                .setLabel('Preview')
                                .setStyle(ButtonStyle.Secondary)
                        );
                        
                    // Create a second row for the Send Message button
                    const sendRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('send_message')
                                .setLabel('Send Message')
                                .setStyle(ButtonStyle.Success)
                        );
                    
                    // Show the initial message with controls
                    await interaction.reply({
                        content: `**Message Preview:**\n\n${content}\n\nUse the buttons below to edit the message or add buttons:`,
                        components: [controlRow, sendRow],
                        ephemeral: true
                    });
                } catch (error) {
                    console.error('Error handling message creator modal:', error);
                    await interaction.reply({
                        content: 'There was an error creating your message. Please try again.',
                        ephemeral: true
                    });
                }
            }
            
            // Message button creator modal
            else if (interaction.customId === 'message_button_creator_modal') {
                try {
                    // Check if the user has an active message session
                    if (!client.messageSessions || !client.messageSessions[interaction.user.id]) {
                        await interaction.reply({
                            content: 'Your message session has expired. Please create a new message.',
                            ephemeral: true
                        });
                        return;
                    }
                    
                    // Get button values from modal
                    const buttonLabel = interaction.fields.getTextInputValue('button_label');
                    const buttonStyle = interaction.fields.getTextInputValue('button_style');
                    const buttonEmoji = interaction.fields.getTextInputValue('button_emoji') || null;
                    const buttonURL = interaction.fields.getTextInputValue('button_url') || null;
                    const buttonResponse = interaction.fields.getTextInputValue('button_response') || null;
                    
                    // Get the user's message session
                    const messageSession = client.messageSessions[interaction.user.id];
                    
                    // Initialize components array if it doesn't exist
                    messageSession.components = messageSession.components || [];
                    
                    // Create a unique ID for the button
                    const buttonId = `custom_button_${Date.now()}`;
                    
                    // Create the button
                    const button = createButton(buttonLabel, buttonStyle, buttonEmoji, buttonURL, buttonId);
                    
                    // Store the button response if provided
                    if (buttonResponse) {
                        // Initialize button responses map if it doesn't exist
                        client.buttonResponses = client.buttonResponses || new Map();
                        client.buttonResponses.set(buttonId, buttonResponse);
                    }
                    
                    // Add the button to a new or existing action row
                    let actionRow;
                    
                    // Check if there's an action row with space for another button (max 5 buttons per row)
                    if (messageSession.components.length === 0 || 
                        messageSession.components[messageSession.components.length - 1].components.length >= 5) {
                        // Create a new action row
                        actionRow = new ActionRowBuilder();
                        messageSession.components.push(actionRow);
                    } else {
                        // Use the last action row
                        actionRow = messageSession.components[messageSession.components.length - 1];
                    }
                    
                    // Add the button to the action row
                    actionRow.addComponents(button);
                    
                    // Create control buttons for the message
                    const controlRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('edit_message')
                                .setLabel('Edit Message')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('add_button')
                                .setLabel('+ Add Button')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('show_button_styles')
                                .setLabel('Button Style Guide')
                                .setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder()
                                .setCustomId('preview_message')
                                .setLabel('Preview')
                                .setStyle(ButtonStyle.Secondary)
                        );
                    
                    // Create a second row for the Send Message button
                    const sendRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('send_message')
                                .setLabel('Send Message')
                                .setStyle(ButtonStyle.Success)
                        );
                    
                    // Reply with the updated message
                    await interaction.reply({
                        content: `**Message Preview:**\n\n${messageSession.content}\n\nButton added! Use the controls below to continue:`,
                        components: [controlRow, sendRow, ...messageSession.components],
                        ephemeral: true
                    });
                    
                } catch (error) {
                    console.error('Error processing message button creator modal:', error);
                    await interaction.reply({
                        content: 'There was an error adding the button to your message. Please try again.',
                        ephemeral: true
                    });
                }
            }
            
            // Other modal submissions
            else {
                console.log(`Unhandled modal submission: ${interaction.customId}`);
                await interaction.reply({
                    content: 'Modal submitted successfully!',
                    ephemeral: true
                });
            }
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'There was an error processing this interaction!', ephemeral: true });
            }
        } catch (e) {
            console.error('Error sending error response:', e);
        }
    }
});

// Error handling
client.on('error', error => {
    console.error('\x1b[31m✦ Discord client error:\x1b[0m', error);
});

process.on('unhandledRejection', error => {
    console.error('\x1b[31m✦ Unhandled promise rejection:\x1b[0m', error);
});

// Function to join voice channel and set up connection
async function joinVoiceChannelAndSetup(guild, channel, persistent = true) {
    try {
        // Join the voice channel
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: false
        });
        
        // Create an audio player for this guild if it doesn't exist
        if (!client.voiceManager.audioPlayers.has(guild.id)) {
            const player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Play
                }
            });
            
            client.voiceManager.audioPlayers.set(guild.id, player);
            
            // Set default audio state
            client.voiceManager.audioState.set(guild.id, {
                muted: false,
                deafened: false
            });
            
            // Subscribe the connection to the player
            connection.subscribe(player);
            
            // We'll skip playing silence as it's causing issues
            // The connection should still work without it
        }
        
        // Store the connection
        client.voiceManager.connections.set(guild.id, connection);
        
        // If persistent, store the channel ID to reconnect if disconnected
        if (persistent) {
            client.voiceManager.persistentChannels.set(guild.id, channel.id);
            // Save to file for persistence across restarts
            savePersistentConnections();
        } else {
            client.voiceManager.persistentChannels.delete(guild.id);
            savePersistentConnections();
        }
        
        // Reset reconnect attempts
        client.voiceManager.reconnectAttempts.set(guild.id, 0);
        
        // Handle connection errors and disconnects
        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                // Try to reconnect immediately
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                ]);
                // Seems to be reconnecting to a new channel
            } catch (error) {
                // Seems to be a real disconnect, handle it only if we're set to be persistent
                if (client.voiceManager.persistentChannels.has(guild.id)) {
                    connection.destroy();
                    
                    // The VoiceStateUpdate event will handle reconnection
                }
            }
        });
        
        return connection;
    } catch (error) {
        console.error(`Error joining voice channel in guild ${guild.id}:`, error);
        throw error;
    }
}

// Function to update bot's audio state
function updateBotAudioState(guildId, options = {}) {
    const { muted, deafened } = options;
    
    // Get current state
    const currentState = client.voiceManager.audioState.get(guildId) || { muted: false, deafened: false };
    
    // Update state with new values if provided
    const newState = {
        muted: muted !== undefined ? muted : currentState.muted,
        deafened: deafened !== undefined ? deafened : currentState.deafened
    };
    
    // Store the new state
    client.voiceManager.audioState.set(guildId, newState);
    
    // Get the audio player
    const player = client.voiceManager.audioPlayers.get(guildId);
    
    if (player) {
        // If muted, pause the player (or play silence)
        if (newState.muted) {
            player.pause();
        } else {
            // If not muted, resume playing (or continue playing silence)
            if (player.state.status === AudioPlayerStatus.Paused) {
                player.unpause();
            }
        }
    }
    
    return newState;
}

// Login the bot with colorful console message
console.log('\x1b[35m✦ \x1b[0mConnecting to Discord...\x1b[0m');
keepAlive();
client.login(TOKEN);