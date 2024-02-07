const {REST} = require('@discordjs/rest')
const {AttachmentBuilder, Client, GatewayIntentBits, Routes, Collection, InteractionType} = require('discord.js')
const Fuse = require("fuse.js")
const {registerCommands, registerSubCommands} = require('./utils/registry')
const { refreshAll }  = require('./utils/updateManga')
const sqlite3 = require("sqlite3").verbose()
let sql
const data = new sqlite3.Database('src/data/manga.db',sqlite3.OPEN_READWRITE,(err)=>{
    if (err) return console.error(err.message);
})

const fuseOptions = {
    isCaseSensitive: false,
	includeScore: false,
	shouldSort: true,
	includeMatches: false,
	findAllMatches: true,
	// minMatchCharLength: 1,
	threshold: 0.4,
	ignoreLocation: true,
}


//Create Databases if not exist
sql = `CREATE TABLE IF NOT EXISTS userData (userID,mangaName,current,currentCard,nextCard)`
data.run(sql)

sql = `CREATE TABLE IF NOT EXISTS mangaData (mangaName,list,newest,latestCard,updateTime)`
data.run(sql)

const token = require('../token.json')
const fs = require('fs')

const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]})
const rest = new REST({ version: '10' }).setToken(token.code)

const chapList = require("./utils/puppeteer/manganato/getChapList")
const getIcon = require("./utils/puppeteer/manganato/getIcon")
const getAll = require("./utils/puppeteer/manganato/getManga")
console.log("TEST ")
// chapList.getChapterList("https://chapmanganato.com/manga-on992096/chapter-11.6").then(result => console.log(result))
// getIcon.getMangaIcon("https://chapmanganato.com/manga-on992096/", "Souzou Renkinjutsushi Wa Jiyuu Wo Ouka Suru: Kokyou Wo Tsuihou Saretara, Maou No Ohizamoto De Chouzetsu Kouka No Magic Item Tsukuri-Houdai Ni Narimashita").then((result) => (console.log(result)))
// getAll.getMangaFull("https://chapmanganato.com/manga-np990472/chapter-28.1").then((results) => console.log(results))

// setInterval(refreshAll, 7200000) // Check all Manga Every 2 hours

client.on('ready', () => {
    console.log(client.user.tag + ' Has logged in')
    // refreshAll()
})

client.on('interactionCreate', (interaction) => {
    if (interaction.isChatInputCommand()) {
        const {commandName} = interaction
        const cmd = client.slashCommands.get(commandName)

        const subcommandGroup = interaction.options.getSubcommandGroup(false)
        const subcommandName = interaction.options.getSubcommand(false)

        if (subcommandName) {
            if (subcommandGroup) {
                const subcommandInstance = client.slashSubcommands.get(commandName)
                subcommandInstance.groupCommands.get(subcommandGroup).get(subcommandName).run(client, interaction)
            } else {
                console.log(commandName)
                const subcommandInstance = client.slashSubcommands.get(commandName)
                console.log(subcommandName)
                console.log(subcommandInstance.groupCommands)
                subcommandInstance.groupCommands.get(subcommandName).run(client, interaction)
            }
            return
        }

        if (cmd) {
            cmd.run(client, interaction)
        } else interaction.reply({ content: "An error occured. This command does nothing"})
    } else if (interaction.type = InteractionType.ApplicationCommandAutocomplete) {
        const {commandName} = interaction
        const cmd = interaction.commandName
        const subcommandName = interaction.options.getSubcommand(false)
        // console.log(subcommandName)
        if (!cmd) return
        
        try {
            mangaListUpdate(interaction, client)
            // subcommandName.autoComplete(interaction, client)
        } catch (err) {
            console.error(err)
        }
    }
})

// Lines for Manually deleting entries as needed

// sql = `DELETE FROM mangaData WHERE mangaName = ?`;
// data.run(sql,['Life of a Magic Academy Mage'],(err)=>{if (err) return console.error(err.message);})

// sql = `DELETE FROM userData WHERE mangaName = ?`;
// data.run(sql,['Life of a Magic Academy Mage'],(err)=>{if (err) return console.error(err.message);})


// Update Manga for Autofill results
async function mangaListUpdate(interaction, client) {
    const focusedValue = interaction.options.getFocused(true)
    // console.log(focusedValue)
    var search = focusedValue.value
    if (!search) search = " "
    if (focusedValue.name === 'your_title') {
        console.log('USER')
        sql = `SELECT mangaName FROM userData WHERE userID = ?`
        await data.all(sql,[interaction.member.id], (err, rows)=> {
            const names = rows.map(row => row.mangaName)
            const fuse = new Fuse(names, fuseOptions)
            fuseRes = fuse.search(search).slice(0,25)
            
            interaction.respond(fuseRes.map((choice) => ({ name: choice.item, value: choice.item})))
        })
    } else {
        sql = `SELECT mangaName FROM mangaData`
        await data.all(sql,[], (err, rows)=> {
            if (err) return console.error(err.message);
            const names = rows.map(row => row.mangaName)
            const fuse = new Fuse(names, fuseOptions)
            fuseRes = fuse.search(search).slice(0,25)

            interaction.respond(fuseRes.map((choice) => ({ name: choice.item, value: choice.item})))
        })
        
        
        
        
    }
    
    
    
}

//Creates slash Commands
async function main() {
    try {
        client.slashCommands = new Collection()
        client.slashSubcommands = new Collection()
        await registerCommands(client, '../commands')
        await registerSubCommands(client, '../subCommands')
        const slashCommandsJson = client.slashCommands.map((cmd) => cmd.getCommandJson())
        const slashSubCommandsJson = client.slashSubcommands.map((cmd) => cmd.getCommandJson())
        console.log('Refreshing slash Commands')
        console.log(slashCommandsJson+slashSubCommandsJson)
        await rest.put(Routes.applicationGuildCommands(token.appID, token.guildID), {
            body: [...slashCommandsJson, ...slashSubCommandsJson],
        })
        const registeredCommands = await rest.get(
            Routes.applicationGuildCommands(token.appID, token.guildID)
        )
        console.log('Slash Commands Refreshed')
        // console.log(registeredCommands)
        await client.login(token.code)
    }catch (err) {console.log(err)}
}
main()