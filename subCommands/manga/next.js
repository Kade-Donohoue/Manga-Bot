const BaseSubcommandExecutor = require("../../utils/BaseSubCommandExecutor");
const sqlite3 = require("sqlite3").verbose();
let sql;
const data = new sqlite3.Database('src/data/manga.db',sqlite3.OPEN_READWRITE,(err)=>{
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
                interaction.reply({content: `This Manga is not on your list!`})
                return
            }
            console.log(cur)
            sql = `SELECT list FROM mangaData WHERE mangaName = ?`;
            data.get(sql,[name], (err, row)=> {
                if (err) return console.error(err.message);
                if (!row) {
                    interaction.reply({content: `This Manga is not on your list!`})
                    return
                }
                const chaps=row.list.split(',')
                for (let i = 0; i < chaps.length; i++) {
                    // console.log(chaps)
                    if (!cur) {
                        interaction.reply({content: `That Manga is not an your list!`})
                        return
                    }
                    if (chaps[i] == cur.current) {
                        if (!chaps[i+1]) {
                            interaction.reply({content: 'You are at the latest chapter.'})
                            return
                        }
                        interaction.reply({content: `The Next Chapter of ${name} is: \n ${chaps[i+1]}`})
                        
                        return
                    }
                }
                
            })
        })
        // interaction.reply({content: 'Manga Next'})
    }

}