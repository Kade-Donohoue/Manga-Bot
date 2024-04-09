const sqlite3 = require("sqlite3").verbose()

const data = new sqlite3.Database('data/manga.db',sqlite3.OPEN_READWRITE,(err)=>{
    if (err) return console.error(err.message);
})

/**
 * Gets List of users unread Manga
 * @param authID: Authors discord user ID
 * @param userCat: Category to get Manga From, provide nothing to get list from all Categorys
 * @returns 2d array. 0th index has array of names, 1st index has array of next Links, 2nd has Array of Text of the Next chapters, 3rd has array of text of current chapters 
 */
async function getUnread(authID, userCat = '%', sortMethod = 'mangaName', sortOrd = 'ASC') {
    const info = []
    const names = []
    const nextLinks = []
    const nextChap = []
    const currentChap = []
    const currentCat = []

    try {
        const userData = await new Promise((resolve, reject) => {
            const sql = `SELECT * FROM userData WHERE userID = ? AND userCat LIKE ? ORDER BY ${sortMethod} ${sortOrd}`;
            data.all(sql, [authID,userCat], (err, rows) => {
                if (err) console.log(err);
                else resolve(rows);
            });
        });


        // console.log("userData:", userData);

        for (const row of userData) {
            const mangaInfo = await new Promise((resolve, reject) => {
                const sql = `SELECT * FROM mangaData WHERE mangaName = ?`
                data.get(sql, [row.mangaName], (err, mangaInfo) => {
                    if (err) reject(err)
                    else resolve(mangaInfo)
                })
            })

            if (!mangaInfo) {
                console.log("no manga info")
                continue
            }

            const chaps = mangaInfo.list.split(',')
            const name = mangaInfo.mangaName
            for (let i = 0; i < chaps.length; i++) {
                if (chaps[i] == row.current) {
                    if (!chaps[i + 1]) {
                        continue 
                    }
                    info.push({ "name": name, "next": chaps[i + 1], "nextText": row.nextCard, "currentText": row.currentCard })
                    names.push(name)
                    nextLinks.push(chaps[i + 1])
                    currentChap.push(row.currentCard)
                    currentCat.push(row.userCat)
                    nextChap.push(row.nextCard)
                    break
                }
            }
        }

        // console.log(info)
        return [names, nextLinks, nextChap, currentChap, currentCat]
    } catch (error) {
        console.error("Error:", error);
        return [];
    }
}

module.exports = {
    getUnread
};    

