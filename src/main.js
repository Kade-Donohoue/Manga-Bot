console.log("Discord.JS v" + require('discord.js').version)
const {REST} = require('@discordjs/rest')
const {Client, GatewayIntentBits, Routes, Collection, InteractionType, ComponentType} = require('discord.js')
const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]})
const token = require('../data/token.json')
const config = require('../data/config.json')
const rest = new REST({ version: '10' }).setToken(token.code)

const Fuse = require("fuse.js")
const sqlite3 = require("sqlite3").verbose()

const { refreshAll }  = require('./utils/updateManga')
const {registerCommands, registerSubCommands} = require('./utils/registry')

const fuseOptions = {
    isCaseSensitive: false,
	includeScore: false,
	shouldSort: true,
	includeMatches: false,
	findAllMatches: true,
	threshold: 0.4,
	ignoreLocation: true,
}


let sql
const data = new sqlite3.Database('data/manga.db',sqlite3.OPEN_READWRITE,(err)=>{
    if (err) return console.error(err.message);
})
//Create Databases if not exist
sql = `CREATE TABLE IF NOT EXISTS userData (userID,mangaName,current,currentCard,nextCard,userCat, interactTime)`
data.run(sql)

sql = `CREATE TABLE IF NOT EXISTS mangaData (mangaName,list,newest,latestCard,updateTime)`
data.run(sql)

setInterval(refreshAll, config.updateDelay) // Check all Manga Every 2 hours

client.on('ready', () => { 
    console.log(client.user.tag + ' Has logged in')
    refreshAll()
})

client.on('interactionCreate', (interaction) => {
    if (interaction.componentType === ComponentType.Button) return
    if (interaction.componentType === ComponentType.StringSelect) return
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
                const subcommandInstance = client.slashSubcommands.get(commandName)
                subcommandInstance.groupCommands.get(subcommandName).run(client, interaction)
            }
            return
        }

        if (cmd) {
            cmd.run(client, interaction)
        } else interaction.reply({ content: "An error occured. This command does nothing"})
    } else if (interaction.type = InteractionType.ApplicationCommandAutocomplete) {
        const cmd = interaction.commandName
        if (!cmd) return 
        try {
            mangaListUpdate(interaction, client)
        } catch (err) {
            console.error(err)
        }
    }
})

// Update Manga for Autofill results
async function mangaListUpdate(interaction, client) {
    const focusedValue = interaction.options.getFocused(true)
    var search = focusedValue.value
    if (!search) search = " "
    if (focusedValue.name === 'your_title') {
        sql = `SELECT mangaName FROM userData WHERE userID = ?`
        await data.all(sql,[interaction.user.id], (err, rows)=> {
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

/**
 * Finds all commands and registers them with discord then logs the bot into discord
 */
async function main() {
    try {
        client.slashCommands = new Collection()
        client.slashSubcommands = new Collection()
        // await registerCommands(client, '../commands') //commented out as only sub commands are used
        await registerSubCommands(client, '../subCommands')
        // const slashCommandsJson = client.slashCommands.map((cmd) => cmd.getCommandJson())
        const slashSubCommandsJson = client.slashSubcommands.map((cmd) => cmd.getCommandJson())
        if (config.globalCommands) {
            console.log("Registering Global Commands")
            await rest.put(Routes.applicationCommands(token.appID), {
                body: [/*...slashCommandsJson, */...slashSubCommandsJson],
            })
            await rest.put(Routes.applicationGuildCommands(token.appID, token.guildID), {
                body: [],
            })
        } else {
            console.log("Registering Guild Commands")
            await rest.put(Routes.applicationGuildCommands(token.appID, token.guildID), {
                body: [/*...slashCommandsJson, */...slashSubCommandsJson],
            })
            await rest.put(Routes.applicationCommands(token.appID), {
                body: [],
            })
        }
        console.log('Slash Commands Registered')
        await client.login(token.code)
    }catch (err) {console.log(err)}
}
main()