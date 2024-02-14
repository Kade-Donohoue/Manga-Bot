const BaseSubcommandExecutor = require("../../utils/BaseSubCommandExecutor")
const getManga = require("../../utils/puppeteer/manganato/getManga")
const sqlite3 = require("sqlite3").verbose()
const fs = require('fs')
let sql;
const data = new sqlite3.Database('data/manga.db',sqlite3.OPEN_READWRITE,(err)=>{
    if (err) return console.error(err.message);
})




module.exports = class mangaAddSubCommand extends BaseSubcommandExecutor {
    constructor(baseCommand, group) {
        super(baseCommand, group, 'add')
    }

    run(client, interaction) {
        const authID = interaction.member.id
        const URL = interaction.options.get('manga_url').value
        var mangaName =''
        var chapTitle = ''
        interaction.deferReply({ephemeral: true})
        if (!URL.includes("http")) return
        if (URL.includes('chapmang')) getManga.getMangaFull(URL).then(function(data) {
            // console.log(data)
            if (data != -1) getManga.setUpChaps(data[0],data[1],data[2],data[3],data[4], authID, URL)
            interaction.editReply({content: "Added to your list"})
        })
        // if (URL.includes('asura')) asura()
        // if (URL.includes('reaperscan')) reaperMang()
    }
}