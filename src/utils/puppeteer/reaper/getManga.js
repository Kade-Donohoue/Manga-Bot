// const getIcon = require("./getIcon")
const fs = require('fs')
const config = require('../../../../data/config.json')
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
 * @returns Arry containing 5 items. Index 0 stores an array of chapters. Index 1 stores the Manga's Title, index 2 contions card text for current, index 3 contions card text for next, index 4 contions card text for latest
 */

async function getMangaFull(url, icon = true) {
    console.log(!config.allowReaperScans)
    if (!config.allowReaperScans) return -2

    var urlParts = url.split('/chapters/')

    const mangaPageURL = urlParts[0]

    const browser = await puppeteer.launch({headless: false, devtools: false, ignoreHTTPSErrors: true, //"new"
            args: ['--enable-features=NetworkService', '--no-sandbox', '--disable-setuid-sandbox','--mute-audio'], targetFilter: (target) => !!target.url})
    try {
        const page = await browser.newPage()
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36")
        page.setDefaultNavigationTimeout(5*60*1000) // timeout nav after 5 min
        page.setRequestInterception(true)

        const allowRequests = wildcardMatch(['*reaperscans*', '*cloudflare*'], {separator: false})
        const blockRequests = wildcardMatch(['*.css*', '*facebook*', '*bidgear*', '*.png*', '*.jpg*', '*google*', '*mp4*', '*disqus*'], {separator: false})
        let block = true
        page.on('request', (request) => {
            if (block) {
                // const u = request.url()
                // if (!allowRequests(u)) {
                //     request.abort()
                //     return
                // }

                // if (request.resourceType() == "image") { 
                //     request.abort()
                //     return
                // }

                // if (blockRequests(u)) {
                //     request.abort()
                //     return
                // } 
            }
        request.continue()
        })

        await page.goto(mangaPageURL, {waitUntil: 'load', timeout: 5*60*1000})
        page.viewport({width: 960, height: 1040})

        const delay = ms => new Promise(res => setTimeout(res, ms));

        const image = await page.waitForSelector('::-p-xpath(/html/body/div[1]/main/div[2]/div/div[1]/div/div/div/div[1]/div/img)')
        let mangaName = await image.evaluate(el => el.alt)
        const imageURL = await image.evaluate(el => el.src)

        const paginatorNext = await page.waitForSelector('::-p-aria(Next)')
        // const paginatorNext = await page.waitForSelector(`[wire:click="nextPage('page')"]`)
        console.log(paginatorNext)

        let tryNext = true
        let chapterUrlList = []
        while (tryNext) {
            try {
                console.log('trying next')
                const chapButtonList = await page.waitForSelector('::-p-xpath(/html/body/div[1]/main/div[2]/div/div[3]/div[2]/div/div/ul)')

                let chapters = await chapButtonList.evaluate(() => Array.from(
                    document.querySelectorAll('[class="block transition hover:bg-neutral-800"]'),
                    a => a.getAttribute('href')
                ))

                for (let i = 0; i < chapters.length; i++) {
                    if (!chapters[i].includes(mangaPageURL)) {
                        // console.log("removing " + chapters[i])
                        chapters.splice(i, 1)
                        i--
                    }
                }
                chapterUrlList.push(...chapters)
                await paginatorNext.click()
                await page.waitForNavigation({waitUntil: 'networkidle2'})
                await delay(1000*(getRandomInt(5)+1))
            } catch(err) {
                // console.log(err)
                tryNext = false
            }

            
            
        }
        chapterUrlList.reverse()
        if (mangaName.length > 50) mangaName = mangaName.toString().slice(0,49)+'...' 

        if (icon) {
            block = false
            const icon = await page.goto(imageURL)
            await page.screenshot({
                path: "data/icons/"+mangaName.replace(/[^a-zA-Z]+/g, "")+".png",
                type:"png"
            })
        }

        await browser.close()

        console.log(chapterUrlList)
        const currentChapIndex = chapterUrlList.indexOf(url)
        const currentChapText = sliceCardText(url)
        let nextChapText
        if (currentChapIndex+1 < chapterUrlList.length) {
            nextChapText = sliceCardText(chapterUrlList[currentChapIndex+1])
        } else {
            nextChapText = currentChapText
        }
        console.log(chapterUrlList[chapterUrlList.length-1])
        const latestChapText = sliceCardText(chapterUrlList[chapterUrlList.length-1])

        return [chapterUrlList, mangaName, currentChapText, nextChapText, latestChapText]
    } catch (err) {
        console.log(err)
        await browser.close()
        return -1
    }
}

/**
 * converts url into card text
 * @param {String} url 
 * @returns chapter text for card
 */
function sliceCardText(url) {
    let urlParts = url.split('-')

    let cardText = urlParts.slice(-2).join(' ')
    // console.log(cardText)
    return cardText
}

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
function setUpChaps(chaps, name, currentTitle, nextTitle , latestTitle, authID, URL, userCat = 'unsorted'){
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
            sql = `INSERT INTO userData (current, userID, mangaName, currentCard, nextCard, userCat, interactTime) VALUES(?,?,?,?,?,?,?)`
            data.run(sql,[URL,authID,name,currentTitle,nextTitle,userCat, Date.now()],(err)=>{
                if (err) return console.error(err.message);
            })
        } else {
            // console.log('updating User List')
            // interaction.followUp({content: 'Manga Already On Your List',ephemeral: true})
            sql = `UPDATE userData SET current = ?, currentCard = ?, nextCard = ?, userCat = ?, interactTime = ? WHERE userID = ? AND mangaName = ?`
            data.run(sql,[URL,currentTitle,nextTitle,userCat,Date.now(),authID,name],(err)=>{
                if (err) return console.error(err.message);
            })
        }
    })
}


module.exports = {
    getMangaFull,
    setUpChaps
}