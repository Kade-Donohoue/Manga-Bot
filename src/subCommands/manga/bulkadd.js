const BaseSubcommandExecutor = require("../../utils/BaseSubCommandExecutor")
const manganato = require("../../utils/puppeteer/manganato/getManga")
const reaper = require("../../utils/puppeteer/reaper/getManga")
const {hyperlink, hideLinkEmbed} = require('discord.js')

module.exports = class mangaBulkAddSubCommand extends BaseSubcommandExecutor {
    constructor(baseCommand, group) {
        super(baseCommand, group, 'bulkadd')
    }

    async run(client, interaction) {
        const authID = interaction.user.id
        const URLS = interaction.options.get('manga_url').value.split(",")
        const userCat = interaction.options.getString('category') ?? 'unsorted'
        await interaction.reply({ content : 'This will take a minute please wait...', ephemeral: true  })

        for (let i = 0; i < URLS.length; i++) {
            const URL = URLS[i]
            await new Promise(async (resolve, reject) => {
                console.log(URL)
                
                if (!URL.includes("http")) reject()
                else if (URL.includes('chapmang')) {
                    const data = await manganato.getMangaFull(URL)
                    if (data == -1) interaction.followUp({content: 'An internal system error has occured. Please try again or contact the admin', ephemeral: true})
                    else if (data == -2) interaction.editReply({content: 'ChapManganato has been disabled. If you think this is a mistake please contact the admin', ephemeral: true})
                    else manganato.setUpChaps(data[0],data[1],data[2],data[3],data[4], authID, URL, userCat)
                    resolve()
                }
                else if (URL.includes('reaperscans')) {
                    const data = await reaper.getMangaFull(URL)
                    if (data == -1) interaction.followUp({content: 'An internal system error has occured. Please try again or contact the admin', ephemeral: true})
                    else if (data == -2) interaction.followUp({content: 'Reaper Scans has been disabled. If you think this is a mistake please contact the admin', ephemeral: true})
                    else reaper.setUpChaps(data[0],data[1],data[2],data[3],data[4], authID, URL, userCat)   
                    resolve()
                }
            }).catch ( () => {
                interaction.followUp({content: `Invalid URL: \n${hideLinkEmbed(hyperlink(URL))}`, ephemeral: true})
            })
        }    

        interaction.editReply("Done!")
  
    }
}