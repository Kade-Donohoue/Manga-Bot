const { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, ComponentType, StringSelectMenuBuilder  } = require("discord.js")
const BaseSubcommandExecutor = require("../../../src/utils/BaseSubCommandExecutor")
const sqlite3 = require("sqlite3").verbose()
const { generateCard }  = require('../../../src/utils/cardGenerator')
const { getUnread, getNextList }  = require('../../../src/utils/getAllUnread')
const getManga = require("../../utils/puppeteer/manganato/getManga")
const { executablePath } = require("puppeteer")
const { updateCategory }  = require('../../utils/updateManga')

const delay = ms => new Promise(res => setTimeout(res, ms))
let sql
const data = new sqlite3.Database('data/manga.db',sqlite3.OPEN_READWRITE,(err)=>{
    if (err) return console.error(err.message);
})

const cancelButton = new ButtonBuilder()
    .setCustomId("cancel")
    .setLabel("Cancel")
    .setStyle(ButtonStyle.Danger)

const prevButton = new ButtonBuilder()
    .setCustomId('prev')
    .setLabel('Previous')
    .setStyle(ButtonStyle.Primary);

const nextButton = new ButtonBuilder()
    .setCustomId('next')
    .setLabel('Next')
    .setStyle(ButtonStyle.Primary);

const readButton = new ButtonBuilder()
    .setCustomId('read')
    .setLabel('Mark as Read')
    .setStyle(ButtonStyle.Success);

const linkButton = new ButtonBuilder()
    .setLabel('Open')
    .setStyle(ButtonStyle.Link);

const mangeReadSelection = new StringSelectMenuBuilder() 
    .setCustomId("select")
    .setPlaceholder("Select Where you Read to!!!")

const mangeCatSelection = new StringSelectMenuBuilder() 
    .setCustomId("catSelect")
    .setPlaceholder("Select a category!!!")
    .addOptions(
        { label: 'Reading', value: 'reading' }, 
        { label: 'Not Reading', value: 'notreading' },
        { label: 'Hold', value: 'hold' },
        { label: 'Hiatus', value: 'hiatus' },
        { label: 'Finished', value: 'finished' }, 
        { label: 'In Queue', value: 'inqueue' },
        { label: 'Other', value: 'other' }
    )  

const backButton = new ButtonBuilder()
    .setCustomId('backPrev')
    .setLabel('Back')
    .setStyle(ButtonStyle.Primary);

const catButton = new ButtonBuilder()
    .setCustomId('setCat')
    .setLabel('Change Category')
    .setStyle(ButtonStyle.Secondary);

module.exports = class mangaFeedSubCommand extends BaseSubcommandExecutor {
    constructor(baseCommand, group) {
        super(baseCommand, group, 'feed')
    }

    async run(client, interaction) {
        const authID = interaction.user.id
        var userCat = null
        try {
            userCat = interaction.options.get('category').value
        } catch{}

        getUnread(authID, userCat).then(async ([names, nextLinks, nextChap, currentChap]) => {
            if (names.length == 0) return interaction.reply({ content: "You have no Unread manga!", ephemeral: true })

            await interaction.deferReply({ ephemeral: true })
            manageCard(names, nextLinks, nextChap, currentChap, 0, interaction)
            await delay(10*60*1000)
            interaction.editReply({ content: "Interaction Timed out please run feed command again to continue!", files: [], components: [], ephemeral: true})
        })
    }
}


/**
 * Manages providing new cards and handling button presses for feed command
 * @param names: List of Manga Names
 * @param nexts: List of Next Chapter URL
 * @param nextChaps: List of Next Chapter Card Text
 * @param currentChaps: List of Current Chapter Card Text
 * @param currentIndex: Vurrent index value of lists
 * @param interaction: interaction to reply to
 * @returns Nothing 
 */
function manageCard(names, nexts, nextChaps, currentChaps, currentIndex, interaction) {
    
    const name = names[currentIndex]
    const nextURL = nexts[currentIndex]
    const current = currentChaps[currentIndex]
    const next = nextChaps[currentIndex]

    sql = `SELECT * FROM mangaData WHERE mangaName = ?`
    data.get(sql,[name], (err, mangaRow)=> {
        if (err) console.error(err)
        if (!mangaRow) return
        
        const latest = mangaRow.latestCard
        const updateTime = mangaRow.updateTime
        const chaps = mangaRow.list.split(",")
        generateCard(name.toString(), latest, current, next, (chaps.length + 1).toString() + " Chapters", updateTime).then(async function(data) {

            linkButton.setURL(String(nextURL))

            // const row = new ActionRowBuilder()
            //     .addComponents(cancelButton, linkButton, readButton, prevButton, nextButton) //groups buttons for message

            const row1 = new ActionRowBuilder()
                .addComponents(prevButton, linkButton, readButton, nextButton)

            const row2 = new ActionRowBuilder()
                .addComponents(cancelButton, catButton)

            const attach = new AttachmentBuilder(data, { name: `${name}-card.png`}) //creates discord attachment for message
            response = await interaction.editReply({ content: "", files: [attach], components: [row1, row2], ephemeral: true}) //send card and buttons to user

            const filter = (i) => i.user.id === interaction.user.id //filters button clicks to only the user that ran the feed command
            const collector = response.createMessageComponentCollector({
                ComponentType: ComponentType.Button, 
                filter: filter,
                time: 10*60*1000 
            })
            collector.on('collect', ( async interact => {
                if (interact.customId == 'cancel' ) { //sets message to cancelled and stops collector
                    await interact.update({content: "Cancelled", files: [], components: []})
                    collector.stop()
                }
                if (interact.customId == 'next' ) { //updates card to next card 
                    if (currentIndex+1 < names.length) {
                        await interact.update({ content: "Updating Please Wait...", files: [], components: []})
                        manageCard(names, nexts, nextChaps, currentChaps, currentIndex+1, interaction)
                    } else  {
                        
                        await interact.update({ content: "You are all caught up!!!", files: [], components: []})
                    }
                    collector.stop()
                    
                }
                if (interact.customId == 'prev' ) { //updates card to next card 
                    if (currentIndex+1 < names.length) {
                        await interact.update({ content: "Updating Please Wait...", files: [], components: []})
                        manageCard(names, nexts, nextChaps, currentChaps, currentIndex-1, interaction)
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
                        const row2 = new ActionRowBuilder()
                            .addComponents(backButton)
                            await interact.update({ components: [row2,row]})
                    })
                }
                if (interact.customId == 'backPrev') { // returns buttons
                    await interact.update({ components: [row1, row2]})
                }
                if (interact.customId == 'select') { // updates current chap and goes to the next card
                    getManga.getMangaFull(interact.values[0], false).then(async function(updateData) {
                        await interact.update({ content: "Updating Please Wait...", files: [], components: []})
                        if (updateData != -1) getManga.setUpChaps(updateData[0],updateData[1],updateData[2],updateData[3],updateData[4], interaction.user.id, interact.values[0])
                        if (currentIndex+1 < names.length) {
                            manageCard(names, nexts, nextChaps, currentChaps, currentIndex+1, interaction)
                        } else await interact.update({ content: "You are all caught up!!!", files: [], components: []})
                    })
                    collector.stop()
                }
                if (interact.customId == 'setCat') {
                    const row = new ActionRowBuilder()
                        .addComponents(mangeCatSelection)
                    const row2 = new ActionRowBuilder()
                        .addComponents(backButton)
                    await interact.update({ components: [row2,row]})
                }

                if (interact.customId == 'catSelect') {
                    updateCategory(interaction.user.id, name.toString(), interact.values[0])
                }
            }))
        })
        
    })
}