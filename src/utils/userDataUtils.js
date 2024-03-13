const sqlite3 = require("sqlite3").verbose()

const data = new sqlite3.Database('data/manga.db',sqlite3.OPEN_READWRITE,(err)=>{
    if (err) return console.error(err.message);
})

/**
 * Sets time user interacted with manga to current time
 * @param {*} userID: Discord author id of user
 * @param {*} mangaName: Name of manga
 * @returns nothing
 */
async function userInteractTime(userID, mangaName) {
    sql = `UPDATE userData SET interactTime = ?  WHERE userID = ? AND mangaName = ?`
    data.run(sql,[Date.now(),userID,mangaName],(err)=>{
        if (err) return console.error(err.message);
    })
}

module.exports = {
    userInteractTime
};  