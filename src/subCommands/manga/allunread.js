const BaseSubcommandExecutor = require("../../utils/BaseSubCommandExecutor");
const {hyperlink, hideLinkEmbed, bold, time} = require('discord.js')
const sqlite3 = require("sqlite3").verbose();
let sql;
const data = new sqlite3.Database('data/manga.db',sqlite3.OPEN_READWRITE,(err)=>{
    if (err) return console.error(err.message);
})
var names = []

module.exports = class mangaAllunreadSubCommand extends BaseSubcommandExecutor {
    constructor(baseCommand, group) {
        super(baseCommand, group, 'allunread')
    }

    run(client, interaction) {
        const authID = interaction.member.id
        interaction.user.send(bold("New Manga as of " + time(new Date(), "f")))
        sql = `SELECT * FROM userData WHERE userID = ?`;
        data.all(sql,[authID], (err, rows)=> {
            if (err) return console.error(err.message);
            if (!rows) {
                interaction.reply({content: `You have no Manga on your list!`, ephemeral: true})
                return
            }
            
            rows.forEach(row =>{
                sql = `SELECT * FROM mangaData WHERE mangaName = ?`;
                data.get(sql,[row.mangaName], (err, mangaInfo)=> {
                    if (err) return console.error(err.message);
                    if (!mangaInfo) {
                        return
                    }
                    const chaps=mangaInfo.list.split(',')
                    const name = mangaInfo.mangaName
                    for (var i = 0; i < chaps.length; i++) {
                        if (chaps[i] == row.current) {
                            if (!chaps[i+1]) {
                                return
                            }
                            // console.log(chaps[i+1])
                            // console.log('NEW')
                            names.push(chaps[i+1])
                            interaction.user.send(hideLinkEmbed(hyperlink(name + " " + row.currentCard, chaps[i+1])))
                            return
                        }
                    }
                    
                    // console.log(names)
                    if (names.length>0) interaction.editReply({content: 'All new manga sent!'})
                    else interaction.editReply({content: 'Nothing New!'})
                })
            })
            interaction.reply({content: '(VERY WIP)!',ephemeral: true })
            
        })
    }

}