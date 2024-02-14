const BaseSubcommandExecutor = require("../../utils/BaseSubCommandExecutor");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, ComponentType, StringSelectMenuBuilder  } = require("discord.js")
const sqlite3 = require("sqlite3").verbose();
let sql;
const data = new sqlite3.Database('data/manga.db',sqlite3.OPEN_READWRITE,(err)=>{
    if (err) return console.error(err.message);
})

const cancelButton = new ButtonBuilder()
    .setLabel('Cancel')
    .setStyle(ButtonStyle.Secondary)
    .setCustomId('cancel')
const confirmButton =  new ButtonBuilder()
    .setLabel('Confirm')
    .setStyle(ButtonStyle.Danger)
    .setCustomId('confirm')

const row = new ActionRowBuilder()
    .setComponents(cancelButton, confirmButton)

module.exports = class mangaforgetMeSubCommand extends BaseSubcommandExecutor {
    constructor(baseCommand, group) {
        super(baseCommand, group, 'forgetme')
    }

    async run(client, interaction) {

        const response = await interaction.reply({ content: 'Are you sure you want to PERMANENTLY REMOVE ALL your tracked manga?', components: [row], ephemeral: true})
        const filter = (i) => i.member.id === interaction.member.id
        const collector = response.createMessageComponentCollector({
            ComponentType: ComponentType.Button, 
            filter: filter
        })
        collector.on('collect', (interact => {
            if (interact.customId == 'cancel' ) interact.update({content: 'Cancelled', components: []})
            if (interact.customId == 'confirm') {
                console.log("Deleted User!!!!!!!!!!!")
                
                sql = `DELETE FROM userData WHERE userID = ?`;
                data.run(sql,[interaction.member.id], (err)=> {
                    if (err) return console.error(err.message);
                    interact.update({content: 'You are now removed!', components: []})
                })
            }
        }))
    }
}