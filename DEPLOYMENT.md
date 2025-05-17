# Mar System Bot Deployment Guide

This guide will help you deploy your Mar System bot to various free hosting platforms.

## Pre-Deployment Checklist

1. ✓ Added administrator permission checks to all commands
2. ✓ Removed your actual token from the code (using .env file)
3. ✓ Added keep_alive.js for web server functionality
4. ✓ Updated package.json with all dependencies

## Option 1: Replit (Easiest)

1. **Create a Replit account** at [replit.com](https://replit.com)

2. **Create a new Node.js Repl**:
   - Click "Create Repl"
   - Select "Node.js" as template
   - Name your project "mar-system-bot"

3. **Upload your files**:
   - Click on the three dots next to "Files" in the sidebar
   - Select "Upload file" and upload all your project files
   - Or use the "Version Control" tab to import from GitHub

4. **Set up environment variables**:
   - Click on "Secrets" (lock icon) in the Tools section
   - Add your bot token as `DISCORD_TOKEN`
   - Add your client ID as `CLIENT_ID`

5. **Install dependencies**:
   - Replit will automatically install dependencies from package.json

6. **Run your bot**:
   - Click the "Run" button at the top

7. **Keep your bot online 24/7**:
   - Set up [UptimeRobot](https://uptimerobot.com) to ping your Repl URL every 5 minutes
   - Add a new HTTP(s) monitor in UptimeRobot
   - Set the URL to your Repl's web address (found in the webview tab)
   - Set the monitoring interval to 5 minutes

## Option 2: Railway

1. **Create a Railway account** at [railway.app](https://railway.app) (sign up with GitHub)

2. **Create a new project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account and select your bot's repository

3. **Set environment variables**:
   - Go to your project settings
   - Click on "Variables"
   - Add `DISCORD_TOKEN` and `CLIENT_ID` with your bot's values

4. **Deploy your bot**:
   - Railway will automatically deploy your bot when you push changes to GitHub

## Option 3: Render

1. **Create a Render account** at [render.com](https://render.com)

2. **Create a new web service**:
   - Click "New" > "Web Service"
   - Connect your GitHub repository or use the "Public Git repository" option
   - Enter your repository URL

3. **Configure your service**:
   - Name: "mar-system-bot"
   - Environment: "Node"
   - Build Command: `npm install`
   - Start Command: `node index.js`
   - Select the free plan

4. **Set environment variables**:
   - Add `DISCORD_TOKEN` and `CLIENT_ID` in the "Environment" section

5. **Deploy**:
   - Click "Create Web Service"

## Troubleshooting

- **Bot goes offline frequently**: Make sure your keep-alive system is working properly
- **Commands not registering**: Check that your bot has the proper intents and permissions
- **Permission errors**: Ensure your bot has the necessary permissions in your Discord server

## Security Notes

- Your bot is now configured to only allow users with Administrator permissions to use slash commands
- Button interactions and modal submissions can be used by all users
- Never commit your bot token to GitHub or share it publicly
- Regularly rotate your bot token if you suspect it may have been compromised

## Updating Your Bot

1. Make changes to your code locally
2. Test thoroughly before deploying
3. Push changes to GitHub (if using Railway or Render)
4. For Replit, upload the changed files directly 