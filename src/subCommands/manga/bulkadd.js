const BaseSubcommandExecutor = require("../../utils/BaseSubCommandExecutor")
const getManga = require("../../utils/puppeteer/manganato/getManga")
const {hyperlink, hideLinkEmbed} = require('discord.js')

module.exports = class mangaBulkAddSubCommand extends BaseSubcommandExecutor {
    constructor(baseCommand, group) {
        super(baseCommand, group, 'bulkadd')
    }

    async run(client, interaction) {
        const authID = interaction.user.id
        const URLS = interaction.options.get('manga_url').value.split(",")
        const userCat = interaction.options.get('category').value
        await interaction.reply({ content : 'This will take a minute please wait...', ephemeral: true  })
        loop(0)

        function loop(i) {
            var URL = URLS[i]
            
            if (!URL.includes("http")) return
            if (URL.includes('chapmang')) getManga.getMangaFull(URL).then(function(data) {
                if (data == -1) interaction.followUp({content: `Invalid URL: \n${hideLinkEmbed(hyperlink(URL))}`, ephemeral: true})
                if (data != -1) getManga.setUpChaps(data[0],data[1],data[2],data[3],data[4], authID, URL, userCat)
                if (i < URLS.length -1) {
                    loop(i+1)
                } else {
                    interaction.editReply("Done!")
                }
            })
            
        }    

        
    }
}