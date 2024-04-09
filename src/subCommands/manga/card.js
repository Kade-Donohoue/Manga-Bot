const { AttachmentBuilder } = require("discord.js");
const BaseSubcommandExecutor = require("../../utils/BaseSubCommandExecutor");
const sqlite3 = require("sqlite3").verbose();
const { generateCard }  = require('../../../src/utils/cardGenerator')
const dataUtils = require('../../../src/utils/dataUtils')
let sql;
const { refreshSelect }  = require('../../utils/updateManga')
const data = new sqlite3.Database('data/manga.db',sqlite3.OPEN_READWRITE,(err)=>{
    if (err) return console.error(err.message);
})

module.exports = class mangaCardSubCommand extends BaseSubcommandExecutor {
    constructor(baseCommand, group) {
        super(baseCommand, group, 'card')
    }

    async run(client, interaction) {
        const authID = interaction.user.id
        const name = interaction.options.get('title').value
        // refreshSelect(name)

        await interaction.deferReply({ ephemeral: true })
        sql = `SELECT * FROM userData WHERE userID = ? AND mangaName = ?`
        data.get(sql,[authID, name], (err, userRow)=> {
            sql = `SELECT * FROM mangaData WHERE mangaName = ?`
            data.get(sql,[name], (err, mangaRow)=> {
                const latest = mangaRow.latestCard
                const updateTime = mangaRow.updateTime
                const chaps = mangaRow.list.split(",")
                var current = ''
                var next = ''
                if (userRow != undefined) {
                    current = userRow.currentCard
                    next = userRow.nextCard
                } else {
                    current = 'Not Reading'
                    next = chaps[0]

                }
                generateCard(name.toString(), latest, current, next, (chaps.length).toString() + " Chapters", updateTime).then(function(data) {
                    const attach = new AttachmentBuilder(data, { name: `${name}-card.png`})
                    interaction.editReply({ content: "", files: [attach], ephemeral: true})
                    dataUtils.userInteractTime(authID, name)
                })
            })
        })
    }
}