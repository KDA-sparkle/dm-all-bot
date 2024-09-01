const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const fs = require("fs");
const path = require("path");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const configPath = path.join(__dirname, "config.json");
const config = require(configPath);
const TOKEN = config.token;
let excludedRoles = config.excludedRoles;
let excludedMembers = config.excludedMembers;

// Set to keep track of users who have already been DM'd
const messagedUsers = new Set();

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", async (message) => {
  if (message.content.startsWith("!dm ") || message.content.startsWith("!dmall ")) {
    const args = message.content.split(" ").slice(1);
    const isDmAll = message.content.startsWith("!dmall");

    if ((isDmAll && args.length < 1) || (!isDmAll && args.length < 2)) {
      message.channel.send(`Usage: \`${isDmAll ? '!dmall <message>' : '!dm <server_id> <message>'}\``);
      return;
    }

    const msgToSend = isDmAll ? args.join(" ") : args.slice(1).join(" ");
    const embed = new EmbedBuilder()
      .setTitle("Send Confirmation")
      .setDescription(`Are you sure you want to send the following message as a DM?\n\n**Message:**\n${msgToSend}\n\n*Note: The message will be sent without embed in the DMs.*`)
      .setColor("#FF69B4"); // Pink color

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('confirm')
          .setLabel('Accept')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('cancel')
          .setLabel('Reject')
          .setStyle(ButtonStyle.Danger)
      );

    const confirmationMessage = await message.channel.send({ embeds: [embed], components: [row] });

    const filter = i => i.user.id === message.author.id;
    const collector = confirmationMessage.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 60000 });

    collector.on('collect', async i => {
      if (i.customId === 'confirm') {
        await i.update({ content: 'Message confirmed. Sending...', components: [] });

        if (isDmAll) {
          await sendDMsToAllGuilds(message, msgToSend);
        } else {
          const guildId = args[0];
          const guild = client.guilds.cache.get(guildId);
          if (!guild) {
            message.channel.send("Server not found.");
            return;
          }
          await sendDMsToGuild(message, guild, msgToSend);
        }

        message.channel.send(`${message.author}, the messages have been successfully sent!`);
      } else if (i.customId === 'cancel') {
        await i.update({ content: 'Sending canceled. Please rewrite your message.', components: [] });
      }
    });

    collector.on('end', collected => {
      if (!collected.size) {
        confirmationMessage.edit({ content: "Time expired. Please try again.", components: [] });
      }
    });

  } else if (message.content.startsWith("!addrole ")) {
    const args = message.content.split(" ");
    if (args.length !== 2) {
      message.channel.send("Usage: `!addrole <role_id>`");
      return;
    }

    const roleId = args[1];
    if (!excludedRoles.includes(roleId)) {
      excludedRoles.push(roleId);
      saveConfig();
      message.channel.send(`Role ID ${roleId} added to the exclusion list.`);
    } else {
      message.channel.send(
        `Role ID ${roleId} is already in the exclusion list.`
      );
    }
  } else if (message.content.startsWith("!addmember ")) {
    const args = message.content.split(" ");
    if (args.length !== 2) {
      message.channel.send("Usage: `!addmember <member_id>`");
      return;
    }

    const memberId = args[1];
    if (!excludedMembers.includes(memberId)) {
      excludedMembers.push(memberId);
      saveConfig();
      message.channel.send(
        `Member ID ${memberId} added to the exclusion list.`
      );
    } else {
      message.channel.send(
        `Member ID ${memberId} is already in the exclusion list.`
      );
    }
  } else if (message.content === "!roles") {
    if (excludedRoles.length === 0) {
      message.channel.send("No roles in the exclusion list.");
    } else {
      const embed = new EmbedBuilder()
        .setTitle("Excluded Roles")
        .setDescription(
          excludedRoles.map((roleId) => `<@&${roleId}>`).join("\n")
        )
        .setColor("#FF69B4"); // Pink color
      message.channel.send({ embeds: [embed] });
    }
  } else if (message.content === "!members") {
    if (excludedMembers.length === 0) {
      message.channel.send("No members in the exclusion list.");
    } else {
      const embed = new EmbedBuilder()
        .setTitle("Excluded Members")
        .setDescription(
          excludedMembers.map((memberId) => `<@${memberId}>`).join("\n")
        )
        .setColor("#FF69B4"); // Pink color
      message.channel.send({ embeds: [embed] });
    }
  } else if (message.content === "!servers") {
    const guilds = client.guilds.cache;
    const embeds = [];
    let embed = new EmbedBuilder().setTitle("Servers").setColor("#FF69B4"); // Pink color
    let count = 0;

    guilds.forEach((guild) => {
      if (count === 25) {  // Maximum of 25 fields per embed
        embeds.push(embed);
        embed = new EmbedBuilder().setTitle("Servers (cont.)").setColor("#FF69B4"); // New embed if needed
        count = 0;
      }

      embed.addFields({ name: guild.name, value: `ID: ${guild.id}`, inline: true });
      count++;
    });

    embeds.push(embed); // Push the last embed in the list

    for (const emb of embeds) {
      await message.channel.send({ embeds: [emb] });
    }
  } else if (message.content === "!help") {
    const embed = new EmbedBuilder()
      .setTitle("Help")
      .setDescription(
        "Available commands:\n\n`!dm <server_id> <message>` - Send a direct message to all members of the specified server.\n`!dmall <message>` - Send a direct message to all members of all servers.\n`!addrole <role_id>` - Add a role to the exclusion list.\n`!addmember <member_id>` - Add a member to the exclusion list.\n`!roles` - List all roles in the exclusion list.\n`!members` - List all members in the exclusion list.\n`!servers` - List all servers the bot is in.\n`!help` - Display this help message."
      )
      .setColor("#FF69B4"); // Pink color
    message.channel.send({ embeds: [embed] });
  }
});

async function sendDM(member, msgToSend) {
  if (messagedUsers.has(member.user.id)) {
    console.log(`Message not sent to ${member.user.tag} (ID: ${member.user.id}) because they have already received a message.`);
    return;
  }

  try {
    await member.send(msgToSend);
    console.log(`Message sent to ${member.user.tag} (ID: ${member.user.id}): ${msgToSend}`);
    messagedUsers.add(member.user.id); // Add user to the Set after sending the message
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Pause of 2 seconds between each message
  } catch (error) {
    if (error.code === 50007) {
      console.error(`Cannot send message to ${member.user.tag} (DMs disabled or bot blocked).`);
    } else {
      console.error(`Could not send message to ${member.user.tag}:`, error);
    }
    // Continue even if there's an error
  }
}

async function sendDMsToGuild(message, guild, msgToSend) {
  message.channel.send(`${message.author}, starting to send messages to members of the server ${guild.name}...`);
  try {
    const members = await guild.members.fetch();
    for (const member of members.values()) {
      if (
        !member.user.bot &&
        !member.roles.cache.some((role) => excludedRoles.includes(role.id)) &&
        !excludedMembers.includes(member.id)
      ) {
        await sendDM(member, msgToSend);
      }
    }
    message.channel.send(`${message.author}, the messages have been sent to the members of the server ${guild.name}.`);
  } catch (error) {
    console.error(error);
    message.channel.send(`${message.author}, an error occurred while sending the messages.`);
  }
}

async function sendDMsToAllGuilds(message, msgToSend) {
  message.channel.send(`${message.author}, starting to send messages to all members in all servers...`);
  try {
    for (const guild of client.guilds.cache.values()) {
      await sendDMsToGuild(message, guild, msgToSend);
    }
    message.channel.send(`${message.author}, the messages have been sent to all members in all servers.`);
  } catch (error) {
    console.error(error);
    message.channel.send(`${message.author}, an error occurred while sending the messages.`);
  }
}

function saveConfig() {
  fs.writeFileSync(
    configPath,
    JSON.stringify(
      {
        token: TOKEN,
        excludedRoles: excludedRoles,
        excludedMembers: excludedMembers,
      },
      null,
      2
    )
  );
}

client.login(TOKEN);
