const sqlite3 = require("sqlite3").verbose()

const data = new sqlite3.Database('data/manga.db',sqlite3.OPEN_READWRITE,(err)=>{
    if (err) return console.error(err.message);
})
        
async function getUnread(authID) {
    const info = []
    const names = []
    const nextLinks = []
    const nextChap = []
    const currentChap = []

    try {
        const userData = await new Promise((resolve, reject) => {
            const sql = `SELECT * FROM userData WHERE userID = ?`;
            data.all(sql, [authID], (err, rows) => {
                if (err) reject(err);
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
                        console.log("no save")
                        continue
                    }
                    info.push({ "name": name, "next": chaps[i + 1], "nextText": row.nextCard, "currentText": row.currentCard })
                    names.push(name)
                    nextLinks.push(chaps[i + 1])
                    currentChap.push(row.currentCard)
                    nextChap.push(row.nextCard)
                    break
                }
            }
        }

        console.log(info)
        return [names, nextLinks, nextChap, currentChap]
    } catch (error) {
        console.error("Error:", error);
        return [];
    }
}

async function getNextList(currentURL, mangaName) {
    const info = []
        
    const mangaInfo = await new Promise((resolve, reject) => {
        const sql = `SELECT * FROM mangaData WHERE mangaName = ?`
        data.get(sql, [mangaName], (err, mangaInfo) => {
            if (err) reject(err)
            else resolve(mangaInfo)
        })
    })

    if (!mangaInfo) {
        console.log("no manga info")
        return null
    }

    var chaps = mangaInfo.list.split(',')

    chaps = chaps.slice(chaps.indexOf(currentURL), chaps.length)

    for (const chapURL of chaps) {
        var chap = chapURL.split('/')
        chap = (chap[chap.length-1].replace("-", " "))

        info.push({"label": chap, "value": chapURL})
    }

    const trimmedUnread = info.slice(0,25)
    return trimmedUnread
    
}

module.exports = {
    getUnread, 
    getNextList
};    

