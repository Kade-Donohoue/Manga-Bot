const { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, ComponentType, StringSelectMenuBuilder  } = require("discord.js")
const BaseSubcommandExecutor = require("../../../src/utils/BaseSubCommandExecutor")
const sqlite3 = require("sqlite3").verbose()
let sql
const { refreshSelect }  = require('../../../src/utils/updateManga')
const { generateCard }  = require('../../../src/utils/cardGenerator')
const { getUnread, getNextList }  = require('../../../src/utils/getAllUnread')
const getManga = require("../../utils/puppeteer/manganato/getManga")
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
    // .addOptions([
    //     {
    //         label: 'Select me',
    //         description: 'This is a description',
    //         value: 'first_option',
    //     },
    //     {
    //         label: 'You can select me too',
    //         description: 'This is also a description',
    //         value: 'second_option',
    //     },
    // ])

module.exports = class mangaFeedSubCommand extends BaseSubcommandExecutor {
    constructor(baseCommand, group) {
        super(baseCommand, group, 'feed')
    }

    async run(client, interaction) {
        const authID = interaction.member.id
        console.log(authID)

        getUnread(authID).then(([names, nextLinks, nextChap, currentChap]) => {
            console.log("Names:", names.length);
            console.log("Next links:", nextLinks.length);

            console.log("Next chapter:", nextChap.length);
            console.log("Current chapter:", currentChap.length);

            interaction.reply({ content: "One Moment Please!", ephemeral: true })

            interaction.deleteReply()

            manageCard(names, nextLinks, nextChap, currentChap, 0, interaction)
        })
        // refreshSelect(name)
    }
}

function manageCard(names, nexts, nextChaps, currentChaps, currentIndex, interaction) {
    
    const name = names[currentIndex]
    const nextURL = nexts[currentIndex]
    const current = currentChaps[currentIndex]
    const next = nextChaps[currentIndex]

    console.log(name, nextURL)

    sql = `SELECT * FROM mangaData WHERE mangaName = ?`
    data.get(sql,[name], (err, mangaRow)=> {
        if (err) console.error(err)
        if (!mangaRow) return
        
        const latest = mangaRow.latestCard
        const updateTime = mangaRow.updateTime
        const chaps = mangaRow.list.split(",")
        generateCard(name.toString(), latest, current, next, (chaps.length + 1).toString() + " Chapters", updateTime).then(async function(data) {
            // const response = await interaction.channel.send({ ephemeral: true })
            linkButton.setURL(String(nextURL))
            const row = new ActionRowBuilder()
                .addComponents(cancelButton, linkButton, readButton, nextButton)
            const attach = new AttachmentBuilder(data, { name: `${name}-card.png`})
            console.log(data)
            response = await interaction.channel.send({ files: [attach], components: [row], ephemeral: true})
            const filter = (i) => i.member.id === interaction.member.id
            const collector = response.createMessageComponentCollector({
                ComponentType: ComponentType.Button, 
                filter: filter
            })
            collector.on('collect', (interact => {
                console.log(interact)
                console.log("button " + interact.customId)
                if (interact.customId == 'cancel' ) {
                    interact.update({content: "Cancelled", files: [], components: []})
                    return
                }
                if (interact.customId == 'next' ) {
                    interact.message.delete()
                    manageCard(names, nexts, nextChaps, currentChaps, currentIndex+1, interaction)
                    return
                }
                if (interact.customId == 'read') {
                    const row = new ActionRowBuilder()
                    getNextList(nextURL, name).then((selectList) => {
                        mangeReadSelection.addOptions(selectList.slice(0,25))
                        const row = new ActionRowBuilder()
                            .addComponents(mangeReadSelection)
                            interact.update({ components: [row]})
                        return
                    })
                    return
                }
                if (interact.customId == 'select') {
                    console.log(interact.values[0])
                    getManga.getMangaFull(interact.values[0]).then(function(updateData) {
                        // console.log(data)
                        if (updateData != -1) getManga.setUpChaps(updateData[0],updateData[1],updateData[2],updateData[3],updateData[4], interaction.member.id, interact.values[0])
                        // interaction.deferReply({ ephemeral: true })
                        // interact.update({ content: "Updated read chapter to " + updateData[2], files: [], components: []})
                        interact.message.delete()
                        manageCard(names, nexts, nextChaps, currentChaps, currentIndex+1, interaction)
                        return
                    })
                    return
                }
            }))
        })
        
    })
}