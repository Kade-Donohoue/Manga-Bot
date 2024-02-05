const BaseSubcommandExecutor = require("../../utils/BaseSubCommandExecutor")
const sqlite3 = require("sqlite3").verbose()
const puppeteer = require("puppeteer-extra")
const stealthPlugin = require("puppeteer-extra-plugin-stealth")
puppeteer.use(stealthPlugin())
const fs = require('fs')

const webp = require('webp-converter');
const Jimp = require('jimp');

const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
const adblocker = AdblockerPlugin({
  blockTrackers: true // default: false
})
puppeteer.use(adblocker)

// const chapList = require("../../utils/puppeteer/manganato/getChapList")
// chapList.getChapterList()

let sql;
const data = new sqlite3.Database('src/data/manga.db',sqlite3.OPEN_READWRITE,(err)=>{
    if (err) return console.error(err.message);
})




module.exports = class mangaBulkAddSubCommand extends BaseSubcommandExecutor {
    constructor(baseCommand, group) {
        super(baseCommand, group, 'bulkadd')
    }

    run(client, interaction) {
        // console.log(data)
        const authID = interaction.member.id
        const URLS = interaction.options.get('manga_url').value.split(",")
        interaction.reply({ content : 'Wait One Moment Please ...' })
        loop()

        var i = 0; 
        function loop() {
            setTimeout(function() {
                const URL = URLS[i]
                console.log(URL)
                
                // if (!URL.includes("http")) return
                if (URL.includes('chapmang')) chapMang(URL)
                i++
                if (i < URLS.length) {
                    loop()
                }
            },5000)
        }         
            
            // if (URL.includes('asura')) asura()
            // if (URL.includes('reaperscan')) reaperMang()
            var mangaName =''
            var chapTitle = ''

            async function chapMang(URL) {
                const browser = await puppeteer.launch({headless: false, devtools: false, ignoreHTTPSErrors: true,
                    args: ['--enable-features=NetworkService', '--no-sandbox', '--disable-setuid-sandbox','--mute-audio'
                ]}) //change to true Once testing complete
                const page = await browser.newPage()

                await page.goto(URL, {
                    networkIdleTimeout: 5000,
                    timeout: 0
                })
                console.log('WENT TO URL')
                await page.setViewport({width: 1920, height: 1080})
                console.log('View Set')

                

                const titleSelect = await page.waitForSelector('body > div.body-site > div:nth-child(1) > div.panel-breadcrumb > a:nth-child(3)')
                console.log(titleSelect)
                var mangaName = await titleSelect.evaluate(el => el.innerText)
                if (mangaName.length > 50) mangaName = mangaName.toString().slice(0,49)+'...'
                console.log(mangaName)

                const chapDrop = await page.waitForSelector('body > div.body-site > div:nth-child(1) > div.panel-navigation > select')
                
                var urlArgs = URL.split("/")
                urlArgs.pop()
                var url = urlArgs.join("/")

                const chaps = await chapDrop.evaluate(() => Array.from(
                    document.querySelectorAll('body > div.body-site > div:nth-child(1) > div.panel-navigation > select > option'), 
                    a => a.getAttribute('data-c')
                ))

                var chapTitles = await page.$eval('body > div.body-site > div:nth-child(1) > div.panel-navigation > select', node => node.value)
                chapTitles = chapTitles.split(':')
                console.log(chapTitles[0])

                try {
                    const nextButton = await page.waitForSelector('body > div.body-site > div:nth-child(1) > div.panel-navigation > div > a.navi-change-chapter-btn-next.a-h', {timeout: 2000})
                    var chapNext = await nextButton.evaluate(el => el.getAttribute('href'))
                    chapNext = chapNext.split('/')
                    console.log(chapNext[chapNext.length-1].replace("-", " "))
                } catch {var chapNext = url}

                var chapsList = new Array()
                for (var i=0; i<chaps.length; i++) {
                    chapsList.splice(0,0,url+"/chapter-" + chaps[i].toString())
                }

                await page.click('body > div.body-site > div:nth-child(1) > div.panel-breadcrumb > a:nth-child(3)')
                const photoPage = await page.waitForSelector('body > div.body-site > div.container.container-main > div.container-main-left > div.panel-story-info > div.story-info-left > span.info-image > img')
                const photo = await photoPage.evaluate(el => el.src)

                var icon = await page.goto(photo)
                fs.writeFile("./src/data/icons/"+mangaName.replace(/[^a-zA-Z]+/g, "")+".png", await icon.buffer(), function (err) {
                    if (err) {
                        return console.log(err);
                    }
                })

                var chapLatest = chapsList[chapsList.length-1].split('/')
                console.log(chapLatest[chapLatest.length-1].replace("-", " "))

                setUpChaps(chapsList, mangaName, chapTitles[0], chapNext[chapNext.length-1].replace("-", " "), chapLatest[chapLatest.length-1].replace("-", " "), URL)
                await browser.close()
            }

            //Disabled to to ASURAS frequent changes

            // async function asura() {
            //     interaction.reply({ content : 'Wait One Moment Please ...' })

            //     //Setup puppeteer
            //     const browser = await puppeteer.launch({headless: false, 
            //         args: ['--enable-features=NetworkService', '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'
            //     ]}) //change to true Once testing complete
            //     const page = await browser.newPage()

            //     //go to manga page and set dimensions
            //     await page.goto(URL)
            //     await page.setViewport({width: 1080, height: 1024})

            //     //Get title of manga
            //     const titleSelect = await page.waitForSelector('div.headpost > div > a')
            //     console.log(titleSelect)
            //     var mangaName = await titleSelect.evaluate(el => el.innerText)
            //     if (mangaName.length > 50) mangaName = mangaName.toString().slice(0,49)+'...'

            //     //Get list of URLS for manga and format it(reorder it)
            //     const chapDrop = await page.waitForSelector('#chapter')
            //     console.log(chapDrop)
            //     const chaps = await chapDrop.evaluate(() => Array.from(
            //         document.querySelectorAll('#chapter > option'), 
            //         a => a.getAttribute('value')
            //       ))
            //     console.log(chaps)
            //     var chapsList = new Array()
            //     for (var i=0; i<chaps.length; i++) {
            //         chapsList.splice(0,0,chaps[i])
            //     }
            //     chapsList = chapsList.filter((a, b) => chapsList.indexOf(a) === b)
            //     chapsList.pop()

            //     //determine current and next chapter
            //     const chapTitles = await page.$eval('#chapter', node => node.value)
            //     // const chapTitleArray = await page.evaluate (() =>
            //     //     Array.from(document.querySelectorAll('#chapter > option')).map(el=>el.value)
            //     // )

            //     //get icon for manga
            //     await page.click('div.headpost > div > a')
            //     const photoPage = await page.waitForSelector('div.thumbook > div.thumb > img')
            //     const photo = await photoPage.evaluate(el => el.src)
            //     await page.goto(photo)
            //     //Take screenshot of Icon(Asura stores icon as riff webp and pain to convert so just taking screen shot because pain)
            //     await page.screenshot({
            //         path: "./src/data/icons/"+mangaName.replace(/[^a-zA-Z]+/g, "")+".png",
            //         type:"png",
            //         omitBackground: true
            //     })

            //     console.log(chapTitles)
            //     console.log("Title Array")
            //     // console.log(chapTitleArray.filter((a, b) => chapTitleArray.indexOf(a) === b))

            //     setUpChaps(chapsList, mangaName,chapTitles, )
            //     await browser.close()
            // }

            // async function reaperMang() {
            //     const browser = await puppeteer.launch({headless: false, 
            //         args: ['--enable-features=NetworkService', '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'
            //     ]}) //change to true Once testing complete
            //     const page = await browser.newPage()

            //     await page.goto(URL)

            //     await page.setViewport({width: 1080, height: 1024})

            //     const titleSelect = await page.waitForSelector('div.text-center.mb-12.mt-8 > p')
            //     console.log(titleSelect)
            //     var mangaName = await titleSelect.evaluate(el => el.innerText)
                // if (mangaName.length > 50) mangaName = mangaName.toString().slice(0,49)+'...'

            //     // setTimeout(function() {
            //     // }, 50);
                

            //     await page.waitForSelector('div.flex.w-0.flex-1.justify-end.mb-2 > a:nth-child(1)')
            //     await page.click('div.flex.w-0.flex-1.justify-end.mb-2 > a:nth-child(1)')

            //     const chapsSelect = await page.waitForSelector(`div.pb-4 > div > div > ul > li`)
            //     const chapList = await chapsSelect.evaluate(() => Array.from(
            //         document.querySelectorAll('div.pb-4 > div > div > ul > li > a[href]'),
            //         a => a.getAttribute('href')
            //       ))
                
            //     var nextAllowed = true
            //     while (nextAllowed) {
            //         const nextCheck = await page.waitForSelector('div:nth-child(2) > span > span:last-child')
            //         const next = await nextCheck.evaluate( () =>
            //             document.querySelectorAll('div:nth-child(2) > span > span:last-child > button > svg')
            //         )
            //         console.log(!next)
            //         if (!next) nextAllowed = false

            //         await page.click(next)

            //         const chapsSelect = await page.waitForSelector(`div.pb-4 > div > div > ul > li`)
            //         const nextChapList = await chapsSelect.evaluate(() => Array.from(
            //         document.querySelectorAll('div.pb-4 > div > div > ul > li > a[href]'),
            //         a => a.getAttribute('href')
            //       ))
                    
            //       for (var i=0; i<nextChapList.length; i++) {
            //         chapList.splice(0,0,nextChapList[i])
            //       }
            //     }
            //     // console.log(chapsSelect.length)
            //     console.log(chapList)
            //     setUpChaps("testing123Reaper", mangaName)
            //     await browser.close()
            // }

            function setUpChaps(chaps, name, currentTitle, nextTitle , latestTitle, URL){
                // name = name.slice(99)
                console.log("Past URL Check")
                console.log("name : ")
                console.log(name)
                console.log("chaps : ")
                console.log(chaps)
                console.log("latest : ")
                console.log(chaps[chaps.length-1])
            
                //add Manga
                sql = `SELECT * FROM mangaData WHERE mangaName = ?`;
                data.get(sql,[name], (err, row)=> {
                    if (err) return console.error(err.message);
                    // console.log(row)
                    // console.log(!row)
                    if (!row) {
                        console.log("importing to Global List")
                        interaction.channel.send({content: 'Manga Added to Global List'})
                        sql = `INSERT INTO mangaData (mangaName,list,newest,latestCard) VALUES(?,?,?,?)`
                        data.run(sql,[name,chaps.toString(),chaps[chaps.length-1],latestTitle],(err)=>{
                            if (err) return console.error(err.message);
                        })
                    } else {
                        console.log('updating Global List')
                        interaction.channel.send({content: 'Manga Already Added to Global List'})
                        sql = `Update mangaData SET newest = ?, list = ?, latestCard = ? WHERE mangaName = ?`;
                        data.run(sql,[chaps[chaps.length-1],chaps.toString(),name,latestTitle],(err)=>{
                            if (err) return console.error(err.message);
                        })
                    }
                })
            
                //add User Manga
                sql = `SELECT * FROM userData WHERE userID = ? AND mangaName = ?`;
                data.get(sql,[authID, name], (err, row)=> {
                    if (err) return console.error(err.message);
                    // console.log(row)
                    // console.log(!row)
                    if (!row) {
                        console.log("newUser")
                        interaction.followUp({content: 'Manga Added To Your List'})
                        sql = `INSERT INTO userData (current, userID, mangaName, currentCard, nextCard) VALUES(?,?,?,?,?)`
                        data.run(sql,[URL,authID,name,currentTitle,nextTitle],(err)=>{
                            if (err) return console.error(err.message);
                        })
                    } else {
                        console.log('updating User List')
                        interaction.followUp({content: 'Manga Already On Your List'})
                        sql = `UPDATE userData SET current = ?, currentCard = ?, nextCard = ? WHERE userID = ? AND mangaName = ?`
                        data.run(sql,[URL,currentTitle,nextTitle,authID,name],(err)=>{
                            if (err) return console.error(err.message);
                        })
                    }
                })
            }
        // interaction.reply({content: 'Manga add'})
    }
}