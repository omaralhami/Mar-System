# Mar System

<div align="center">
  
  ![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)
  ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
  ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
  
  <h3>A modern, feature-rich Discord bot with a clean, all-in-one design</h3>
  
  <p>
    <a href="https://discord.gg/marx"><img src="https://img.shields.io/badge/Join_our_community-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord Server"></a>
    <a href="https://marsystem.vercel.app"><img src="https://img.shields.io/badge/Visit_our_website-0088CC?style=for-the-badge&logo=web&logoColor=white" alt="Website"></a>
  </p>
  
</div>

## ✦ Overview

Mar System is a powerful Discord bot built with modern features including welcome messages, slash commands, embeds, interactive buttons, giveaways, and voice channel management - all contained in a single file for easy deployment and maintenance.

<div align="center">
  <img src="https://github.com/omaralhami/mar-system/blob/main/landing/logo.png" alt="Mar System Bot" width="600">
</div>

## ✦ Features

| Feature | Description |
|---------|-------------|
| **Welcome System** | Customizable welcome messages with embeds and buttons |
| **Slash Commands** | Modern Discord interaction commands with intuitive interfaces |
| **Embed Creator** | Visual editor for creating beautiful embed messages |
| **Button System** | Interactive buttons with customizable actions and responses |
| **Giveaway System** | Create and manage giveaways with customizable options |
| **Voice Commands** | Join, leave, and manage voice channels directly through commands |

## ✦ Commands

### General Commands
- `/ping` - Check bot latency
- `/welcome` - Send a welcome message to the channel
- `/setwelcome` - Set the welcome channel for new member announcements

### Content Creation
- `/create embed` - Open a visual editor for creating rich embeds
- `/create buttons` - Create messages with interactive buttons
- `/create poll` - Create interactive polls with voting options
- `/send message` - Create and send a message with the visual editor
- `/send image` - Send an image with optional caption

### Giveaway Commands
- `/giveaway create` - Create a new giveaway with customizable options
- `/giveaway end` - End an active giveaway early
- `/giveaway reroll` - Reroll winners for a completed giveaway

### Voice Commands
- `/voice join` - Join a voice channel and stay connected
- `/voice leave` - Leave the voice channel
- `/voice status` - Check the current voice connection status
- `/voice mute/unmute` - Control bot's mute status
- `/voice deafen/undeafen` - Control bot's deafen status

## ✦ Permission Structure

- **Slash Commands**: Restricted to users with Administrator permissions
- **Button Interactions**: Available to all users
- **Modal Submissions**: Available to all users

## ✦ Setup Instructions

### Prerequisites
- Node.js 16.9.0 or higher
- A Discord bot token
- Discord bot with proper intents enabled

### Quick Start

1. Clone this repository
   ```bash
   git clone https://github.com/omaralhami/mar-system.git
   cd mar-system
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Configure your bot
   - Create a `.env` file with:
     ```
     DISCORD_TOKEN=your_discord_bot_token_here
     CLIENT_ID=your_discord_client_id_here
     ```

4. Run the bot
   ```bash
   node index.js
   ```

5. Invite the bot to your server using:
   ```
   https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
   ```

## ✦ Deployment

For detailed deployment instructions on free hosting platforms like Replit, Railway, or Render, please refer to the [DEPLOYMENT.md](DEPLOYMENT.md) file.

## ✦ Community

Join our growing community to get help, share your creations, suggest features, and connect with other bot enthusiasts:

- **Discord Server**: [discord.gg/marx](https://discord.gg/marx)
- **The Bot Website**: [marsystem.vercel.app](https://marsystem.vercel.app)
- **Mar Services Website**: [marservices.cc](https://marservices.cc)

## ✦ License

This project is available under the MIT License.

<div align="center">
  <p>Created with ♥ by <a href="https://github.com/omaralhami">Mar (Omar Alhami)</a></p>
</div> 