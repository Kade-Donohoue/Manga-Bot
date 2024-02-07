const { SlashCommandBuilder } = require('discord.js');
const BaseSlashSubCommand = require("../../utils/BaseSlashSubCommand");
const sqlite3 = require("sqlite3").verbose();
let sql;
const data = new sqlite3.Database('src/data/manga.db',sqlite3.OPEN_READWRITE,(err)=>{
    if (err) return console.error(err.message);
})

module.exports = class MangaSubCommand extends BaseSlashSubCommand {
    constructor() {
        super('manga', [], ['latest', 'current', 'next', 'remove', 'add', 'bulkadd', 'allunread', 'card'])
    }

    getCommandJson() {
        return new SlashCommandBuilder()
        .setName(this.name)
        .setDescription('Get information on a Manga')
        .addSubcommand((subcommand) => subcommand 
            .setName('latest')
            .setDescription('allows you to see the Latest chapter of selected manga (WIP)')
            .addStringOption((option) => option 
                .setName('title')
                .setDescription('Title of Manga')
                .setAutocomplete(true)
                .setRequired(true)
            )
             
            
        )
        .addSubcommand((subcommand) => subcommand 
            .setName('current')
            .setDescription('allows you to see the Current chapter of selected manga (WIP)')
            .addStringOption((option) => option 
            .setName('your_title')
            .setDescription('Title of Manga')
            .setAutocomplete(true)
            .setRequired(true)
        )
        )
        .addSubcommand((subcommand) => subcommand 
            .setName('next')
            .setDescription('allows you to see the Current chapter of selected manga (WIP)')
            .addStringOption((option) => option 
            .setName('your_title')
            .setDescription('Title of Manga')
            .setAutocomplete(true)
            .setRequired(true)
        )
        )
        .addSubcommand((subcommand) => subcommand 
            .setName('remove')
            .setDescription('allows you to remove selected manga (WIP)')
            .addStringOption((option) => option 
                .setName('your_title')
                .setDescription('Title of Manga')
                .setAutocomplete(true)
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) => subcommand 
            .setName('add')
            .setDescription('allows you to add selected manga to your list (WIP)')
            .addStringOption((option) => option
                .setName('manga_url')
                .setDescription('URL for the Manga')
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) => subcommand 
            .setName('bulkadd')
            .setDescription('allows you to add selected mangas to your list (WIP)')
            .addStringOption((option) => option
                .setName('manga_url')
                .setDescription('URL for the Manga seperated by command and no spaces. EX: link1,link2,link3...')
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) => subcommand 
            .setName('allunread')
            .setDescription('allows you to add selected manga to your list (WIP)')
        )
        .addSubcommand((subcommand) => subcommand 
            .setName('card')
            .setDescription('Provides a card containing information of selected manga (WIP)')
            .addStringOption((option) => option 
                .setName('title')
                .setDescription('Title of Manga that you want to see the card of')
                .setAutocomplete(true)
                .setRequired(true)
            )
        )
        .toJSON()
    }
}