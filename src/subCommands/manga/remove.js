const BaseSubcommandExecutor = require("../../utils/BaseSubCommandExecutor");
const sqlite3 = require("sqlite3").verbose();
let sql;
const data = new sqlite3.Database('src/data/manga.db',sqlite3.OPEN_READWRITE,(err)=>{
    if (err) return console.error(err.message);
})

module.exports = class mangaRemoveSubCommand extends BaseSubcommandExecutor {
    constructor(baseCommand, group) {
        super(baseCommand, group, 'remove')
    }

    run(client, interaction) {
        const authID = interaction.member.id
        const name = interaction.options.get('your_title').value
        console.log(name)
        sql = `SELECT current FROM userData WHERE userID = ? AND mangaName = ?`;
        data.get(sql,[authID, name], (err, row)=> {
            if (err) return console.error(err.message);
            console.log(row)
            if (!row) {
                interaction.reply({content: `This Manga is not on your list!`})
                return
            }
            if (row) {
                sql = `DELETE FROM userData WHERE userID = ? AND mangaName = ?`;
                data.run(sql,[authID, name],(err)=>{
                   if (err) return console.error(err.message);
                })
                interaction.reply({content: `The Manga "${name}" has been removed from your list!`})
            } else {
                interaction.reply({content: `This Manga is not on your list!`})
            }
        })
    

    }
}