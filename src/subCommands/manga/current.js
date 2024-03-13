const BaseSubcommandExecutor = require("../../utils/BaseSubCommandExecutor");
const sqlite3 = require("sqlite3").verbose();
const userDataUtils = require('../../../src/utils/userDataUtils')
let sql;
const data = new sqlite3.Database('data/manga.db',sqlite3.OPEN_READWRITE,(err)=>{
    if (err) return console.error(err.message);
})

module.exports = class mangaCurrentSubCommand extends BaseSubcommandExecutor {
    constructor(baseCommand, group) {
        super(baseCommand, group, 'current')
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
                interaction.reply({content: `The chapter you currently are on on ${name} is : \n ${row.current}`, ephemeral: true})
            } else {
                interaction.reply({content: `This Manga is not on your list!`, ephemeral: true})
            }
            
        })
        userDataUtils.userInteractTime(authID, name)
    

    }
}