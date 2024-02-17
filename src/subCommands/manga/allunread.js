const BaseSubcommandExecutor = require("../../utils/BaseSubCommandExecutor");
const {hyperlink, hideLinkEmbed, bold, time} = require('discord.js')
const { getUnread }  = require('../../../src/utils/getAllUnread')

module.exports = class mangaAllunreadSubCommand extends BaseSubcommandExecutor {
    constructor(baseCommand, group) {
        super(baseCommand, group, 'allunread')
    }

    async run(client, interaction) {
        const authID = interaction.member.id
        await interaction.reply({ content: bold("New Manga as of " + time(new Date(), "f")), ephemeral: true })
        getUnread(authID).then(async ([names, nextLinks, nextChap, currentChap]) => {
            if (names.length == 0) return interaction.reply({ content: "You have no Unread manga!", ephemeral: true })

            for (let i = 0; i < names.length; i++) {
                interaction.followUp({ content: hideLinkEmbed(hyperlink(names[i] + " " + currentChap[i], nextLinks[i])), ephemeral: true })
            }
        })
    }

}