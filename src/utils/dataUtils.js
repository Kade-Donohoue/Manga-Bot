const sqlite3 = require("sqlite3").verbose()

const data = new sqlite3.Database('data/manga.db',sqlite3.OPEN_READWRITE,(err)=>{
    if (err) return console.error(err.message);
})

/**
 * Sets time user interacted with manga to current time
 * @param {String} userID: Discord author id of user
 * @param {String} mangaName: Name of manga
 * @returns nothing
 */
async function userInteractTime(userID, mangaName) {
    sql = `UPDATE userData SET interactTime = ?  WHERE userID = ? AND mangaName = ?`
    data.run(sql,[Date.now(),userID,mangaName],(err)=>{
        if (err) return console.error(err.message);
    })
}

/**
 * gets row from provided name from manga Data
 * @param {String} mangaName 
 * @returns dictionary that has the keys mangaName(same as provided name), list(list of chapter URLS), newest(latest chapter url), latestCard(Text for latest on card), updateTime(time for card that is was last updated)
 */
async function getMangaRow(mangaName) {
    sql = `SELECT * FROM mangaData WHERE mangaName = ?`
    const mangaRow = await new Promise((resolve, reject) => {
        data.get(sql, [mangaName], (err, mangaRow) => {
            if (err) console.error(err)
            if (!mangaRow) resolve(-1)
            resolve(mangaRow)
        })
    })
    return mangaRow
}

/**
 * returns lest of next chapters
 * @param {String} currentURL: current URL you are at
 * @param {String} mangaName: name of manga
 * @param {Int} amount: amount to be returned(default 25)
 * @returns array of dictionarys that have key label and key value that has the URL
 */
async function getNextList(currentURL, mangaName, amount = 25) {
    const info = []
        
    const mangaInfo = await new Promise((resolve, reject) => {
        const sql = `SELECT * FROM mangaData WHERE mangaName = ?`
        data.get(sql, [mangaName], (err, mangaInfo) => {
            if (err) reject(err)
            else resolve(mangaInfo)
        })
    })

    if (!mangaInfo) return []

    var chaps = mangaInfo.list.split(',')

    chaps = chaps.slice(chaps.indexOf(currentURL), chaps.length)
    // console.log(currentURL)

    for (const chapURL of chaps) {
        var chap = chapURL.split('/')
        var chapUrlEnd = chap[chap.length-1]
        chap = chap[chap.length-1]
        chap = chap.split('-')

        var check = true
        while (check) {
            if (chap[0].includes('chapter')) {
                check = false
            } else {
                chap.shift()
            }
        }
        chap = chap.join(' ')
        info.push({"label": chap, "value": chapUrlEnd})
    }

    const trimmedUnread = info.slice(0,amount)
    return trimmedUnread
}


module.exports = {
    userInteractTime,
    getMangaRow,
    getNextList
};  