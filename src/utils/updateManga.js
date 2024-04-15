const sqlite3 = require("sqlite3").verbose()
const puppeteer = require("puppeteer-extra")
const stealthPlugin = require("puppeteer-extra-plugin-stealth")
puppeteer.use(stealthPlugin())
const fs = require('fs')
const wildcardMatch = require('wildcard-match');
const manganato = require("./puppeteer/manganato/getManga.js")
const reaper = require("./puppeteer/reaper/getManga.js")

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


/**
 * Saves provided manga to the manga database
 * @param {Array} chaps: List of chapter URLS 
 * @param {String} name: Name of the manga
 * @param {String} latestTitle: Texts for the latest chapter on the card
 */
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
async function updateCategory(userID, mangaName, cat = 'unsorted') {
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
            if (currentURL.includes('chapmang')) await manganato.getMangaFull(currentURL, full).then((data) => {
                if (data == -1) return
                if (data == -2) return console.warn('MangaNato was disabled by config but the database contains reaperscans links!!')
                updateChaps(data[0], data[1], data[4])
            })
            if (currentURL.includes('reaperscan')) await reaper.getMangaFull(currentURL, full).then((data) => {
                if (data == -1) return
                if (data == -2) return console.warn('Reaperscans was disabled by config but the database contains reaperscans links!!')
                updateChaps(data[0], data[1], data[4])
            })
            resolve()
            // if (currentURL.includes('asura')) asura(currentURL)
        })
    })
}

/**
 * Force updates all current card text in case something is wrong. 
 */
async function updateAllCurrentText() {
    sql = `SELECT current FROM userData`
    data.all(sql, [], (err, rows) => {
        if (err) return console.error(err.message)
        if (!rows) return

        for (const row of rows) {
            var currentText = row.current.split('/')
            currentText = currentText[currentText.length-1].replace("-", " ")
            console.log(currentText)

            sql = 'UPDATE userData SET currentCard = ? WHERE current = ?'
            data.run(sql, [currentText, row.current],(err)=>{
                if (err) return console.error(err.message);
            })
        }
    })
}

/**
 * Updates all tracked manga's data
 * @param {Boolean} updateCardText: wether or not next chapter text should be updated for all manga
 */
async function refreshAll(updateCardText = true) {
    sql = `SELECT mangaName FROM mangaData`;
    await new Promise((resolve, reject) => {
        data.all(sql,[], async (err, rows)=> {
            if (err) return console.error(err.message)
            if (!rows) return
            const names = rows.map(row => row.mangaName)

            for (let i=0; i<names.length; i++) {
                    await refreshSelect(names[i], false)
            }
            resolve()
        })
    })

    if (updateCardText) {
        sql = `SELECT mangaName, list FROM mangaData`
        data.all(sql, [], async (err, rows) => {
            if (err) return console.error(err.message)
            if (!rows) return
            const info = {}
            for (const row of rows) {
                info[row.mangaName] = row.list
            }

            sql = `SELECT mangaName, current FROM userData`
            data.all(sql, [], async (err, rows) => {
                if (err) return console.error(err.message)
                if (!rows) return
                // console.log(rows)
                for (const row of rows) {
                    const currentList = info[row.mangaName].split(',')
                    var currentIndex = currentList.indexOf(row.current)
                    if (currentIndex+1 >= currentList.length) {
                        currentIndex -= 1
                    }
                    const nextURL = currentList[currentIndex+1]
                    var nextCardText = nextURL.split('/')
                    nextCardText = nextCardText[nextCardText.length-1].replace("-", " ")
                    // console.log(row.mangaName + ": " + nextCardText + '\n\n\n')
                    sql = `UPDATE userData SET nextCard = ?  WHERE mangaName = ? AND current = ?`
                    data.run(sql,[nextCardText, row.mangaName, row.current],(err)=>{
                        if (err) return console.error(err.message);
                    })
                }
            })
        })
    }
}

module.exports = {
    refreshSelect,
    refreshAll,
    updateCategory,
    updateAllCurrentText,
}