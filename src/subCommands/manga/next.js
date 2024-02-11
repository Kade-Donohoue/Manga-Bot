const BaseSubcommandExecutor = require("../../utils/BaseSubCommandExecutor");
const sqlite3 = require("sqlite3").verbose();
let sql;
const data = new sqlite3.Database('data/manga.db',sqlite3.OPEN_READWRITE,(err)=>{
    if (err) return console.error(err.message);
})

module.exports = class mangaNextSubCommand extends BaseSubcommandExecutor {
    constructor(baseCommand, group) {
        super(baseCommand, group, 'next')
    }

    run(client, interaction) {
        const authID = interaction.member.id
        const name = interaction.options.get('your_title').value
        sql = `SELECT current FROM userData WHERE userID = ? AND mangaName = ?`;
        data.get(sql,[authID, name], (err, cur)=> {
            if (err) return console.error(err.message);
            if (!cur) {
                interaction.reply({content: `This Manga is not on your list!`, ephemeral: true})
                return
            }
            sql = `SELECT list FROM mangaData WHERE mangaName = ?`;
            data.get(sql,[name], (err, row)=> {
                if (err) return console.error(err.message);
                if (!row) {
                    interaction.reply({content: `This Manga is not on your list!`, ephemeral: true})
                    return
                }
                const chaps=row.list.split(',')
                for (let i = 0; i < chaps.length; i++) {
                    if (!cur) {
                        interaction.reply({content: `That Manga is not an your list!`, ephemeral: true})
                        return
                    }
                    if (chaps[i] == cur.current) {
                        if (!chaps[i+1]) {
                            interaction.reply({content: 'You are at the latest chapter.', ephemeral: true})
                            return
                        }
                        interaction.reply({content: `The Next Chapter of ${name} is: \n ${chaps[i+1]}`, ephemeral: true})
                        
                        return
                    }
                }
                
            })
        })
        // interaction.reply({content: 'Manga Next'})
    }

}