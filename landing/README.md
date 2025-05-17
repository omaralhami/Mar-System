# Mar System Bot Landing Page

This directory contains the landing page for the Mar System Discord Bot. The landing page is designed to be simple, modern, and effective at showcasing the bot's features and providing clear calls-to-action for potential users.

## Files Included

- `index.html` - The main HTML file for the landing page
- `styles.css` - CSS styling for the landing page
- `logo.svg` - Vector version of the Mar System logo
- `logo.html` - Tool to convert the SVG logo to PNG
- `README.md` - This documentation file

## Usage Instructions

### Local Development

To preview the landing page locally:

1. Open the `index.html` file in your web browser
2. Make any desired changes to the HTML or CSS files
3. Refresh your browser to see the changes

### Logo Generation

To create the PNG version of the logo:

1. Open `logo.html` in your web browser
2. Click the "Download as PNG" button
3. Save the file as "logo.png" in this directory

### Deployment

To deploy the landing page:

#### Option 1: Static Hosting (Recommended)

1. Upload all files (`index.html`, `styles.css`, `logo.png`) to a static web hosting service like:
   - GitHub Pages
   - Vercel
   - Netlify
   - Firebase Hosting

#### Option 2: Server Deployment

1. Place these files in your web server's public directory
2. Ensure the server is configured to serve HTML files

## Customization

### Colors

The primary colors used are defined in the `:root` section of the CSS file:

```css
:root {
    --primary-color: #5865F2;  /* Discord blue */
    --secondary-color: #2E3136;
    --tertiary-color: #5D63FF;
    --background-color: #0A0A0A;
    --background-accent: #121212;
    /* ...other variables... */
}
```

### Links

Update the following links in the `index.html` file to match your bot's actual URLs:

- Dashboard URL: `https://marsystem.vercel.app/dashboard`
- Bot Invite URL: `https://discord.com/api/oauth2/authorize?client_id=1372449353381187624&permissions=1099511627775&scope=bot%20applications.commands`
- Contact Email: `mailto:contact@marsystem.vercel.app`
- GitHub Repository: `https://github.com/omaralhami/mar-system`
- Support Server: `https://discord.gg/marx`

## Notes

- This landing page is designed to be responsive and work on all device sizes
- The page uses modern CSS features like CSS variables, flexbox, and gradients
- No JavaScript is required for the core functionality of the page 