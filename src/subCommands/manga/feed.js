const { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, ComponentType, StringSelectMenuBuilder  } = require("discord.js")
const BaseSubcommandExecutor = require("../../../src/utils/BaseSubCommandExecutor")
const { generateCard }  = require('../../../src/utils/cardGenerator')
const { getUnread }  = require('../../../src/utils/getAllUnread')
const manganato = require("../../utils/puppeteer/manganato/getManga")
const reaper = require("../../utils/puppeteer/reaper/getManga")
const { updateCategory }  = require('../../utils/updateManga')
const dataUtils = require('../../utils/dataUtils')

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

var navigationRow = new ActionRowBuilder()
    .addComponents(prevButton, linkButton, readButton, nextButton)
var manageHomeRow = new ActionRowBuilder()
    .addComponents(cancelButton, catButton)

module.exports = class mangaFeedSubCommand extends BaseSubcommandExecutor {
    constructor(baseCommand, group) {
        super(baseCommand, group, 'feed')
    }

    async run(client, interaction) {
        const authID = interaction.user.id
        const userCat = interaction.options.getString('category') ?? '%'
        const sortMethod = interaction.options.getString('sort-method') ?? 'interactTime'
        const sortOrd = interaction.options.getString('sort-order') ?? 'ASC'

        getUnread(authID, userCat, sortMethod, sortOrd).then(async ([names, nextLinks, nextChap, currentChap, currentCat]) => {
            if (names.length == 0) return interaction.reply({ content: "You have no Unread manga!", ephemeral: true })

            await interaction.deferReply({ ephemeral: true })

            manageCardHandler(names, nextLinks, nextChap, currentChap, interaction, currentCat)
        })
    }
}

/**
 * Manages providing new cards and handling button presses for feed command
 * @param names: List of Manga Names
 * @param nexts: List of Next Chapter URL
 * @param nextChaps: List of Next Chapter Card Text
 * @param currentChaps: List of Current Chapter Card Text
 * @param interaction: interaction to reply to
 * @returns Nothing 
 */
async function manageCardHandler(names, nexts, nextChaps, currentChaps, interaction, userCat) {
    var currentIndex = 0
    var msg = await feedCardMaker(names[currentIndex], nexts[currentIndex], currentChaps[currentIndex], nextChaps[currentIndex])
    response = await interaction.editReply(msg)


    const filter = (i) => i.user.id === interaction.user.id //filters button clicks to only the user that ran the feed command
    const collector = response.createMessageComponentCollector({
        ComponentType: ComponentType.Button, 
        filter: filter,
        time: 14.5*60*1000 
    })
    collector.on('collect', ( async interact => {
        await interact.update({ content: "Updating Please Wait...", components: []})

        if (interact.customId == 'cancel' ) { //sets message to cancelled and stops collector
            await interact.editReply({content: "Cancelled", files: [], components: []})
            collector.stop()
        }

        if (interact.customId == 'next' ) { //updates card to next card 
            dataUtils.userInteractTime(interaction.user.id, names[currentIndex])
            currentIndex += 1
            if (currentIndex < names.length) {
                await interact.editReply(await feedCardMaker(names[currentIndex], nexts[currentIndex], currentChaps[currentIndex], nextChaps[currentIndex]))
            } else  {
                await interact.editReply({ content: "You are all caught up!!!", files: [], components: []})
            }
        }

        if (interact.customId == 'prev' ) { //updates card to next card 
            currentIndex += -1
            if (currentIndex >= 0) {
                await interact.editReply(await feedCardMaker(names[currentIndex], nexts[currentIndex], currentChaps[currentIndex], nextChaps[currentIndex]))
                // dataUtils.userInteractTime(interaction.user.id, names[currentIndex])
            } else  {
                currentIndex = 0
                await interact.editReply({ content: "Nothing Before this one!", components: [navigationRow, manageHomeRow]})
            }    
        }

        if (interact.customId == 'read') { // repllace buttons with dropdown to select current chap(limited to next 25 chaps)
            const nextList = await dataUtils.getNextList(nexts[currentIndex], names[currentIndex], 25)
            // console.log(nextList)
            mangeReadSelection.setOptions(nextList)
            const row = new ActionRowBuilder()
                .addComponents(mangeReadSelection)
            const row2 = new ActionRowBuilder()
                .addComponents(backButton)
                await interact.editReply({ components: [row2,row]})
        }

        if (interact.customId == 'backPrev') { // returns buttons
            const cardMessage = await feedCardMaker(names[currentIndex], nexts[currentIndex], currentChaps[currentIndex], nextChaps[currentIndex])
            await interact.editReply({ components: cardMessage.components })
        }

        if (interact.customId == 'select') { // updates current chap and goes to the next card
            var urlBase = nexts[currentIndex].split('/')
            urlBase.pop()
            urlBase = urlBase.join('/')
            currentIndex+=1
            if (currentIndex < names.length) {
                await interact.editReply(await feedCardMaker(names[currentIndex], nexts[currentIndex], currentChaps[currentIndex], nextChaps[currentIndex]))
            } else await interact.editReply({ content: "You are all caught up!!!", files: [], components: []})

            const URL = urlBase+'/'+interact.values[0]
            // console.log(URL)
            if (URL.includes('chapmang')) return manganato.getMangaFull(URL).then(function(data) {
                if (data == -1) {
                    interact.editReply({content: 'An internal system error has occured. Please try again or contact the admin'})
                } else if (data == -2) {
                    interaction.followUp({content: 'ChapManganato has been disabled. If you think this is a mistake please contact the admin'})
                } else {
                    manganato.setUpChaps(data[0],data[1],data[2],data[3],data[4], interaction.user.id, URL, userCat[currentIndex-1])
                }
            })
            if (URL.includes('reaperscan')) return reaper.getMangaFull(URL).then(function(data) {
                if (data == -1) {
                    interact.editReply({content: 'An internal system error has occured. Please try again or contact the admin'})
                } else if (data == -2) {
                    interaction.followUp({content: 'Reaper Scans has been disabled. If you think this is a mistake please contact the admin', ephemeral: true})
                } else {
                    reaper.setUpChaps(data[0],data[1],data[2],data[3],data[4], interaction.user.id, URL, userCat[currentIndex-1])
                }
            })
        }

        if (interact.customId == 'setCat') { // brings up buttons to allow user to change category
            const catRow = new ActionRowBuilder()
                .addComponents(mangeCatSelection)
            const manageRow = new ActionRowBuilder()
                .addComponents(backButton)
            await interact.editReply({ components: [manageRow,catRow]})
        }

        if (interact.customId == 'catSelect') { // changes category of manga based on user selection
            updateCategory(interaction.user.id, names[currentIndex].toString(), interact.values[0])
            await interact.editReply({ components: [navigationRow, manageHomeRow]  })
        }
    }))

    collector.on('end', ( async () => {
        interaction.editReply({ content: `Interaction Timed out please run </manga feed:${interaction.commandId}> again to continue! `, files: [], components: [], ephemeral: true})
    }))
}

/**
     * Provides dictionary for discord message contioning both a card and its buttons
     * @param name: Name of the Manga
     * @param nextURL: URL of the next chapter
     * @param currentText: Text to put as current chapter on card
     * @param nextText: Text to put as next chapter on card
     * @returns dictionary with the keys content with its value as an empty string, files and its data is a card image, components, containing main buttons, and ephemeral set to true 
     */
async function feedCardMaker(name, nextURL, currentText, nextText) {

    const mangaRow = await dataUtils.getMangaRow(name)

    const cardData = await generateCard(name.toString(), mangaRow.latestCard, currentText, nextText, (mangaRow.list.split(",").length).toString() + " Chapters", mangaRow.updateTime)
    const attach = new AttachmentBuilder(cardData, { name: `${name}-card.png`})

    linkButton.setURL(String(nextURL))

    navigationRow.setComponents(prevButton, linkButton, readButton, nextButton)
    manageHomeRow.setComponents(cancelButton, catButton)


    return { content: "", files: [attach], components: [navigationRow, manageHomeRow], ephemeral: true }
}