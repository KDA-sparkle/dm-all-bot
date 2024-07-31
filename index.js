const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
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

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", async (message) => {
  if (message.content.startsWith("!dm ")) {
    const args = message.content.split(" ").slice(1);
    if (args.length < 2) {
      message.channel.send("Usage: `!dm <server_id> <message>`");
      return;
    }

    const guildId = args[0];
    const msgToSend = args.slice(1).join(" ");
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      message.channel.send("Guild not found.");
      return;
    }

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
      message.channel.send("Messages sent!");
    } catch (error) {
      console.error(error);
      message.channel.send("An error occurred while fetching members.");
    }
  } else if (message.content.startsWith("!dmall ")) {
    const args = message.content.split(" ").slice(1);
    if (args.length < 1) {
      message.channel.send("Usage: `!dmall <message>`");
      return;
    }

    const msgToSend = args.join(" ");

    try {
      for (const guild of client.guilds.cache.values()) {
        const members = await guild.members.fetch();
        for (const member of members.values()) {
          if (
            !member.user.bot &&
            !member.roles.cache.some((role) =>
              excludedRoles.includes(role.id)
            ) &&
            !excludedMembers.includes(member.id)
          ) {
            await sendDM(member, msgToSend);
          }
        }
      }
      message.channel.send("Messages sent to all members in all servers!");
    } catch (error) {
      console.error(error);
      message.channel.send("An error occurred while fetching members.");
    }
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
        .setColor("#FF69B4"); // Couleur rose
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
        .setColor("#FF69B4"); // Couleur rose
      message.channel.send({ embeds: [embed] });
    }
  } else if (message.content === "!servers") {
    const embed = new EmbedBuilder().setTitle("Servers").setColor("#FF69B4"); // Couleur rose

    for (const guild of client.guilds.cache.values()) {
      try {
        const systemChannel = guild.systemChannel;
        const me = guild.members.me;
        if (
          systemChannel &&
          me &&
          systemChannel.permissionsFor(me).has("CREATE_INSTANT_INVITE")
        ) {
          const invite = await systemChannel.createInvite({
            maxAge: 0,
            maxUses: 1,
          });
          embed.addFields({
            name: guild.name,
            value: `[Join ${guild.name}](${invite.url})`,
          });
        } else {
          embed.addFields({
            name: guild.name,
            value: `No invite link available`,
          });
        }
      } catch (error) {
        console.error(error);
      }
    }

    message.channel.send({ embeds: [embed] });
  } else if (message.content === "!help") {
    const embed = new EmbedBuilder()
      .setTitle("Help")
      .setDescription(
        "Available commands:\n\n`!dm <server_id> <message>` - Send a direct message to all members of the specified server.\n`!dmall <message>` - Send a direct message to all members of all servers.\n`!addrole <role_id>` - Add a role to the exclusion list.\n`!addmember <member_id>` - Add a member to the exclusion list.\n`!roles` - List all roles in the exclusion list.\n`!members` - List all members in the exclusion list.\n`!servers` - List all servers the bot is in.\n`!help` - Display this help message."
      )
      .setColor("#FF69B4"); // Couleur rose
    message.channel.send({ embeds: [embed] });
  }
});

async function sendDM(member, msgToSend) {
  try {
    await member.send(msgToSend);
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Pause de 2 secondes entre chaque message
  } catch (error) {
    console.error(`Could not send message to ${member.user.tag}:`, error);
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
