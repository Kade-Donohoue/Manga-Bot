const sqlite3 = require("sqlite3").verbose()
const puppeteer = require("puppeteer-extra")
const stealthPlugin = require("puppeteer-extra-plugin-stealth")
puppeteer.use(stealthPlugin())
const fs = require('fs')
const wildcardMatch = require('wildcard-match');
const getManga = require("./puppeteer/manganato/getManga.js")

const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
const { request } = require("http")
const adblocker = AdblockerPlugin({
  blockTrackers: true // default: false
})
puppeteer.use(adblocker)

let sql;
const data = new sqlite3.Database('data/manga.db',sqlite3.OPEN_READWRITE,(err)=>{
    if (err) return console.error(err.message);
})


async function updateChaps(chaps, name, latestTitle) {
    const currentTime = new Date().toLocaleDateString("en-US", {year: "numeric", month: "numeric", day: "numeric", timeZone: "America/Los_Angeles", timeZoneName: "short", hour: "numeric", minute: "numeric", hour12: true })
    sql = `SELECT * FROM mangaData WHERE mangaName = ?`
    data.get(sql,[name], (err, row)=> {
        if (err) return console.error(err.message);
        if (!row) {
            // console.log("importing to Global List")
            sql = `INSERT INTO mangaData (mangaName,list,newest,latestCard, updateTime) VALUES(?,?,?,?,?)`
            data.run(sql,[name,chaps.toString(),chaps[chaps.length-1],latestTitle,currentTime],(err)=>{
                if (err) return console.error(err.message)
            })
        } else {
            // console.log('updating Global List')
            sql = `Update mangaData SET newest = ?, list = ?, latestCard=?, updateTime=? WHERE mangaName = ?`
            data.run(sql,[chaps[chaps.length-1],chaps.toString(),latestTitle,currentTime,name],(err)=>{
                if (err) return console.error(err.message)
            })
        }
    })
}

/**
 * Changes the category a manga is in for a user
 * @param {*} userID: discord ID of user
 * @param {string} mangaName: Name of the manga
 * @param {string} cat: category to put manga in
 */
async function updateCategory(userID, mangaName, cat) {
    sql = 'Update userData SET userCat = ? WHERE mangaName = ? AND userID = ?'
    data.run(sql, [cat, mangaName, userID], (err) => {
        if (err) return console.error(err.message)
    })
}

async function refreshSelect(mangaName, full = true) {
    await new Promise(async resolve => {
        sql = `SELECT newest FROM mangaData WHERE mangaName = ?`
        data.get(sql,[mangaName], async (err, row)=> {
            if (err) return console.error(err.message)
            if (!row) return
            currentURL = row.newest

            if (!currentURL.includes("http")) return
            if (currentURL.includes('chapmang')) await getManga.getMangaFull(currentURL, full).then((data) => {
                if (data == -1) return
                updateChaps(data[0], data[1], data[4])
        })
            resolve()
            // if (currentURL.includes('asura')) asura(currentURL)
            // if (URL.includes('reaperscan')) reaperMang()
        })
    })
}

function refreshAll() {
    sql = `SELECT mangaName FROM mangaData`;
    data.all(sql,[], async (err, rows)=> {
        if (err) return console.error(err.message)
        if (!rows) return
        const names = rows.map(row => row.mangaName)

        for (let i=0; i<names.length; i++) {
                await refreshSelect(names[i], false)
        }
    })
}

module.exports = {
    refreshSelect,
    refreshAll,
    updateCategory,
}