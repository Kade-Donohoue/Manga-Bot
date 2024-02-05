const puppeteer = require("puppeteer-extra")
const stealthPlugin = require("puppeteer-extra-plugin-stealth")
puppeteer.use(stealthPlugin())
const wildcardMatch = require('wildcard-match');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
const adblocker = AdblockerPlugin({
  blockTrackers: true // default: false
})
puppeteer.use(adblocker)

/**
 * Gets the chapter list from ChapManganato
 * @param url: Chapter URL of a manga from ChapManganato. 
 * @returns Array of chapter URLS for the manga. 
 */
async function getChapterList(url) {
    try {
        const browser = await puppeteer.launch({headless: false, devtools: false, ignoreHTTPSErrors: true, 
            args: ['--enable-features=NetworkService', '--no-sandbox', '--disable-setuid-sandbox','--mute-audio']})
        const page = await browser.newPage()
        page.setDefaultNavigationTimeout(0)
        page.setRequestInterception(true)

        const blockRequests = wildcardMatch(['*.css', '*.js', '*facebook*'], {separator: false})
        page.on('request', (request) => {
            const u = request.url()
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

        await page.goto(url, {waitUntil: 'load', timeout: 0})
        page.viewport({width: 960, height: 1040})

        const chapterDropdown = await page.waitForSelector('body > div.body-site > div:nth-child(1) > div.panel-navigation > select')

        const chapters = await chapterDropdown.evaluate(() => Array.from(
            document.querySelectorAll('body > div.body-site > div:nth-child(1) > div.panel-navigation > select > option'),
            a => a.getAttribute('data-c')
        ))

        let urlArgs = url.split("/")
        urlArgs.pop()
        let mangaURL = urlArgs.join("/")

        let chapterList = []
        chapters.forEach((chap) => {
            chapterList.splice(0,0,mangaURL+"/chapter-" + chap.toString())
        })

        await browser.close()
        return chapterList
        
    } catch {
        return -1
    }
}

module.exports = {
    getChapterList
}