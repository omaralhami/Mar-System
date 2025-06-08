# Mar System

<div align="center">

![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white) ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)  

**A clean, powerful Discord bot packed with cool features all in one file.**

<div align="center">
  <img src="https://github.com/omaralhami/mar-system/blob/main/landing/logo.png" alt="Mar System Bot" width="600">
</div>

[Join our Discord](https://discord.gg/marx) • [Visit website](https://marsystem.vercel.app)

</div>

---

## What is Mar System?

Simple. It’s a Discord bot with welcome messages, slash commands, embeds, buttons, giveaways, voice controls, and more all easy to use and set up.

---

## Features

- Custom welcome messages with embeds & buttons  
- Slash commands with smooth UI  
- Visual embed editor  
- Interactive buttons  
- Easy giveaways  
- Voice channel join/leave/mute controls  
- Show server rules  

---

## Commands

**General**  
`/ping` - Check if bot is alive  
`/welcome` - Send welcome message  
`/setwelcome` - Pick your welcome channel  
`/rules` - Show server rules  

**Content Creation**  
`/create embed` - Make embeds visually  
`/create buttons` - Add buttons to messages  
`/create poll` - Run polls  
`/send message` - Send custom message  
`/send image` - Send image with caption  

**Giveaways**  
`/giveaway create` - Start giveaways  
`/giveaway end` - End giveaways early  
`/giveaway reroll` - Pick new winners  

**Voice**  
`/voice join` - Bot joins voice channel  
`/voice leave` - Bot leaves voice channel  
`/voice mute/unmute` - Mute/unmute bot  
`/voice deafen/undeafen` - Deafen/undeafen bot  
`/voice status` - Check voice status  

---

## Permissions

- Slash commands: Admins only  
- Buttons & modals: Everyone  

---

## How to setup

1. Clone repo  
```bash
git clone https://github.com/omaralhami/mar-system.git
cd mar-system
```
   
  ```bash
  npm install
  ```

2. Create `.env` file with:

  ```ini
  DISCORD_TOKEN=your_token_here
  CLIENT_ID=your_client_id_here
  ```

 3. Run bot

  ```bash
  node index.js
  ```

  4. Invite bot to your server with this link:

  ```bash
  https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
  ```

## Deployment

Check `DEPLOYMENT.md` for hosting on Replit, Railway, Render, etc.

## Join the community

- Discord: [discord.gg/marx](https://discord.gg/marx)  
- Website: [marsystem.vercel.app](https://marsystem.vercel.app)  
- Mar Services: [marservices.cc](https://marservices.cc)  

## Landing page

The `/landing` folder has a modern landing page auto-deployed to Vercel. Change files there, push, and Vercel updates it.

## License

MIT License

<div align="center">

Made with ❤️ by mar  
> Built with curiosity, caffeine, and late nights.  
Join the [Mar Terminal community](https://discord.gg/marx)

</div>

