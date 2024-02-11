const BaseSubcommandExecutor = require("../../utils/BaseSubCommandExecutor")
const sqlite3 = require("sqlite3").verbose()
const getManga = require("../../utils/puppeteer/manganato/getManga")
const puppeteer = require("puppeteer-extra")
const stealthPlugin = require("puppeteer-extra-plugin-stealth")
puppeteer.use(stealthPlugin())
const fs = require('fs')

const webp = require('webp-converter');
const Jimp = require('jimp');

const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
const adblocker = AdblockerPlugin({
  blockTrackers: true
})
puppeteer.use(adblocker)

let sql;
const data = new sqlite3.Database('data/manga.db',sqlite3.OPEN_READWRITE,(err)=>{
    if (err) return console.error(err.message);
})




module.exports = class mangaBulkAddSubCommand extends BaseSubcommandExecutor {
    constructor(baseCommand, group) {
        super(baseCommand, group, 'bulkadd')
    }

    run(client, interaction) {
        const authID = interaction.member.id
        const URLS = interaction.options.get('manga_url').value.split(",")
        interaction.reply({ content : 'Wait One Moment Please ...', ephemeral: true  })
        loop(0)
 
        function loop(i) {
            var URL = URLS[i]
            
            if (!URL.includes("http")) return
            if (URL.includes('chapmang')) getManga.getMangaFull(URL).then(function(data) {
                if (i < URLS.length -1) {
                    loop(i+1)
                }
                if (data != -1) setUpChaps(data[0],data[1],data[2],data[3],data[4], URL)
            })
            
        }    

        // interaction.followUp("Done!")

        function setUpChaps(chaps, name, currentTitle, nextTitle , latestTitle, URL){
            // console.log("name : ")
            // console.log(name)
            // console.log("chaps : ")
            // console.log(chaps)
            // console.log("latest : ")
            // console.log(chaps[chaps.length-1])


            const currentTime = new Date().toLocaleDateString("en-US", {year: "numeric", month: "numeric", day: "numeric", timeZone: "America/Los_Angeles", timeZoneName: "short", hour: "numeric", minute: "numeric", hour12: true })
            //add Manga
            sql = `SELECT * FROM mangaData WHERE mangaName = ?`;
            data.get(sql,[name], (err, row)=> {
                if (err) return console.error(err.message);
                if (!row) {
                    // console.log("importing to Global List")
                    sql = `INSERT INTO mangaData (mangaName,list,newest,latestCard,updateTime) VALUES(?,?,?,?,?)`
                    data.run(sql,[name,chaps.toString(),chaps[chaps.length-1],latestTitle, currentTime],(err)=>{
                        if (err) return console.error(err.message);
                    })
                } else {
                    // console.log('updating Global List')
                    sql = `Update mangaData SET newest = ?, list = ?, latestCard = ?, updateTime = ? WHERE mangaName = ?`;
                    data.run(sql,[chaps[chaps.length-1],chaps.toString(),latestTitle,currentTime,name],(err)=>{
                        if (err) return console.error(err.message);
                    })
                }
            })
        
            //add User Manga
            sql = `SELECT * FROM userData WHERE userID = ? AND mangaName = ?`;
            data.get(sql,[authID, name], (err, row)=> {
                if (err) return console.error(err.message);
                if (!row) {
                    // console.log("Importing to User List")
                    sql = `INSERT INTO userData (current, userID, mangaName, currentCard, nextCard) VALUES(?,?,?,?,?)`
                    data.run(sql,[URL,authID,name,currentTitle,nextTitle],(err)=>{
                        if (err) return console.error(err.message);
                    })
                } else {
                    // console.log('updating User List')
                    sql = `UPDATE userData SET current = ?, currentCard = ?, nextCard = ? WHERE userID = ? AND mangaName = ?`
                    data.run(sql,[URL,currentTitle,nextTitle,authID,name],(err)=>{
                        if (err) return console.error(err.message);
                    })
                }
            })
        }
    }
}