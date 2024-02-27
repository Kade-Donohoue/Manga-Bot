const sqlite3 = require("sqlite3").verbose()
const puppeteer = require("puppeteer-extra")
const stealthPlugin = require("puppeteer-extra-plugin-stealth")
puppeteer.use(stealthPlugin())
const fs = require('fs')
const wildcardMatch = require('wildcard-match');

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



async function chapMang(currentURL) {
    const browser = await puppeteer.launch({headless: "new", devtools: false, ignoreHTTPSErrors: true,
        args: ['--enable-features=NetworkService', '--no-sandbox', '--disable-setuid-sandbox'
    ]}) //change to true Once testing complete
    const page = await browser.newPage()
    await page.setDefaultNavigationTimeout(0)
    page.setRequestInterception(true)

    const blockRequests = wildcardMatch(['*.css', '*.js'], {separator: false})
    page.on('request', (request) => {
        const u = request.url()
        if (request.resourceType() == "image") { 
            request.abort()

            return
        }

        // if (blockRequests(u)) {
        //     request.abort()
        //     return
        // } 
        request.continue()
    })
    

    await page.goto(currentURL, {
        waitUntil: 'load',
        timeout: 0
    })
    // console.log('WENT TO URL')
    await page.setViewport({width: 1920, height: 1080})
    // console.log('View Set')

    const titleSelect = await page.waitForSelector('body > div.body-site > div:nth-child(1) > div.panel-breadcrumb > a:nth-child(3)', 
    {
        waitUntil: 'load',
        timeout: 0
    })
    // console.log(titleSelect)
    var mangaName = await titleSelect.evaluate(el => el.innerText)
    if (mangaName.length > 50) mangaName = mangaName.toString().slice(0,49)+'...'
    // console.log(mangaName)

    const chapDrop = await page.waitForSelector('body > div.body-site > div:nth-child(1) > div.panel-navigation > select', 
    {
        waitUntil: 'load',
        timeout: 0
    })
    
    var urlArgs = currentURL.split("/")
    urlArgs.pop()
    var url = urlArgs.join("/")

    const chaps = await chapDrop.evaluate(() => Array.from(
        document.querySelectorAll('body > div.body-site > div:nth-child(1) > div.panel-navigation > select > option'), 
        a => a.getAttribute('data-c')
      ))

    var chapsList = new Array()
    for (var i=0; i<chaps.length; i++) {
        chapsList.splice(0,0,url+"/chapter-" + chaps[i].toString())
    }


    //Code below gets image and saves it
    const page2 = await browser.newPage()
    

    const mainPage = await page.waitForSelector('body > div.body-site > div:nth-child(1) > div.panel-breadcrumb > a:nth-child(3)', 
    {
        waitUntil: 'load',
        timeout: 0
    })
    const mainPageURL = await mainPage.evaluate(el =>el.getAttribute('href'))
    await page2.goto(mainPageURL)
    page.close()
    const photoPage = await page2.waitForSelector('body > div.body-site > div.container.container-main > div.container-main-left > div.panel-story-info > div.story-info-left > span.info-image > img', 
    {
        waitUntil: 'load',
        timeout: 0
    })
    const photo = await photoPage.evaluate(el => el.src)

    
    // page2.on('request', (request) => {
    //     request.continue()
    // })
    // console.log(photo)
    var icon = await page2.goto(photo)
    fs.writeFile("data/icons/"+mangaName.replace(/[^a-zA-Z]+/g, "")+".png", await icon.buffer(), function (err) {
        if (err) {
            return console.log(err);
        }
    })

    var chapLatest = chapsList[chapsList.length-1].split('/')
    // console.log(chapLatest[chapLatest.length-1].replace("-", " ").replace("c", "C"))

    setUpChaps(chapsList, mangaName, chapLatest[chapLatest.length-1].replace("-", " ").replace("c", "C"))
    await browser.close()
}

async function setUpChaps(chaps, name, latestTitle) {
    sql = `SELECT * FROM mangaData WHERE mangaName = ?`;
    data.get(sql,[name], (err, row)=> {
        if (err) return console.error(err.message);
        // console.log(row)
        // console.log(!row)
        if (!row) {
            // console.log("importing to Global List")
            sql = `INSERT INTO mangaData (mangaName,list,newest,latestCard) VALUES(?,?,?,?)`
            data.run(sql,[name,chaps.toString(),chaps[chaps.length-1],latestTitle],(err)=>{
                if (err) return console.error(err.message);
            })
        } else {
            // console.log('updating Global List')
            sql = `Update mangaData SET newest = ?, list = ?, latestCard=? WHERE mangaName = ?`;
            data.run(sql,[chaps[chaps.length-1],chaps.toString(),name,latestTitle],(err)=>{
                if (err) return console.error(err.message);
            })
        }
    })
}

async function refreshSelect(mangaName) {
    await new Promise(async resolve => {
        sql = `SELECT newest FROM mangaData WHERE mangaName = ?`;
        data.get(sql,[mangaName], async (err, row)=> {
            if (err) return console.error(err.message)
            if (!row) return
            currentURL = row.newest

            if (!currentURL.includes("http")) return
            if (currentURL.includes('chapmang')) await chapMang(currentURL)
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
                await refreshSelect(names[i])
        }
    })
}

module.exports = {
    refreshSelect,
    refreshAll,
}