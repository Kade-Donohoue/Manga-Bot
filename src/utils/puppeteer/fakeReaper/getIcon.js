const fs = require('fs')
const puppeteer = require("puppeteer-extra")
const stealthPlugin = require("puppeteer-extra-plugin-stealth")
puppeteer.use(stealthPlugin())
const wildcardMatch = require('wildcard-match');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
const adblocker = AdblockerPlugin({
  blockTrackers: true // default: false
})
puppeteer.use(adblocker)
const delay = ms => new Promise(res => setTimeout(res, ms));
/**
 * Gets the chapter list from ChapManganato
 * @param url: Main page URL of a manga from ChapManganato. 
 * @returns -1 if icon saving fails. Returns 1 if the image save sucessfully. Saves photo to data/icon folder
 */
async function getMangaIcon(url, title) {
    console.log(url)
    const browser = await puppeteer.launch({headless: "new", devtools: false, ignoreHTTPSErrors: true, 
        args: ['--enable-features=NetworkService', '--no-sandbox', '--disable-setuid-sandbox','--mute-audio']})
    try {
        console.log("starting Icon Save")
        const page = await browser.newPage()
        page.setDefaultNavigationTimeout(15000)
        page.setRequestInterception(true)

        const blockRequests = wildcardMatch(['*.css*', '*.js*', '*facebook*', '*.png*', '*google*', '*fonts*'], {separator: false})
        page.on('request', (request) => {
            const u = request.url()
            if (blockRequests(u)) {
                request.abort()
                return
            } 
        request.continue()
        })

        await page.goto(url, {waitUntil: 'networkidle0', timeout: 0})
        page.viewport({width: 960, height: 1040})

        const photoPage = await page.waitForXPath('/html/body/div[1]/div[2]/div/div[2]/div[1]/article/div[1]/div[2]/div[1]/div[1]/img')
        const photo = await photoPage.evaluate(el => el.src)
        const icon = await page.goto(photo)
        fs.writeFile("data/icons/"+title.replace(/[^a-zA-Z]+/g, "")+".png", await icon.buffer(), function(err) {
            if (err) {
                console.log("ICON SAVING FAIL ON SAVE!!!!!!!!!!!!!")
                return -1
            }
        })
        // console.log(icon.buffer())
        await browser.close()
        // console.log("Icon Save Success at " + "data/icons/"+title.replace(/[^a-zA-Z]+/g, "")+".png")
        return 1
        
    } catch (err) {
        // await delay(5*60*1000)
        await browser.close()
        console.log("ICON SAVING FAIL!!!!!!!!!!!!! " + err)
        return -1
    }
}

module.exports = {
    getMangaIcon
}