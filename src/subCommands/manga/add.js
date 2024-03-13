const BaseSubcommandExecutor = require("../../utils/BaseSubCommandExecutor")
const getManga = require("../../utils/puppeteer/manganato/getManga")

module.exports = class mangaAddSubCommand extends BaseSubcommandExecutor {
    constructor(baseCommand, group) {
        super(baseCommand, group, 'add')
    }

    async run(client, interaction) {
        const authID = interaction.user.id
        const URL = interaction.options.get('manga_url').value
        const userCat = interaction.options.getString('category') ?? 'unsorted'
        await interaction.deferReply({ephemeral: true})
        if (!URL.includes("http")) return interaction.editReply({content: "Invalid URL"})
        if (URL.includes('chapmang')) return getManga.getMangaFull(URL).then(function(data) {
            if (data != -1) getManga.setUpChaps(data[0],data[1],data[2],data[3],data[4], authID, URL, userCat)
            interaction.editReply({content: "Added to your list"})
        })
        // if (URL.includes('asura')) asura()
        // if (URL.includes('reaperscan')) reaperMang()

        interaction.editReply({content: "Invalid URL"})
    }
}