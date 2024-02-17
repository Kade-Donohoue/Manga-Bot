const BaseSubcommandExecutor = require("../../utils/BaseSubCommandExecutor")
const getManga = require("../../utils/puppeteer/manganato/getManga")

module.exports = class mangaBulkAddSubCommand extends BaseSubcommandExecutor {
    constructor(baseCommand, group) {
        super(baseCommand, group, 'bulkadd')
    }

    run(client, interaction) {
        const authID = interaction.member.id
        const URLS = interaction.options.get('manga_url').value.split(",")
        interaction.reply({ content : 'Wait One Moment Please ...', ephemeral: true  })
        loop(0)
 
        function loop(i) {
            var URL = URLS[i]
            
            if (!URL.includes("http")) return
            if (URL.includes('chapmang')) getManga.getMangaFull(URL).then(function(data) {
                if (i < URLS.length -1) {
                    loop(i+1)
                }
                if (data != -1) getManga.setUpChaps(data[0],data[1],data[2],data[3],data[4], authID, URL)
            })
            
        }    

        interaction.followUp("Done!")
    }
}