Certainly! Here is a detailed README file for the "DM All" bot, incorporating your name and the necessary instructions.

---

# DM All Bot by Sparkle / KDA_Delta (Discord)

This Discord bot, created by Sparkle / KDA_Delta, allows you to send direct messages to all members in your servers, manage exclusions, and provide server information. This project is intended for educational purposes only. Use it responsibly.

## Prerequisites

Before you begin, ensure you have the following software installed on your machine:

- **Node.js** (v14 or higher): [Download Node.js](https://nodejs.org/)
- **Git**: [Download Git](https://git-scm.com/)

## Getting Started

### Step 1: Clone the Repository

First, clone the repository from GitHub to your local machine. Open your terminal and run:

```sh
git clone https://github.com/KDA-sparkle/dm-all-bot.git
cd dm-all-bot
```

### Step 2: Install Dependencies

Navigate to the project directory and install the required Node.js modules:

```sh
npm install
```

### Step 3: Create a Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click on **New Application**.
3. Name your application and click **Create**.

### Step 4: Create a Bot

1. In your application, go to the **Bot** tab.
2. Click on **Add Bot** and confirm.
3. Copy the **token**. You'll need this in the next step.

### Step 5: Configure the Bot

Create a `config.json` file in the root of your project directory with the following content:

```json
{
  "token": "YOUR_BOT_TOKEN",
  "excludedRoles": [],
  "excludedMembers": []
}
```

Replace `"YOUR_BOT_TOKEN"` with the token you copied in the previous step.

### Step 6: Enable Privileged Gateway Intents

In the **Bot** tab, scroll down to **Privileged Gateway Intents** and enable the following intents:

- **Presence Intent**
- **Server Members Intent**
- **Message Content Intent**

Click **Save Changes**.

### Step 7: Invite the Bot to Your Server

1. In the **OAuth2** tab, go to **OAuth2 URL Generator**.
2. Under **Scopes**, select `bot`.
3. Under **Bot Permissions**, select the permissions your bot will need (e.g., `Send Messages`, `Read Message History`).
4. Copy the generated URL and open it in your browser to invite the bot to your server.

### Step 8: Run the Bot

Run the bot using the following command:

```sh
node index.js
```

## Commands

- **`!dm <server_id> <message>`**: Send a direct message to all members of the specified server, except those in the exclusion list.
- **`!dmall <message>`**: Send a direct message to all members in all servers, except those in the exclusion list.
- **`!addrole <role_id>`**: Add a role to the exclusion list.
- **`!addmember <member_id>`**: Add a member to the exclusion list.
- **`!roles`**: List all roles in the exclusion list.
- **`!members`**: List all members in the exclusion list.
- **`!servers`**: List all servers the bot is in, with clickable invite links if available.
- **`!help`**: Display help information with available commands.

## Disclaimer

This project is intended for educational purposes only. The creator, Sparkle / KDA_Delta, is not responsible for any misuse of the bot or any actions taken with it. Use this code responsibly and respect Discord's terms of service.

---

### Example `package.json`

Ensure your `package.json` includes the following dependencies:

```json
{
  "name": "dm-all-bot",
  "version": "1.0.0",
  "description": "A Discord bot for educational purposes",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "discord.js": "^14.0.0",
    "fs": "0.0.1-security",
    "path": "^0.12.7"
  }
}
```

## License

This project is licensed under the MIT License.

By following this guide, you will be able to set up and run the Discord bot successfully. Make sure to review and understand the code and the Discord API guidelines to use the bot responsibly.
