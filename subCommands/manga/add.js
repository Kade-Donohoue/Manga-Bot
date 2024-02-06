const BaseSubcommandExecutor = require("../../utils/BaseSubCommandExecutor")
const getManga = require("../../utils/puppeteer/manganato/getManga")
const sqlite3 = require("sqlite3").verbose()
const fs = require('fs')
let sql;
const data = new sqlite3.Database('src/data/manga.db',sqlite3.OPEN_READWRITE,(err)=>{
    if (err) return console.error(err.message);
})




module.exports = class mangaAddSubCommand extends BaseSubcommandExecutor {
    constructor(baseCommand, group) {
        super(baseCommand, group, 'add')
    }

    run(client, interaction) {
        // console.log(data)
        const authID = interaction.member.id
        const URL = interaction.options.get('manga_url').value
        var mangaName =''
        var chapTitle = ''
        interaction.deferReply();
        if (!URL.includes("http")) return
        if (URL.includes('chapmang')) getManga.getMangaFull(URL).then(function(data) {
            console.log(data)
            setUpChaps(data[0],data[1],data[2],data[3],data[4])
        })
        // if (URL.includes('asura')) asura()
        // if (URL.includes('reaperscan')) reaperMang()
        

        function setUpChaps(chaps, name, currentTitle, nextTitle , latestTitle){
            // name = name.slice(99)
            console.log("Past URL Check")
            console.log("name : ")
            console.log(name)
            console.log("chaps : ")
            console.log(chaps)
            console.log("latest : ")
            console.log(chaps[chaps.length-1])
        
            //add Manga
            sql = `SELECT * FROM mangaData WHERE mangaName = ?`;
            data.get(sql,[name], (err, row)=> {
                if (err) return console.error(err.message);
                // console.log(row)
                // console.log(!row)
                const currentTime = new Date().toLocaleDateString("en-US", {year: "numeric", month: "numeric", day: "numeric", timeZone: "America/Los_Angeles", timeZoneName: "short", hour: "numeric", minute: "numeric", hour12: true })
                if (!row) {
                    console.log("importing to Global List")
                    interaction.channel.send({content: 'Manga Added to Global List'})
                    sql = `INSERT INTO mangaData (mangaName,list,newest,latestCard,updateTime) VALUES(?,?,?,?,?)`
                    data.run(sql,[name,chaps.toString(),chaps[chaps.length-1],latestTitle,currentTime],(err)=>{
                        if (err) return console.error(err.message);
                    })
                } else {
                    console.log('updating Global List')
                    interaction.channel.send({content: 'Manga Already Added to Global List'})
                    sql = `Update mangaData SET newest = ?, list = ?, latestCard = ?, updateTime = ? WHERE mangaName = ?`;
                    data.run(sql,[chaps[chaps.length-1],chaps.toString(),name,currentTime,latestTitle],(err)=>{
                        if (err) return console.error(err.message);
                    })
                }
            })
        
            //add User Manga
            sql = `SELECT * FROM userData WHERE userID = ? AND mangaName = ?`;
            data.get(sql,[authID, name], (err, row)=> {
                if (err) return console.error(err.message);
                // console.log(row)
                // console.log(!row)
                if (!row) {
                    console.log("newUser")
                    interaction.followUp({content: 'Manga Added To Your List'})
                    sql = `INSERT INTO userData (current, userID, mangaName, currentCard, nextCard) VALUES(?,?,?,?,?)`
                    data.run(sql,[URL,authID,name,currentTitle,nextTitle],(err)=>{
                        if (err) return console.error(err.message);
                    })
                } else {
                    console.log('updating User List')
                    interaction.followUp({content: 'Manga Already On Your List'})
                    sql = `UPDATE userData SET current = ?, currentCard = ?, nextCard = ? WHERE userID = ? AND mangaName = ?`
                    data.run(sql,[URL,currentTitle,nextTitle,authID,name],(err)=>{
                        if (err) return console.error(err.message);
                    })
                }
            })
        }

        // interaction.reply({content: 'Manga add'})
    }
}