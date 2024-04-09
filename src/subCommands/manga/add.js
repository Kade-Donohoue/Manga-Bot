const BaseSubcommandExecutor = require("../../utils/BaseSubCommandExecutor")
const manganato = require("../../utils/puppeteer/manganato/getManga")
const reaper = require("../../utils/puppeteer/reaper/getManga")

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
        if (URL.includes('chapmang')) return manganato.getMangaFull(URL).then(function(data) {
            if (data == -1) {
                interaction.editReply({content: 'An internal system error has occured. Please try again or contact the admin'})
            } else if (data == -2) {
                interaction.editReply({content: 'ChapManganato has been disabled. If you think this is a mistake please contact the admin'})
            } else {
                manganato.setUpChaps(data[0],data[1],data[2],data[3],data[4], authID, URL, userCat)
                interaction.editReply({content: "Added to your list"})
            }
        })
        // if (URL.includes('asura')) asura()
        if (URL.includes('reaperscans')) return reaper.getMangaFull(URL).then(function(data) {
            if (data == -1) { 
                interaction.editReply({content: 'An internal system error has occured. Please try again or contact the admin'})
            } else if (data == -2) {
                interaction.editReply({content: 'Reaper Scans has been disabled. If you think this is a mistake please contact the admin'})
            } else {
                reaper.setUpChaps(data[0],data[1],data[2],data[3],data[4], authID, URL, userCat)
                interaction.editReply({content: "Added to your list"})
            }
        })

        interaction.editReply({content: "Invalid URL"})
    }
}