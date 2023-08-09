const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Profileicons extends Command {
  constructor(...args) {
    super(...args, {
      description: "edit your lineup of profile icons!",
      usage: "profileicon <set> <position> <icon_key>",
      guildOnly: true,
      aliases: ["profileicons"],
      extendedHelp: [
        "Use on to turn the message on and include arguments after, or use off to turn it off without any arguments after.",
        "#channel is a channel mention of where you want welcome messages to be sent.",
        "Message is the message you want sent on welcome. You may use these variables:",
        "{name} for the username.",
        "{mention} for mentioning the user.",
        "{members} for current member count.",
        "{server} for server name."
      ].join("\n"),
    });
  }
  
  async run(ctx) {
    const iconKeys = {
      blobdancing: "<a:blobdancing:1136116026711490610>",
      catvibe: "<a:catvibe:1136116029370671225>",
      clown: "<a:clown:1136116030691876965>",
      crying: "<a:crying:1136116032243769477>",
      popcorn: "<a:eatingpopcorn:1136116034663882784>",
      explode: "<a:explode:1136116035968319618>",
      fire: "<a:fire:1136116038149357678>",
      headpat: "<a:headpat:1136116039390859367>",
      lewd: "<:lewd:1136116040514945136>",
      pls: "<a:pls:1136116042352033982>",
      wavy: "<a:wavy:1136116048983248946>",
      sleepy: "<a:sleepy:1136116044176576572>",

    }
    const userData = await this.client.syncUserSettings(ctx.author.id);
    if (!userData.icons) {
      userData.icons = [];
      await this.client.userUpdate(ctx.author.id, userData);
    }
    const slotCount = Math.ceil((userData.level + 1) / 5);
    let option = ctx.rawArgs.split(" ")[0];
    
    if (option) option = option.toLowerCase();
    else {
      let icons = '';
      for (let i = 0; i < slotCount; i++) {
        icons += userData.icons[i] ? `${userData.icons[i]} ` : `${emojis.profileicon_blank} `;
      }

      icons += `:lock:`;
      const embed = this.client.embed(ctx.author)
        .setTitle("Profile Icons")
        .setDescription(`**Your Icons:**\n${icons}\n\n:closed_lock_with_key: Unlock the next profile icon slot at level **${slotCount * 5}**.\n\nNeed some help figuring out this command? Run \`uwu profileicon help\`.`)
        .setThumbnail("https://cdn.discordapp.com/attachments/520734295112024064/1136078616661348472/849417442471706684.gif");
      return ctx.reply({ embeds: [embed] });
    }

    
    if (option === "set" || option === "edit") {
      const args = ctx.rawArgs.split(" ");
      let index = parseInt(args[1]);
      if (isNaN(index)) {
        return ctx.reply(`Invalid index provided! For more info on how to use this command, run \`uwu profileicon help\`. ${emojis.failure}`);
      } else if (userData.level < (index - 1) * 5) {
        return ctx.reply(`You haven't unlocked this icon slot! You can only edit ${Math.floor(userData.level / 5) === 0 ? `slot **1**.` : `slots **1-${slotCount}**.`}\n\nFor more info on how to use this command, run \`uwu profileicon help\`. ${emojis.failure}`);
      }
      let iconKey = args[2];
      if (!Object.keys(iconKeys).includes(iconKey)) {
        return ctx.reply(`Invalid icon key provided! For a list of currently valid keys, run \`uwu profileicon list\`. ${emojis.failure}`);
      }
      userData.icons[index - 1] = iconKeys[iconKey];
      await this.client.userUpdate(ctx.author.id, userData);
      ctx.reply(`You have successfully updated the icon in slot **${index}**. Check it out by running \`uwu profile\`!${emojis.success}`);
    } else if (option === "remove" || option === "delete") {
      const args = ctx.rawArgs.split(" ");
      let index = parseInt(args[1]);
      if (isNaN(index)) {
        return ctx.reply(`Invalid index provided! For more info on how to use this command, run \`uwu profileicon help\`. ${emojis.failure}`);
      } else if (userData.level < (index - 1) * 5) {
        return ctx.reply(`You haven't unlocked this icon slot! You can only edit ${Math.floor(userData.level / 5) === 0 ? `slot **1**.` : `slots **1-${slotCount}**.`}\n\nFor more info on how to use this command, run \`uwu profileicon help\`. ${emojis.failure}`);
      }
      if (!userData.icons[index]?.length) {
        return ctx.reply(`The icon at slot **${index}** is already blank.\n\nFor more info on how to use this command, run \`uwu profileicon help\`. ${emojis.failure}`)
      }
      userData.icons[index - 1] = "";
      await this.client.userUpdate(ctx.author.id, userData);
    } else if (option === "list" || option === "listicons") {
      let iconList = "";
      for (const key of Object.keys(iconKeys)) {
        iconList += `${key}: ${iconKeys[key]}\n`;
      }
      iconList += "\nWe are constantly adding more icons! If you have a suggestion, join [the official uwu bot server](https://discord.gg/vCMEmNJ) to let us know!";
      const embed = this.client.embed(ctx.author)
        .setTitle("List of Icons")
        .setDescription(iconList)
      return ctx.reply({ embeds: [embed] });
    } else if (option === "help") {
      const embed = this.client.embed(ctx.author)
      .setTitle(`Profile Icon System`)
      .setDescription(`Spice up your profile with customized icons!

${emojis.shiningarrow} You start with one icon slot, and unlock an additional one every 5 levels, starting at level 5. You have **${slotCount}** ${slotCount === 1 ? "slot" : "slots"} available.

${emojis.shiningarrow} You can check your current icon lineup by running \`uwu profile\`. 
${emojis.shiningarrow} ${emojis.shiningarrow} A blank slot that you can edit is labeled with a blank emoji ${emojis.profileicon_blank}.
${emojis.shiningarrow} ${emojis.shiningarrow} A blank slot that you will unlock soon is labeled with a lock emoji :lock:.

${emojis.shiningarrow} In order to edit your icons, you first need to know the list of available icons and their keys. Run \`uwu profileicon list\` for this list. 

${emojis.shiningarrow} Find the desirable emoji you want as your icon and remember the key (the name to its left) from the list.

${emojis.shiningarrow} You also need to know the index of the slot you want to change. The leftmost slot has index 1, and it increases by 1.

${emojis.shiningarrow} Run \`uwu profileicon edit [index] [icon key]\` to set your icon.

${emojis.shiningarrow} Run \`uwu profileicon remove [index]\` if you no longer want your icon and want to revert it to the blank space ${emojis.profileicon_blank}.

If you have any other questions, please join the [official uwu bot server](https://discord.gg/vCMEmNJ)!
`)
        .setTimestamp()
        .setColor(0x9590EE);
      return ctx.reply({ embeds: [embed] });
    }
    else {
      return ctx.reply(`Invalid usage of command. Use \`uwu profileicon help\` for details. ${emojis.failure}`)
    }
  
  }
}

module.exports = Profileicons;
