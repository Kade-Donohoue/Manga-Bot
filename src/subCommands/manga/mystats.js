const { AttachmentBuilder } = require("discord.js");
const BaseSubcommandExecutor = require("../../utils/BaseSubCommandExecutor");
const sqlite3 = require("sqlite3").verbose();
const { generateUserStatCard }  = require('../../../src/utils/cardGenerator')
let sql;
const data = new sqlite3.Database('data/manga.db',sqlite3.OPEN_READWRITE,(err)=>{
    if (err) return console.error(err.message);
})

module.exports = class mangaMyStatSubCommand extends BaseSubcommandExecutor {
    constructor(baseCommand, group) {
        super(baseCommand, group, 'mystats')
    }

    async run(client, interaction) {
        const authID = interaction.member.id
        const currentTime = new Date().toLocaleDateString("en-US", {year: "numeric", month: "numeric", day: "numeric", timeZone: "America/Los_Angeles", timeZoneName: "short", hour: "numeric", minute: "numeric", hour12: true })
    
        await interaction.deferReply({ ephemeral: true })
        console.log(interaction.member.user.globalName)
        sql = `SELECT * FROM userData WHERE userID = ?`
        data.all(sql, [authID], async (err, userRow) => {
            var chaptersRead = 0
            var chaptersUnread = 0
            var mangasUnread = 0
    
            const mangaQueries = userRow.map(async (userData) => {
                sql = `SELECT * FROM mangaData WHERE mangaName = ?`
                const mangaRow = await new Promise((resolve, reject) => {
                    data.get(sql, [userData.mangaName], (err, result) => {
                        if (err) reject(err);
                        resolve(result);
                    });
                });
    
                const mangaChaps = mangaRow.list.split(",")
                const chapIndex = mangaChaps.indexOf(userData.current)
                chaptersRead += chapIndex + 1
                chaptersUnread += mangaChaps.length - chapIndex
    
                if (mangaRow.newest != userData.current) mangasUnread++
            });
            await Promise.all(mangaQueries);
    
            generateUserStatCard(interaction.member.user.globalName, `${userRow.length} Manga`, `${chaptersRead} Chapters`, `${mangasUnread} Manga`, `${chaptersUnread} Chapters`, currentTime).then(function(data) {
                const attach = new AttachmentBuilder(data, { name: `${interaction.member.username}-card.png`})
                interaction.editReply({ content: "", files: [attach], ephemeral: true})
            })
        })
    }
}

async function getManga(name, currentURL) {
    console.log("STARRRRRRRRRTY")
    sql = `SELECT * FROM mangaData WHERE mangaName = ?`
    await data.get(sql, [name], (err, mangaRow) => {
        if (err) return [0,0,0]
        // console.log(mangaRow)
        // console.log(mangaRow.mangaName)
        const mangaChaps = mangaRow.list.split(",")
        // console.log(mangaChaps)
        const chapIndex = mangaChaps.indexOf(currentURL)
        console.log(chapIndex)
        const chaptersRead = chapIndex+1
        console.log(chaptersRead)
        const chaptersUnread = mangaChaps.length-chapIndex
        
        console.log("YEEEEEESSSSSSSS")
        if (mangaChaps[-1] != currentURL) return [chaptersRead, chaptersUnread, 0]
        return [chaptersRead, chaptersUnread, 1]
    })
    
}