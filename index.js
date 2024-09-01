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
  console.log(`Connecté en tant que ${client.user.tag}!`);
});

client.on("messageCreate", async (message) => {
  if (message.content.startsWith("!dm ")) {
    const args = message.content.split(" ").slice(1);
    if (args.length < 2) {
      message.channel.send("Utilisation : `!dm <server_id> <message>`");
      return;
    }

    const guildId = args[0];
    const msgToSend = args.slice(1).join(" ");
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      message.channel.send("Serveur non trouvé.");
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
      message.channel.send("Messages envoyés!");
    } catch (error) {
      console.error(error);
      message.channel.send("Une erreur est survenue lors de la récupération des membres.");
    }
  } else if (message.content.startsWith("!dmall ")) {
    const args = message.content.split(" ").slice(1);
    if (args.length < 1) {
      message.channel.send("Utilisation : `!dmall <message>`");
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
      message.channel.send("Messages envoyés à tous les membres dans tous les serveurs!");
    } catch (error) {
      console.error(error);
      message.channel.send("Une erreur est survenue lors de la récupération des membres.");
    }
  } else if (message.content.startsWith("!addrole ")) {
    const args = message.content.split(" ");
    if (args.length !== 2) {
      message.channel.send("Utilisation : `!addrole <role_id>`");
      return;
    }

    const roleId = args[1];
    if (!excludedRoles.includes(roleId)) {
      excludedRoles.push(roleId);
      saveConfig();
      message.channel.send(`Role ID ${roleId} ajouté à la liste d'exclusion.`);
    } else {
      message.channel.send(
        `Role ID ${roleId} est déjà dans la liste d'exclusion.`
      );
    }
  } else if (message.content.startsWith("!addmember ")) {
    const args = message.content.split(" ");
    if (args.length !== 2) {
      message.channel.send("Utilisation : `!addmember <member_id>`");
      return;
    }

    const memberId = args[1];
    if (!excludedMembers.includes(memberId)) {
      excludedMembers.push(memberId);
      saveConfig();
      message.channel.send(
        `Membre ID ${memberId} ajouté à la liste d'exclusion.`
      );
    } else {
      message.channel.send(
        `Membre ID ${memberId} est déjà dans la liste d'exclusion.`
      );
    }
  } else if (message.content === "!roles") {
    if (excludedRoles.length === 0) {
      message.channel.send("Aucun rôle dans la liste d'exclusion.");
    } else {
      const embed = new EmbedBuilder()
        .setTitle("Rôles Exclus")
        .setDescription(
          excludedRoles.map((roleId) => `<@&${roleId}>`).join("\n")
        )
        .setColor("#FF69B4"); // Couleur rose
      message.channel.send({ embeds: [embed] });
    }
  } else if (message.content === "!members") {
    if (excludedMembers.length === 0) {
      message.channel.send("Aucun membre dans la liste d'exclusion.");
    } else {
      const embed = new EmbedBuilder()
        .setTitle("Membres Exclus")
        .setDescription(
          excludedMembers.map((memberId) => `<@${memberId}>`).join("\n")
        )
        .setColor("#FF69B4"); // Couleur rose
      message.channel.send({ embeds: [embed] });
    }
  } else if (message.content === "!servers") {
    const guilds = client.guilds.cache;
    const embeds = [];
    let embed = new EmbedBuilder().setTitle("Serveurs").setColor("#FF69B4"); // Couleur rose
    let count = 0;

    guilds.forEach((guild) => {
      if (count === 25) {  // Maximum de 25 champs par embed
        embeds.push(embed);
        embed = new EmbedBuilder().setTitle("Serveurs (suite)").setColor("#FF69B4"); // Nouvelle embed si besoin
        count = 0;
      }

      embed.addFields({ name: guild.name, value: `ID: ${guild.id}`, inline: true });
      count++;
    });

    embeds.push(embed); // Pousser le dernier embed dans la liste

    for (const emb of embeds) {
      await message.channel.send({ embeds: [emb] });
    }
  } else if (message.content === "!help") {
    const embed = new EmbedBuilder()
      .setTitle("Aide")
      .setDescription(
        "Commandes disponibles :\n\n`!dm <server_id> <message>` - Envoyer un message direct à tous les membres du serveur spécifié.\n`!dmall <message>` - Envoyer un message direct à tous les membres de tous les serveurs.\n`!addrole <role_id>` - Ajouter un rôle à la liste d'exclusion.\n`!addmember <member_id>` - Ajouter un membre à la liste d'exclusion.\n`!roles` - Lister tous les rôles dans la liste d'exclusion.\n`!members` - Lister tous les membres dans la liste d'exclusion.\n`!servers` - Lister tous les serveurs dans lesquels le bot est présent.\n`!help` - Afficher ce message d'aide."
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
    if (error.code === 50007) {
      console.error(`Impossible d'envoyer un message à ${member.user.tag} (l'utilisateur a désactivé les DMs ou a bloqué le bot).`);
    } else {
      console.error(`Impossible d'envoyer un message à ${member.user.tag} :`, error);
    }
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
