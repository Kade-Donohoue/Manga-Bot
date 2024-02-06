const BaseSubcommandExecutor = require("../../utils/BaseSubCommandExecutor");
const sqlite3 = require("sqlite3").verbose();
let sql;
const data = new sqlite3.Database('src/data/manga.db',sqlite3.OPEN_READWRITE,(err)=>{
    if (err) return console.error(err.message);
})
var names = []

module.exports = class mangaAllunreadSubCommand extends BaseSubcommandExecutor {
    constructor(baseCommand, group) {
        super(baseCommand, group, 'allunread')
    }

    run(client, interaction) {
        const authID = interaction.member.id
        sql = `SELECT * FROM userData WHERE userID = ?`;
        data.all(sql,[authID], (err, rows)=> {
            if (err) return console.error(err.message);
            if (!rows) {
                interaction.reply({content: `You have no Manga on your list!`})
                return
            }
            console.log(rows)
            
            rows.forEach(row =>{
                console.log(row)
                sql = `SELECT * FROM mangaData WHERE mangaName = ?`;
                data.get(sql,[row.mangaName], (err, list)=> {
                    if (err) return console.error(err.message);
                    if (!list) {
                        return
                    }
                    const chaps=list.list.split(',')
                    for (let i = 0; i < chaps.length; i++) {
                        // console.log(row.current)
                        if (chaps[i] == row.current) {
                            console.log('FOUND')
                            if (!chaps[i+1]) {
                                return
                            }
                            // interaction.reply({content: `The Next Chapter of ${name} is: \n ${chaps[i+1]}`})
                            console.log(chaps[i+1])
                            console.log('NEW')
                            names.push(chaps[i+1])
                            interaction.user.send(chaps[i+1])
                            // console.log(rows[rows.length-1].mangaName)
                            // console.log(list.mangaName)
                            // if (rows[rows.length-1].mangaName == list.mangaName) {
                            //   console.log(names)
                            //   console.log('AOIFHLOSHNEGL:HNSLNLKDGNLKSNJGLSENJGL:KSENGLWEGN')
                            //   if (names.length>0) interaction.reply({content: names.join('\n').toString()})
                            //   else interaction.reply({content: 'Nothing New!'})
                            // }
                            
                            return
                        }
                    }
                    console.log(names)
                    // if (names.length>0) interaction.reply({content: names.join('\n').toString()})
                    // else interaction.reply({content: 'Nothing New!'})
                })
            })
            // console.log(names)
            // if (names.length>0) interaction.reply({content: names.join('\n').toString()})
            interaction.reply({content: '(VERY WIP)!',ephemeral: true })
            
        })
        // interaction.reply({content: 'Manga Next'})
    }

}