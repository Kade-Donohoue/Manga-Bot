const BaseSubcommandExecutor = require("../../utils/BaseSubCommandExecutor");
const sqlite3 = require("sqlite3").verbose();
let sql;
const data = new sqlite3.Database('data/manga.db',sqlite3.OPEN_READWRITE,(err)=>{
    if (err) return console.error(err.message);
})

module.exports = class mangaLatestSubCommand extends BaseSubcommandExecutor {
    constructor(baseCommand, group) {
        super(baseCommand, group, 'latest')
    }

    run(client, interaction) {

        const name = interaction.options.get('title').value
        sql = `SELECT newest FROM mangaData WHERE mangaName = ?`;
        data.get(sql,[name], (err, row)=> {
            if (err) return console.error(err.message);
            if (!row) {
                interaction.reply({content: `This Manga is not on your list!`, ephemeral: true})
                return
            }
            interaction.reply({content: 'The Latest Chapter is : \n' + row.newest, ephemeral: true})
        })


        
    }
}