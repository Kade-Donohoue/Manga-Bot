const getIcon = require("./getIcon")
const puppeteer = require("puppeteer-extra")
const stealthPlugin = require("puppeteer-extra-plugin-stealth")
puppeteer.use(stealthPlugin())
const wildcardMatch = require('wildcard-match');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
const adblocker = AdblockerPlugin({
  blockTrackers: true // default: false
})
puppeteer.use(adblocker)

const sqlite3 = require("sqlite3").verbose()
let sql;
const data = new sqlite3.Database('data/manga.db',sqlite3.OPEN_READWRITE,(err)=>{
    if (err) return console.error(err.message);
})


/**
 * Gets the chapter list from ChapManganato
 * @param url: Chapter URL of a manga from ChapManganato. 
 * @param icon: wether or not to get icon
 * @returns Arry containing 2 items. Index 0 stores an array of chapters. Index 1 stores the Manga's Title, index 2 contions card text for current, index 3 contions card text for next, index 4 contions card text for latest
 */

async function getMangaFull(url, icon = true) {
    try {
        const browser = await puppeteer.launch({headless: "new", devtools: false, ignoreHTTPSErrors: true, //"new"
            args: ['--enable-features=NetworkService', '--no-sandbox', '--disable-setuid-sandbox','--mute-audio']})
        const page = await browser.newPage()
        page.setDefaultNavigationTimeout(5*60*1000) // timeout nav after 5 min
        page.setRequestInterception(true)

        const allowRequests = wildcardMatch(['*manganato*'], {separator: false})
        const blockRequests = wildcardMatch(['*.css*', '*.js*', '*facebook*', '*bidgear*'], {separator: false})
        page.on('request', (request) => {
            const u = request.url()
            if (!allowRequests(u)) {
                request.abort()
                return
            }

            if (request.resourceType() == "image") { 
                request.abort()
                return
            }

            if (blockRequests(u)) {
                request.abort()
                return
            } 
        request.continue()
        })

        await page.goto(url, {waitUntil: 'load', timeout: 5*60*1000})
        page.viewport({width: 960, height: 1040})

        const chapterDropdown = await page.waitForSelector('body > div.body-site > div:nth-child(1) > div.panel-navigation > select')

        const chapters = await chapterDropdown.evaluate(() => Array.from(
            document.querySelectorAll('body > div.body-site > div:nth-child(1) > div.panel-navigation > select > option'),
            a => a.getAttribute('data-c')
        ))

        var chapTitles = await page.$eval('body > div.body-site > div:nth-child(1) > div.panel-navigation > select', node => node.value)
        chapTitles = chapTitles.split(':')
        currentTitle = chapTitles[0]

        try {
            const nextButton = await page.waitForSelector('body > div.body-site > div:nth-child(1) > div.panel-navigation > div > a.navi-change-chapter-btn-next.a-h', 
            {
                waitUntil: 'load',
                timeout: 10
            })
            var chapNext = await nextButton.evaluate(el => el.getAttribute('href'))
            chapNext = chapNext.split('/')
            chapNext = (chapNext[chapNext.length-1].replace("-", " "))
        } catch {
            chapNext = ""
        }

        let urlArgs = url.split("/")
        urlArgs.pop()
        let mangaURL = urlArgs.join("/")

        let chapterList = []
        chapters.forEach((chap) => {
            chapterList.splice(0,0,mangaURL+"/chapter-" + chap.toString())
        })

        const titleSelect = await page.waitForSelector('body > div.body-site > div:nth-child(1) > div.panel-breadcrumb > a:nth-child(3)', 
        {
            waitUntil: 'load',
            timeout: 3000
        })
        let mangaName = await titleSelect.evaluate(el => el.innerText)
        if (mangaName.length > 50) mangaName = mangaName.toString().slice(0,49)+'...'
        // await delay(300000)
        await browser.close()
        if (icon) await getIcon.getMangaIcon(mangaURL, mangaName)

        // console.log(chapterList)
        var tmp = chapterList.slice(-1)
        tmp = tmp[0].split('/').slice(-1)[0]
        latestChapter = tmp.replace("-", " ")
        

        return [chapterList, mangaName, currentTitle, chapNext, latestChapter]
        
    } catch {
        return -1
    }
}
const delay = ms => new Promise(res => setTimeout(res, ms));

/**
 * Saves data to manga.db
 * @param chaps: Chapter URL of a manga from ChapManganato. 
 * @param name: wether or not to get icon
 * @param currentTitle: Text used as current Chapter on cards
 * @param nextTitle: Text used as next Chapter on cards
 * @param latestTitle: Text used as latest Chapter on cards
 * @param authID: ID of user
 * @param URL: URL of the current chapter
 * @param userCat: Category user added manga to
 * @returns nothing but saves data to manga.db
 */
function setUpChaps(chaps, name, currentTitle, nextTitle , latestTitle, authID, URL, userCat){
    if (!nextTitle) nextTitle = latestTitle
    // console.log("name : ")
    // console.log(name)
    // console.log("chaps : ")
    // console.log(chaps)
    // console.log("latest : ")
    // console.log(chaps[chaps.length-1])
    // console.log("User Category: ")
    // console.log(userCat)

    //add Manga
    sql = `SELECT * FROM mangaData WHERE mangaName = ?`;
    data.get(sql,[name], (err, row)=> {
        if (err) return console.error(err.message);
        const currentTime = new Date().toLocaleDateString("en-US", {year: "numeric", month: "numeric", day: "numeric", timeZone: "America/Los_Angeles", timeZoneName: "short", hour: "numeric", minute: "numeric", hour12: true })
        if (!row) {
            // console.log("importing to Global List")
            // interaction.channel.send({content: 'Manga Added to Global List',ephemeral: true})
            sql = `INSERT INTO mangaData (mangaName,list,newest,latestCard,updateTime) VALUES(?,?,?,?,?)`
            data.run(sql,[name,chaps.toString(),chaps[chaps.length-1],latestTitle,currentTime],(err)=>{
                if (err) return console.error(err.message);
            })
        } else {
            // console.log('updating Global List')
            // interaction.channel.send({content: 'Manga Already Added to Global List',ephemeral: true})
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
            // interaction.followUp({content: 'Manga Added To Your List',ephemeral: true})
            sql = `INSERT INTO userData (current, userID, mangaName, currentCard, nextCard, userCat) VALUES(?,?,?,?,?,?)`
            data.run(sql,[URL,authID,name,currentTitle,nextTitle,userCat],(err)=>{
                if (err) return console.error(err.message);
            })
        } else {
            // console.log('updating User List')
            // interaction.followUp({content: 'Manga Already On Your List',ephemeral: true})
            sql = `UPDATE userData SET current = ?, currentCard = ?, nextCard = ?, userCat = ? WHERE userID = ? AND mangaName = ?`
            data.run(sql,[URL,currentTitle,nextTitle,userCat,authID,name],(err)=>{
                if (err) return console.error(err.message);
            })
        }
    })
}


module.exports = {
    getMangaFull,
    setUpChaps
}