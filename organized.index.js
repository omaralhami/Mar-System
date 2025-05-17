/**
 * Mar System - Discord Bot
 * All-in-one Discord bot with welcome functionality, slash commands, embeds, buttons, and image handling
 * 
 * نظام مار - بوت ديسكورد
 * بوت ديسكورد شامل مع وظائف الترحيب، أوامر سلاش، إمبدز، أزرار، ومعالجة الصور
 */

// ========== IMPORTS & DEPENDENCIES ==========
// ========== الاستيرادات والتبعيات ==========

// Load environment variables
// تحميل متغيرات البيئة
require('dotenv').config();

// Import Discord.js components
// استيراد مكونات Discord.js
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

// Import voice components
// استيراد مكونات الصوت
const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource,
    NoSubscriberBehavior, 
    VoiceConnectionStatus, 
    entersState,
    AudioPlayerStatus
} = require('@discordjs/voice');

// Import file system modules
// استيراد وحدات نظام الملفات
const fs = require('fs');
const path = require('path');

// ========== CONFIGURATION ==========
// ========== الإعدادات ==========

// Bot configuration from environment variables
// إعدادات البوت من متغيرات البيئة
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// Path for persistent data
// مسار البيانات الدائمة
const VOICE_DATA_PATH = path.join(__dirname, 'voice_connections.json');
const SETTINGS_PATH = path.join(__dirname, 'settings.json');

// Create client with necessary intents and partials
// إنشاء العميل مع النوايا والأجزاء اللازمة
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildInvites
    ],
    partials: [Partials.Channel, Partials.Message, Partials.GuildMember]
});

// Color mapping for common color names
// تعيين الألوان للأسماء الشائعة
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

// ========== SLASH COMMANDS CONFIGURATION ==========
// ========== إعداد أوامر سلاش ==========

// Define all slash commands with their options
// تعريف جميع أوامر سلاش مع خياراتها
const commands = [
    // Ping command - Simple latency check
    // أمر بينج - فحص بسيط للاتصال
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with pong and bot latency'),
    
    // Welcome command - Send welcome message
    // أمر الترحيب - إرسال رسالة ترحيب
    new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Send a welcome message to the channel'),
    
    // Set Welcome Channel command - Configure welcome message destination
    // أمر تعيين قناة الترحيب - تكوين وجهة رسالة الترحيب
    new SlashCommandBuilder()
        .setName('setwelcome')
        .setDescription('Set the welcome channel for new member announcements')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send welcome messages to')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)),
    
    // Embed command - Create custom embeds
    // أمر الإمبد - إنشاء إمبدات مخصصة
    new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Create a custom embed message')
        .addStringOption(option => 
            option.setName('title')
                .setDescription('The title of the embed')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('description')
                .setDescription('The description of the embed')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('color')
                .setDescription('Color name or hex code (e.g., red, blue, #ff0000)')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('image')
                .setDescription('URL of the image to include')
                .setRequired(false)),
                
    // Button command - Create messages with buttons
    // أمر الأزرار - إنشاء رسائل مع أزرار
    new SlashCommandBuilder()
        .setName('button')
        .setDescription('Create a message with custom buttons')
        .addStringOption(option => 
            option.setName('message')
                .setDescription('The message to include with the buttons')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('button1_label')
                .setDescription('Text for button 1')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('button1_style')
                .setDescription('Style for button 1 (primary, success, danger, link)')
                .setRequired(true)
                .addChoices(
                    { name: 'Primary (Blue)', value: 'primary' },
                    { name: 'Success (Green)', value: 'success' },
                    { name: 'Danger (Red)', value: 'danger' },
                    { name: 'Link (Grey)', value: 'link' }
                ))
        .addStringOption(option => 
            option.setName('button1_emoji')
                .setDescription('Emoji for button 1 (unicode or Discord emoji ID)')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('button1_url')
                .setDescription('URL for button 1 (only if style is link)')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('button2_label')
                .setDescription('Text for button 2')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('button2_style')
                .setDescription('Style for button 2 (primary, success, danger, link)')
                .setRequired(false)
                .addChoices(
                    { name: 'Primary (Blue)', value: 'primary' },
                    { name: 'Success (Green)', value: 'success' },
                    { name: 'Danger (Red)', value: 'danger' },
                    { name: 'Link (Grey)', value: 'link' }
                ))
        .addStringOption(option => 
            option.setName('button2_emoji')
                .setDescription('Emoji for button 2 (unicode or Discord emoji ID)')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('button2_url')
                .setDescription('URL for button 2 (only if style is link)')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('button3_label')
                .setDescription('Text for button 3')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('button3_style')
                .setDescription('Style for button 3 (primary, success, danger, link)')
                .setRequired(false)
                .addChoices(
                    { name: 'Primary (Blue)', value: 'primary' },
                    { name: 'Success (Green)', value: 'success' },
                    { name: 'Danger (Red)', value: 'danger' },
                    { name: 'Link (Grey)', value: 'link' }
                ))
        .addStringOption(option => 
            option.setName('button3_emoji')
                .setDescription('Emoji for button 3 (unicode or Discord emoji ID)')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('button3_url')
                .setDescription('URL for button 3 (only if style is link)')
                .setRequired(false)),

    // Create command - Visual builder for content
    // أمر الإنشاء - منشئ مرئي للمحتوى
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
                
    // Send command - Send various content types
    // أمر الإرسال - إرسال أنواع مختلفة من المحتوى
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
                        
    // Clear command - Channel management
    // أمر المسح - إدارة القناة
    new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Delete and recreate this channel with the same permissions')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for clearing the channel')
                .setRequired(false)),
                
    // Voice command - Voice channel management
    // أمر الصوت - إدارة قناة الصوت
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
]; 

// ========== DATA STORAGE & STATE MANAGEMENT ==========
// ========== إدارة البيانات والحالة ==========

// Store voice connection data
// تخزين بيانات اتصال الصوت
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
// تخزين إعدادات البوت
client.settings = new Map(); // Guild settings like welcome channels

// Store button response messages
// تخزين رسائل استجابة الأزرار
const buttonResponses = new Map();

// Store poll data
// تخزين بيانات الاستطلاعات
const pollData = new Map();

// Store invite cache for tracking who invited who
// تخزين ذاكرة التخزين المؤقت للدعوات لتتبع من دعا من
const inviteCache = new Map();

// ========== UTILITY FUNCTIONS ==========
// ========== وظائف المساعدة ==========

// Register slash commands when bot starts
// تسجيل أوامر سلاش عند بدء تشغيل البوت
const registerCommands = async () => {
    try {
        console.log('Started refreshing application slash commands...');
        
        const rest = new REST({ version: '10' }).setToken(TOKEN);
        
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands },
        );
        
        console.log('Successfully reloaded application slash commands!');
    } catch (error) {
        console.error(error);
    }
};

// Function to save persistent voice connections to file
// وظيفة لحفظ اتصالات الصوت الدائمة في ملف
function savePersistentConnections() {
    const data = {};
    
    // Convert Map to object for saving
    // تحويل Map إلى كائن للحفظ
    client.voiceManager.persistentChannels.forEach((channelId, guildId) => {
        data[guildId] = channelId;
    });
    
    // Write to file
    // الكتابة إلى ملف
    fs.writeFileSync(VOICE_DATA_PATH, JSON.stringify(data, null, 2));
    console.log('Saved persistent voice connections to file');
}

// Function to load persistent voice connections from file
// وظيفة لتحميل اتصالات الصوت الدائمة من ملف
function loadPersistentConnections() {
    try {
        if (fs.existsSync(VOICE_DATA_PATH)) {
            const data = JSON.parse(fs.readFileSync(VOICE_DATA_PATH, 'utf8'));
            
            // Convert object back to Map
            // تحويل الكائن مرة أخرى إلى Map
            Object.entries(data).forEach(([guildId, channelId]) => {
                client.voiceManager.persistentChannels.set(guildId, channelId);
            });
            
            console.log('Loaded persistent voice connections from file');
            return true;
        }
    } catch (error) {
        console.error('Error loading persistent voice connections:', error);
    }
    
    return false;
}

// Function to save settings to file
// وظيفة لحفظ الإعدادات في ملف
function saveSettings() {
    const data = {};
    
    // Convert Map to object for saving
    // تحويل Map إلى كائن للحفظ
    client.settings.forEach((settings, guildId) => {
        data[guildId] = settings;
    });
    
    // Write to file
    // الكتابة إلى ملف
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2));
    console.log('Saved settings to file');
}

// Function to load settings from file
// وظيفة لتحميل الإعدادات من ملف
function loadSettings() {
    try {
        if (fs.existsSync(SETTINGS_PATH)) {
            const data = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
            
            // Convert object back to Map
            // تحويل الكائن مرة أخرى إلى Map
            Object.entries(data).forEach(([guildId, settings]) => {
                client.settings.set(guildId, settings);
            });
            
            console.log('Loaded settings from file');
            return true;
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
    
    return false;
}

// Format a date in a user-friendly way
// تنسيق التاريخ بطريقة سهلة الاستخدام
function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
}

// Calculate how many days ago an account was created
// حساب عدد الأيام منذ إنشاء الحساب
function getAccountAge(createdTimestamp) {
    const createdDate = new Date(createdTimestamp);
    const now = new Date();
    const diffTime = Math.abs(now - createdDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Function to get the appropriate suffix for numbers
// وظيفة للحصول على اللاحقة المناسبة للأرقام
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
// وظيفة مساعدة لتحليل أسماء الألوان أو رموز الألوان السداسية
function resolveColor(color) {
    if (!color) return '#FFFFFF'; // Default white instead of Discord blurple
    
    // If it's a hex code already, return it
    // إذا كان رمز سداسي بالفعل، أعده
    if (color.startsWith('#')) {
        return color;
    }
    
    // Convert to lowercase for case-insensitive matching
    // تحويل إلى أحرف صغيرة للمطابقة غير الحساسة لحالة الأحرف
    const lowerColor = color.toLowerCase();
    
    // If it's a recognized color name, return the hex
    // إذا كان اسم لون معروف، أعد الرمز السداسي
    if (COLORS[lowerColor]) {
        return COLORS[lowerColor];
    }
    
    // Default color if not found
    // اللون الافتراضي إذا لم يتم العثور عليه
    return '#FFFFFF';
}

// Function to create a button based on input parameters
// وظيفة لإنشاء زر بناءً على معلمات الإدخال
function createButton(label, style, emoji, url, customId) {
    const button = new ButtonBuilder()
        .setLabel(label);
    
    // Set style
    // تعيين النمط
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
    // إضافة رمز تعبيري إذا تم توفيره
    if (emoji) {
        button.setEmoji(emoji);
    }
    
    // Set custom ID for non-link buttons
    // تعيين معرف مخصص للأزرار غير الارتباطية
    if (style.toLowerCase() !== 'link') {
        button.setCustomId(customId);
    }
    
    return button;
}

// Create a color selector menu
// إنشاء قائمة اختيار الألوان
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
// إنشاء شريط تقدم مرئي
function createProgressBar(percentage) {
    const filledBlocks = Math.round(percentage / 10);
    const emptyBlocks = 10 - filledBlocks;
    
    const filledChar = '█';
    const emptyChar = '░';
    
    return filledChar.repeat(filledBlocks) + emptyChar.repeat(emptyBlocks);
}

// Create a silent audio resource (used for keeping connection alive)
// إنشاء مورد صوتي صامت (يستخدم للحفاظ على الاتصال نشطًا)
const createSilenceResource = () => {
    try {
        // Import the required modules
        // استيراد الوحدات المطلوبة
        const { createAudioResource } = require('@discordjs/voice');
        const { Readable } = require('stream');
        
        // Create a simple silent buffer (PCM format)
        // إنشاء مخزن مؤقت صامت بسيط (تنسيق PCM)
        const buffer = Buffer.alloc(1920); // Small buffer of silence
        const silenceStream = Readable.from(buffer);
        
        // Create and return the audio resource without opus
        // إنشاء وإرجاع مورد الصوت بدون opus
        return createAudioResource(silenceStream, { 
            inputType: 'raw',
            inlineVolume: true 
        });
    } catch (error) {
        console.error('Error creating silence resource:', error);
        return null;
    }
};

// Function to join voice channel and set up connection
// وظيفة للانضمام إلى قناة صوتية وإعداد الاتصال
async function joinVoiceChannelAndSetup(guild, channel, persistent = true) {
    try {
        // Join the voice channel
        // الانضمام إلى قناة الصوت
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: false
        });
        
        // Create an audio player for this guild if it doesn't exist
        // إنشاء مشغل صوتي لهذا السيرفر إذا لم يكن موجودًا
        if (!client.voiceManager.audioPlayers.has(guild.id)) {
            const player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Play
                }
            });
            
            client.voiceManager.audioPlayers.set(guild.id, player);
            
            // Set default audio state
            // تعيين حالة الصوت الافتراضية
            client.voiceManager.audioState.set(guild.id, {
                muted: false,
                deafened: false
            });
            
            // Subscribe the connection to the player
            // اشتراك الاتصال في المشغل
            connection.subscribe(player);
        }
        
        // Store the connection
        // تخزين الاتصال
        client.voiceManager.connections.set(guild.id, connection);
        
        // If persistent, store the channel ID to reconnect if disconnected
        // إذا كان دائمًا، قم بتخزين معرف القناة لإعادة الاتصال في حالة الانقطاع
        if (persistent) {
            client.voiceManager.persistentChannels.set(guild.id, channel.id);
            // Save to file for persistence across restarts
            // حفظ في ملف للاستمرارية عبر إعادة التشغيل
            savePersistentConnections();
        } else {
            client.voiceManager.persistentChannels.delete(guild.id);
            savePersistentConnections();
        }
        
        // Reset reconnect attempts
        // إعادة تعيين محاولات إعادة الاتصال
        client.voiceManager.reconnectAttempts.set(guild.id, 0);
        
        // Handle connection errors and disconnects
        // معالجة أخطاء الاتصال والانقطاعات
        connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                // Try to reconnect immediately
                // محاولة إعادة الاتصال فورًا
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                ]);
                // Seems to be reconnecting to a new channel
                // يبدو أنه يعيد الاتصال بقناة جديدة
            } catch (error) {
                // Seems to be a real disconnect, handle it only if we're set to be persistent
                // يبدو أنه انقطاع حقيقي، تعامل معه فقط إذا كنا مضبوطين على أن نكون مستمرين
                if (client.voiceManager.persistentChannels.has(guild.id)) {
                    connection.destroy();
                    
                    // The VoiceStateUpdate event will handle reconnection
                    // سيتعامل حدث VoiceStateUpdate مع إعادة الاتصال
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
// وظيفة لتحديث حالة صوت البوت
function updateBotAudioState(guildId, options = {}) {
    const { muted, deafened } = options;
    
    // Get current state
    // الحصول على الحالة الحالية
    const currentState = client.voiceManager.audioState.get(guildId) || { muted: false, deafened: false };
    
    // Update state with new values if provided
    // تحديث الحالة بقيم جديدة إذا تم توفيرها
    const newState = {
        muted: muted !== undefined ? muted : currentState.muted,
        deafened: deafened !== undefined ? deafened : currentState.deafened
    };
    
    // Store the new state
    // تخزين الحالة الجديدة
    client.voiceManager.audioState.set(guildId, newState);
    
    // Get the audio player
    // الحصول على مشغل الصوت
    const player = client.voiceManager.audioPlayers.get(guildId);
    
    if (player) {
        // If muted, pause the player (or play silence)
        // إذا كان صامتًا، قم بإيقاف المشغل مؤقتًا (أو تشغيل الصمت)
        if (newState.muted) {
            player.pause();
        } else {
            // If not muted, resume playing (or continue playing silence)
            // إذا لم يكن صامتًا، استأنف التشغيل (أو استمر في تشغيل الصمت)
            if (player.state.status === AudioPlayerStatus.Paused) {
                player.unpause();
            }
        }
    }
    
    return newState;
}

// ========== EVENT HANDLERS ==========
// ========== معالجات الأحداث ==========

// Bot ready event
// حدث جاهزية البوت
client.once(Events.ClientReady, async () => {
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setActivity('for your commands | Mar System');
    registerCommands();
    
    // Load settings
    // تحميل الإعدادات
    loadSettings();
    
    // Cache all current invites for each guild
    // تخزين جميع الدعوات الحالية لكل سيرفر
    client.guilds.cache.forEach(async guild => {
        try {
            // Check if the bot has permissions to view invites
            // التحقق مما إذا كان البوت لديه أذونات لعرض الدعوات
            if (guild.members.me.permissions.has(PermissionFlagsBits.ManageGuild)) {
                const guildInvites = await guild.invites.fetch();
                inviteCache.set(guild.id, new Map(guildInvites.map(invite => [invite.code, invite.uses])));
                console.log(`Cached ${guildInvites.size} invites for guild ${guild.name}`);
            }
        } catch (error) {
            console.error(`Error caching invites for guild ${guild.id}:`, error);
        }
    });
    
    // Load persistent voice connections and reconnect
    // تحميل اتصالات الصوت الدائمة وإعادة الاتصال
    if (loadPersistentConnections()) {
        console.log('Attempting to reconnect to persistent voice channels...');
        
        // Reconnect to all persistent voice channels
        // إعادة الاتصال بجميع قنوات الصوت الدائمة
        for (const [guildId, channelId] of client.voiceManager.persistentChannels.entries()) {
            try {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) {
                    console.log(`Guild ${guildId} not found, skipping reconnection`);
                    continue;
                }
                
                const channel = guild.channels.cache.get(channelId);
                if (!channel) {
                    console.log(`Channel ${channelId} in guild ${guildId} not found, skipping reconnection`);
                    continue;
                }
                
                console.log(`Reconnecting to voice channel ${channel.name} in ${guild.name}`);
                await joinVoiceChannelAndSetup(guild, channel, true);
                console.log(`Successfully reconnected to voice channel ${channel.name} in ${guild.name}`);
            } catch (error) {
                console.error(`Failed to reconnect to voice channel in guild ${guildId}:`, error);
            }
        }
    }
});

// Track when new invites are created
// تتبع عند إنشاء دعوات جديدة
client.on(Events.InviteCreate, invite => {
    const guildInvites = inviteCache.get(invite.guild.id) || new Map();
    guildInvites.set(invite.code, invite.uses);
    inviteCache.set(invite.guild.id, guildInvites);
    console.log(`Invite ${invite.code} created for guild ${invite.guild.name}`);
});

// Handle voice state updates (for reconnecting if disconnected)
// معالجة تحديثات حالة الصوت (لإعادة الاتصال في حالة الانقطاع)
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    // Check if this update is for our bot
    // التحقق مما إذا كان هذا التحديث للبوت الخاص بنا
    if (newState.member.id !== client.user.id) return;
    
    const guildId = newState.guild.id;
    
    // If the bot was disconnected from a voice channel
    // إذا تم فصل البوت من قناة صوتية
    if (oldState.channelId && !newState.channelId) {
        // Check if this channel was set to be persistent
        // التحقق مما إذا كانت هذه القناة معينة لتكون دائمة
        const persistentChannelId = client.voiceManager.persistentChannels.get(guildId);
        
        if (persistentChannelId) {
            console.log(`Bot was disconnected from voice in guild ${guildId}. Will attempt to reconnect.`);
            
            // Clear any existing reconnect timer
            // مسح أي مؤقت لإعادة الاتصال موجود
            if (client.voiceManager.reconnectTimers.has(guildId)) {
                clearTimeout(client.voiceManager.reconnectTimers.get(guildId));
            }
            
            // Initialize reconnect attempts counter if not exists
            // تهيئة عداد محاولات إعادة الاتصال إذا لم يكن موجودًا
            if (!client.voiceManager.reconnectAttempts.has(guildId)) {
                client.voiceManager.reconnectAttempts.set(guildId, 0);
            }
            
            // Set a timer to reconnect with exponential backoff
            // تعيين مؤقت لإعادة الاتصال مع تراجع أسي
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
                    // محاولة إعادة الانضمام إلى القناة
                    await joinVoiceChannelAndSetup(guild, channel, true);
                    console.log(`Successfully reconnected to voice channel ${channel.name} in ${guild.name}`);
                    
                    // Reset reconnect attempts on success
                    // إعادة تعيين محاولات إعادة الاتصال عند النجاح
                    client.voiceManager.reconnectAttempts.set(guildId, 0);
                } catch (error) {
                    console.error(`Failed to reconnect to voice channel in guild ${guildId}:`, error);
                    
                    // Increment reconnect attempts
                    // زيادة محاولات إعادة الاتصال
                    const newAttempts = client.voiceManager.reconnectAttempts.get(guildId) + 1;
                    client.voiceManager.reconnectAttempts.set(guildId, newAttempts);
                    
                    // If we haven't reached max attempts, schedule another reconnect
                    // إذا لم نصل إلى الحد الأقصى للمحاولات، قم بجدولة إعادة اتصال أخرى
                    if (newAttempts < client.voiceManager.maxReconnectAttempts) {
                        // This will trigger another reconnect with increased backoff
                        // هذا سيؤدي إلى إعادة اتصال أخرى مع زيادة التراجع
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
        // Bot has successfully connected or moved to a new channel
        // نجح البوت في الاتصال أو الانتقال إلى قناة جديدة
        // Reset reconnect attempts
        // إعادة تعيين محاولات إعادة الاتصال
        client.voiceManager.reconnectAttempts.set(guildId, 0);
    }
});

// Welcome event - when a new member joins
// حدث الترحيب - عندما ينضم عضو جديد
client.on(Events.GuildMemberAdd, async (member) => {
    // Check if there's a custom welcome channel set
    // التحقق مما إذا كانت هناك قناة ترحيب مخصصة معينة
    let welcomeChannelId = null;
    if (client.settings.has(member.guild.id)) {
        const guildSettings = client.settings.get(member.guild.id);
        welcomeChannelId = guildSettings.welcomeChannelId;
    }
    
    // Find the welcome channel, system channel, or the first text channel to send welcome message
    // العثور على قناة الترحيب، قناة النظام، أو أول قناة نصية لإرسال رسالة الترحيب
    const channel = welcomeChannelId ? member.guild.channels.cache.get(welcomeChannelId) :
                    member.guild.systemChannel || 
                    member.guild.channels.cache.find(ch => 
                        ch.type === 0 && ch.permissionsFor(member.guild.members.me).has('SendMessages')
                    );
    
    if (!channel) return;
    
    // Try to find who invited the member
    // محاولة معرفة من دعا العضو
    let inviterName = "Unknown";
    try {
        if (member.guild.members.me.permissions.has(PermissionFlagsBits.ManageGuild)) {
            // Fetch the new invite counts
            // جلب عدد الدعوات الجديدة
            const newInvites = await member.guild.invites.fetch();
            // Get the cached invite counts
            // الحصول على عدد الدعوات المخزنة مؤقتًا
            const oldInvites = inviteCache.get(member.guild.id) || new Map();
            
            // Find the invite that was used
            // العثور على الدعوة التي تم استخدامها
            const usedInvite = newInvites.find(invite => {
                const oldUses = oldInvites.get(invite.code) || 0;
                return invite.uses > oldUses;
            });
            
            // Update the cache with new invite counts
            // تحديث ذاكرة التخزين المؤقت بعدد الدعوات الجديدة
            inviteCache.set(member.guild.id, new Map(newInvites.map(invite => [invite.code, invite.uses])));
            
            // If we found the invite, get the inviter
            // إذا وجدنا الدعوة، احصل على الداعي
            if (usedInvite && usedInvite.inviter) {
                inviterName = usedInvite.inviter.tag;
            }
        }
    } catch (error) {
        console.error(`Error tracking invite for guild ${member.guild.id}:`, error);
    }
    
    // Get account creation date info
    // الحصول على معلومات تاريخ إنشاء الحساب
    const accountCreated = formatDate(member.user.createdAt);
    const accountAge = getAccountAge(member.user.createdTimestamp);
    
    // Create welcome embed with simplified design
    // إنشاء إمبد ترحيب بتصميم مبسط
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
    // إضافة حقل الداعي إذا كان متاحًا
    if (inviterName !== "Unknown") {
        welcomeEmbed.addFields({ name: 'Invited By', value: inviterName, inline: true });
    }
    
    // Create welcome buttons
    // إنشاء أزرار الترحيب
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

// ========== COMMAND HANDLERS ==========
// ========== معالجات الأوامر ==========

// Handle slash commands
// معالجة أوامر سلاش
client.on(Events.InteractionCreate, async interaction => {
    // Only handle slash commands in this handler
    // معالجة أوامر سلاش فقط في هذا المعالج
    if (!interaction.isChatInputCommand()) return;
    
    try {
        const { commandName, options } = interaction;
        console.log(`Received command: ${commandName}`);
        
        // Ping command
        // أمر بينج
        if (commandName === 'ping') {
            await interaction.reply('Pong! ' + client.ws.ping + 'ms');
        }
        
        // Welcome command
        // أمر الترحيب
        else if (commandName === 'welcome') {
            // Create welcome embed with simplified design
            // إنشاء إمبد ترحيب بتصميم مبسط
            const welcomeEmbed = new EmbedBuilder()
                .setColor('#FFFFFF')
                .setTitle('✦ New Member')
                .setDescription(`**Hey** ${interaction.user}. Welcome to **${interaction.guild.name}**!\n\n✦ We're glad to have you here.\n✦ Feel free to introduce yourself.\n✦ Check out our channels and get involved!`)
                .addFields(
                    { name: '✦ Member', value: `${interaction.guild.memberCount}`, inline: true },
                    { name: '✦ Account Created', value: `\`${formatDate(interaction.user.createdAt)}\``, inline: true }
                )
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 256 }))
                .setFooter({ text: 'Mar System Welcomer', iconURL: client.user.displayAvatarURL() });
            
            // Create welcome buttons
            // إنشاء أزرار الترحيب
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
        // أمر تعيين قناة الترحيب
        else if (commandName === 'setwelcome') {
            // Check if the user has permission to manage the server
            // التحقق مما إذا كان المستخدم لديه إذن لإدارة السيرفر
            if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
                await interaction.reply({
                    content: 'You need the "Manage Server" permission to use this command.',
                    ephemeral: true
                });
                return;
            }
            
            const channel = options.getChannel('channel');
            
            // Validate channel type
            // التحقق من نوع القناة
            if (channel.type !== ChannelType.GuildText) {
                await interaction.reply({
                    content: 'Please select a text channel for welcome messages.',
                    ephemeral: true
                });
                return;
            }
            
            // Check bot permissions in the channel
            // التحقق من أذونات البوت في القناة
            const permissions = channel.permissionsFor(interaction.guild.members.me);
            if (!permissions.has('SendMessages') || !permissions.has('EmbedLinks')) {
                await interaction.reply({
                    content: `I don't have permission to send messages or embeds in ${channel}. Please give me the required permissions first.`,
                    ephemeral: true
                });
                return;
            }
            
            // Initialize guild settings if they don't exist
            // تهيئة إعدادات السيرفر إذا لم تكن موجودة
            if (!client.settings.has(interaction.guildId)) {
                client.settings.set(interaction.guildId, {});
            }
            
            // Update the welcome channel
            // تحديث قناة الترحيب
            const guildSettings = client.settings.get(interaction.guildId);
            guildSettings.welcomeChannelId = channel.id;
            
            // Save settings
            // حفظ الإعدادات
            saveSettings();
            
            // Create confirmation embed
            // إنشاء إمبد التأكيد
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
        
        // Voice commands
        // أوامر الصوت
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
                    // إزالة من الاتصالات الدائمة إذا كانت دائمة
                    client.voiceManager.persistentChannels.delete(interaction.guildId);
                    savePersistentConnections();
                    
                    // Destroy the connection
                    // تدمير الاتصال
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
                    // تحديث حالة كتم صوت البوت
                    const newState = updateBotAudioState(interaction.guildId, { muted: true });
                    
                    // Actually mute the bot in the voice channel
                    // كتم صوت البوت فعليًا في قناة الصوت
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
                    // تحديث حالة كتم صوت البوت
                    const newState = updateBotAudioState(interaction.guildId, { muted: false });
                    
                    // Actually unmute the bot in the voice channel
                    // إلغاء كتم صوت البوت فعليًا في قناة الصوت
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
                    // تحديث حالة صم البوت
                    const newState = updateBotAudioState(interaction.guildId, { deafened: true });
                    
                    // Actually deafen the bot in the voice channel
                    // صم البوت فعليًا في قناة الصوت
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
                    // تحديث حالة صم البوت
                    const newState = updateBotAudioState(interaction.guildId, { deafened: false });
                    
                    // Actually undeafen the bot in the voice channel
                    // إلغاء صم البوت فعليًا في قناة الصوت
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
        
        // Other commands would be added here...
        // سيتم إضافة الأوامر الأخرى هنا...
        
        // Default response for unhandled commands
        // استجابة افتراضية للأوامر غير المعالجة
        else {
            // Handle other commands as needed
            await interaction.reply({ content: `Command received: /${commandName}`, ephemeral: true });
        }
    } catch (error) {
        console.error('Error executing command:', error);
        
        // Reply with error if we haven't replied yet
        // الرد بخطأ إذا لم نرد بعد
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ 
                content: 'There was an error executing this command!', 
                ephemeral: true 
            }).catch(console.error);
        }
    }
});

// ========== BUTTON & MODAL HANDLERS ==========
// ========== معالجات الأزرار والنوافذ ==========

// Handle button interactions and modal submissions
// معالجة تفاعلات الأزرار وتقديمات النوافذ
client.on(Events.InteractionCreate, async interaction => {
    // Skip if this is a slash command (handled by the other listener)
    // تخطي إذا كان هذا أمر سلاش (يتم معالجته بواسطة المستمع الآخر)
    if (interaction.isChatInputCommand()) return;
    
    try {
        // Handle button clicks
        // معالجة النقرات على الأزرار
        if (interaction.isButton()) {
            console.log(`Button clicked: ${interaction.customId}`);
            
            // Rules button handler
            // معالج زر القواعد
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
            // معالج زر الخدمة المخصصة
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
                // إنشاء أزرار الخدمة
                const serviceButtons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('Visit Website')
                            .setURL('https://marservices.cc')
                            .setStyle(ButtonStyle.Link)
                    );
                
                await interaction.reply({ embeds: [serviceEmbed], components: [serviceButtons], ephemeral: true });
            }
            // Poll vote button handler
            // معالج زر التصويت في الاستطلاع
            else if (interaction.customId.startsWith('poll_vote_')) {
                try {
                    // Extract poll ID and option index from the button ID
                    // استخراج معرف الاستطلاع ومؤشر الخيار من معرف الزر
                    const parts = interaction.customId.split('_');
                    const pollId = parts[2];
                    const optionIndex = parseInt(parts[3]);
                    
                    // Check if the poll exists
                    // التحقق مما إذا كان الاستطلاع موجودًا
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
                    // التحقق مما إذا كان المستخدم قد صوت بالفعل لهذا الخيار
                    if (poll.options[optionIndex].voters.includes(userId)) {
                        await interaction.reply({
                            content: 'You have already voted for this option.',
                            ephemeral: true
                        });
                        return;
                    }
                    
                    // Remove user's vote from any other option they may have voted for
                    // إزالة تصويت المستخدم من أي خيار آخر قد يكون قد صوت له
                    poll.options.forEach(option => {
                        const voterIndex = option.voters.indexOf(userId);
                        if (voterIndex !== -1) {
                            option.voters.splice(voterIndex, 1);
                            option.votes--;
                            poll.totalVotes--;
                        }
                    });
                    
                    // Add the vote to the selected option
                    // إضافة التصويت إلى الخيار المحدد
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
            // معالج زر نتائج الاستطلاع
            else if (interaction.customId.startsWith('poll_results_')) {
                try {
                    // Extract poll ID from the button ID
                    // استخراج معرف الاستطلاع من معرف الزر
                    const pollId = interaction.customId.split('_')[2];
                    
                    // Check if the poll exists
                    // التحقق مما إذا كان الاستطلاع موجودًا
                    if (!pollData.has(pollId)) {
                        await interaction.reply({
                            content: 'This poll no longer exists or has expired.',
                            ephemeral: true
                        });
                        return;
                    }
                    
                    const poll = pollData.get(pollId);
                    
                    // Create an embed to show the results
                    // إنشاء إمبد لإظهار النتائج
                    const resultsEmbed = new EmbedBuilder()
                        .setTitle(`Poll Results: ${poll.question}`)
                        .setColor('#FFFFFF')
                        .setDescription(`Total votes: ${poll.totalVotes}`)
                        .setTimestamp();
                    
                    // Add fields for each option with percentage and progress bar
                    // إضافة حقول لكل خيار مع النسبة المئوية وشريط التقدم
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
            // معالج زر إنهاء الاستطلاع
            else if (interaction.customId.startsWith('poll_end_')) {
                try {
                    // Extract poll ID from the button ID
                    // استخراج معرف الاستطلاع من معرف الزر
                    const pollId = interaction.customId.split('_')[2];
                    
                    // Check if the poll exists
                    // التحقق مما إذا كان الاستطلاع موجودًا
                    if (!pollData.has(pollId)) {
                        await interaction.reply({
                            content: 'This poll no longer exists or has expired.',
                            ephemeral: true
                        });
                        return;
                    }
                    
                    const poll = pollData.get(pollId);
                    
                    // Check if the user is the poll creator
                    // التحقق مما إذا كان المستخدم هو منشئ الاستطلاع
                    if (interaction.user.id !== poll.creator) {
                        await interaction.reply({
                            content: 'Only the poll creator can end this poll.',
                            ephemeral: true
                        });
                        return;
                    }
                    
                    // Create an embed to show the final results
                    // إنشاء إمبد لإظهار النتائج النهائية
                    const finalResultsEmbed = new EmbedBuilder()
                        .setTitle(`Poll Ended: ${poll.question}`)
                        .setColor('#FFFFFF')
                        .setDescription(`Final results (Total votes: ${poll.totalVotes})`)
                        .setTimestamp();
                    
                    // Add fields for each option with percentage and progress bar
                    // إضافة حقول لكل خيار مع النسبة المئوية وشريط التقدم
                    poll.options.forEach((option, index) => {
                        const percentage = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
                        const progressBar = createProgressBar(percentage);
                        
                        finalResultsEmbed.addFields({
                            name: `${index + 1}. ${option.text}`,
                            value: `${option.votes} votes (${percentage}%)\n${progressBar}`
                        });
                    });
                    
                    // Add footer with poll creator
                    // إضافة تذييل مع منشئ الاستطلاع
                    finalResultsEmbed.setFooter({
                        text: `Poll ended by ${interaction.user.username}`,
                        iconURL: interaction.user.displayAvatarURL()
                    });
                    
                    // Update the original message with the final results and remove buttons
                    // تحديث الرسالة الأصلية بالنتائج النهائية وإزالة الأزرار
                    await interaction.update({
                        embeds: [finalResultsEmbed],
                        components: []
                    });
                    
                    // Clean up poll data
                    // تنظيف بيانات الاستطلاع
                    pollData.delete(pollId);
                    
                } catch (error) {
                    console.error('Error ending poll:', error);
                    await interaction.reply({
                        content: 'There was an error ending the poll. Please try again.',
                        ephemeral: true
                    });
                }
            }
            // Custom button handler
            // معالج الزر المخصص
            else if (interaction.customId.startsWith('custom_button_')) {
                // Check if there's a custom response for this button
                // التحقق مما إذا كانت هناك استجابة مخصصة لهذا الزر
                if (client.buttonResponses && client.buttonResponses.has(interaction.customId)) {
                    const customResponse = client.buttonResponses.get(interaction.customId);
                    await interaction.reply({ content: customResponse, ephemeral: true });
                } else {
                    // Default response if no custom response is set
                    // استجابة افتراضية إذا لم يتم تعيين استجابة مخصصة
                    await interaction.reply({ content: `You clicked ${interaction.component.label}!`, ephemeral: true });
                }
            }
            
            // Other button handlers would be added here...
            // سيتم إضافة معالجات الأزرار الأخرى هنا...
            
            // Default response for unhandled buttons
            // استجابة افتراضية للأزرار غير المعالجة
            else {
                await interaction.reply({ content: `Button clicked: ${interaction.customId}`, ephemeral: true });
            }
        }
        
        // Handle modal submissions
        // معالجة تقديمات النوافذ
        else if (interaction.isModalSubmit()) {
            console.log(`Modal submitted: ${interaction.customId}`);
            
            // Modal handlers would be added here...
            // سيتم إضافة معالجات النوافذ هنا...
            
            // Default response for unhandled modal submissions
            // استجابة افتراضية لتقديمات النوافذ غير المعالجة
            console.log(`Unhandled modal submission: ${interaction.customId}`);
            await interaction.reply({
                content: 'Modal submitted successfully!',
                ephemeral: true
            });
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

// ========== ERROR HANDLING ==========
// ========== معالجة الأخطاء ==========

// Error handling for Discord client
// معالجة الأخطاء لعميل Discord
client.on('error', error => {
    console.error('Discord client error:', error);
});

// Handle unhandled promise rejections
// معالجة رفض الوعود غير المعالجة
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// ========== BOT INITIALIZATION ==========
// ========== تهيئة البوت ==========

// Login the bot with token
// تسجيل دخول البوت باستخدام الرمز
client.login(TOKEN); 