const BaseSubcommandExecutor = require("../../utils/BaseSubCommandExecutor");
const sqlite3 = require("sqlite3").verbose();
let sql;
const data = new sqlite3.Database('data/manga.db',sqlite3.OPEN_READWRITE,(err)=>{
    if (err) return console.error(err.message);
})

module.exports = class mangaRemoveSubCommand extends BaseSubcommandExecutor {
    constructor(baseCommand, group) {
        super(baseCommand, group, 'remove')
    }

    run(client, interaction) {
        const authID = interaction.user.id
        const name = interaction.options.get('your_title').value
        sql = `SELECT current FROM userData WHERE userID = ? AND mangaName = ?`;
        data.get(sql,[authID, name], (err, row)=> {
            if (err) return console.error(err.message);
            if (!row) {
                interaction.reply({content: `This Manga is not on your list!`, ephemeral: true})
                return
            }
            if (row) {
                sql = `DELETE FROM userData WHERE userID = ? AND mangaName = ?`;
                data.run(sql,[authID, name],(err)=>{
                   if (err) return console.error(err.message);
                })
                interaction.reply({content: `The Manga "${name}" has been removed from your list!`, ephemeral: true})
            } else {
                interaction.reply({content: `This Manga is not on your list!`, ephemeral: true})
            }
        })
    

    }
}