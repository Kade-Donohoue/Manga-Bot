const { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, ComponentType, StringSelectMenuBuilder  } = require("discord.js")
const BaseSubcommandExecutor = require("../../../src/utils/BaseSubCommandExecutor")
const sqlite3 = require("sqlite3").verbose()
const { generateCard }  = require('../../../src/utils/cardGenerator')
const { getUnread, getNextList }  = require('../../../src/utils/getAllUnread')
const getManga = require("../../utils/puppeteer/manganato/getManga")

let sql
const data = new sqlite3.Database('data/manga.db',sqlite3.OPEN_READWRITE,(err)=>{
    if (err) return console.error(err.message);
})

const cancelButton = new ButtonBuilder()
    .setCustomId("cancel")
    .setLabel("Cancel")
    .setStyle(ButtonStyle.Danger)

const nextButton = new ButtonBuilder()
    .setCustomId('next')
    .setLabel('Next')
    .setStyle(ButtonStyle.Primary);

const readButton = new ButtonBuilder()
    .setCustomId('read')
    .setLabel('Mark as Read')
    .setStyle(ButtonStyle.Primary);

const linkButton = new ButtonBuilder()
    .setLabel('Open')
    .setStyle(ButtonStyle.Link);

const mangeReadSelection = new StringSelectMenuBuilder() 
    .setCustomId("select")
    .setPlaceholder("Select Where you Read to!!!")

module.exports = class mangaFeedSubCommand extends BaseSubcommandExecutor {
    constructor(baseCommand, group) {
        super(baseCommand, group, 'feed')
    }

    async run(client, interaction) {
        const authID = interaction.member.id
        console.log(authID)

        getUnread(authID).then(async ([names, nextLinks, nextChap, currentChap]) => {
            if (names.length == 0) return interaction.reply({ content: "You have no Unread manga!", ephemeral: true })

            await interaction.deferReply({ ephemeral: true })
            manageCard(names, nextLinks, nextChap, currentChap, 0, interaction)
        })
    }
}

function manageCard(names, nexts, nextChaps, currentChaps, currentIndex, interaction) {
    
    const name = names[currentIndex]
    const nextURL = nexts[currentIndex]
    const current = currentChaps[currentIndex]
    const next = nextChaps[currentIndex]

    // console.log(name, nextURL)

    sql = `SELECT * FROM mangaData WHERE mangaName = ?`
    data.get(sql,[name], (err, mangaRow)=> {
        if (err) console.error(err)
        if (!mangaRow) return
        
        const latest = mangaRow.latestCard
        const updateTime = mangaRow.updateTime
        const chaps = mangaRow.list.split(",")
        generateCard(name.toString(), latest, current, next, (chaps.length + 1).toString() + " Chapters", updateTime).then(async function(data) {

            linkButton.setURL(String(nextURL))

            const row = new ActionRowBuilder()
                .addComponents(cancelButton, linkButton, readButton, nextButton) //groups buttons for message

            const attach = new AttachmentBuilder(data, { name: `${name}-card.png`}) //creates discord attachment for message
            response = await interaction.editReply({ content: "", files: [attach], components: [row], ephemeral: true}) //send card and buttons to user

            const filter = (i) => i.member.id === interaction.member.id //filters button clicks to only the user that ran the feed command
            const collector = response.createMessageComponentCollector({
                ComponentType: ComponentType.Button, 
                filter: filter
            })
            collector.on('collect', ( async interact => {
                if (interact.customId == 'cancel' ) { //sets message to cancelled and stops collector
                    await interact.update({content: "Cancelled", files: [], components: []})
                    collector.stop()
                }
                if (interact.customId == 'next' ) { //updates card to next card 
                    console.log(currentIndex, nextChaps.length)
                    console.log(currentIndex+1 < nextChaps.length)
                    if (currentIndex+1 < names.length) {
                        console.log("MOREEEEEEEEEEEE")
                        await interact.update({ content: "Updating Please Wait...", files: [], components: []})
                        manageCard(names, nexts, nextChaps, currentChaps, currentIndex+1, interaction)
                    } else  {
                        
                        await interact.update({ content: "You are all caught up!!!", files: [], components: []})
                    }
                    collector.stop()
                    
                }
                if (interact.customId == 'read') { // repllace buttons with dropdown to select current chap(limited to next 25 chaps)
                    const row = new ActionRowBuilder()
                    getNextList(nextURL, name).then(async (selectList) => {
                        mangeReadSelection.setOptions(selectList)
                        const row = new ActionRowBuilder()
                            .addComponents(mangeReadSelection)
                            await interact.update({ components: [row]})
                    })
                }
                if (interact.customId == 'select') { // updates current chap and goes to the next card
                    console.log(interact.values[0])
                    getManga.getMangaFull(interact.values[0]).then(async function(updateData) {
                        if (updateData != -1) getManga.setUpChaps(updateData[0],updateData[1],updateData[2],updateData[3],updateData[4], interaction.member.id, interact.values[0])
                        if (currentIndex+1 < names.length) {
                            manageCard(names, nexts, nextChaps, currentChaps, currentIndex+1, interaction)
                        } else await interact.update({ content: "You are all caught up!!!", files: [], components: []})
                    })
                    collector.stop()
                }
            }))
        })
        
    })
}