const { AttachmentBuilder } = require("discord.js");
const BaseSubcommandExecutor = require("../../utils/BaseSubCommandExecutor");
const sqlite3 = require("sqlite3").verbose();
const Canvas = require('canvas')
const fs = require('fs');
let sql;
const { refreshSelect }  = require('../../utils/updateManga')
const data = new sqlite3.Database('src/data/manga.db',sqlite3.OPEN_READWRITE,(err)=>{
    if (err) return console.error(err.message);
})

module.exports = class mangaCardSubCommand extends BaseSubcommandExecutor {
    constructor(baseCommand, group) {
        super(baseCommand, group, 'card')
    }

    run(client, interaction) {
        const authID = interaction.member.id
        const name = interaction.options.get('title').value
        console.log(name)
        // refreshSelect(name)

        sql = `SELECT * FROM userData WHERE userID = ? AND mangaName = ?`
        data.get(sql,[authID, name], (err, userRow)=> {
            sql = `SELECT * FROM mangaData WHERE mangaName = ?`
            data.get(sql,[name], (err, mangaRow)=> {
                const latest = mangaRow.latestCard
                console.log(userRow)
                var current = ''
                console.log(userRow != undefined)
                if (userRow != undefined) {
                    current = userRow.currentCard
                } else {
                    current = 'Not Reading'
                }
                console.log(current)

                const chaps = mangaRow.list.split(",")
                // console.log(latest)
                // console.log(chaps)
                // console.log(current)

                var next = userRow.nextCard
                // if (next == "") next = chaps[0]
                console.log(next)
                generateCard(name.toString(), latest, current, next, (chaps.length + 1).toString() + " Chapters")
            })
        })
    

        async function generateCard(name, latest, current, next, total) {

            latest = latest.charAt(0).toUpperCase() + latest.slice(1)
            next = next.charAt(0).toUpperCase() + next.slice(1)

            // console.log(name)
            const canvas = Canvas.createCanvas(1643, 1425)
            const context = canvas.getContext('2d')

            const template = await Canvas.loadImage('./src/data/template/cardTemplate.png')
            context.drawImage(template, 0, 0, canvas.width, canvas.height)

            console.log('./src/data/icons/'+name.replace(/[^a-zA-Z]+/g, "")+'.png')
            const banner = await Canvas.loadImage('./src/data/icons/'+name.replace(/[^a-zA-Z]+/g, "")+'.png')
            context.drawImage(banner, 890, 240, 655, 940)

            context.font = applyText(canvas, name, 1400);
            context.fillStyle = '#D0D3D6';
            context.textAlign = "center"
            context.fillText(name, canvas.width / 2, 130);

            context.fillStyle = '#A8ABAE';
            context.font = applyText(canvas, latest, 400);
            context.fillText(latest, 410, 425);
            context.font = applyText(canvas, current, 400);
            context.fillText(current, 410, 670);
            context.font = applyText(canvas, next, 400);
            context.fillText(next, 410, 900);
            context.font = applyText(canvas, total, 400);
            context.fillText(total, 410, 1130);

            const attachment = new AttachmentBuilder(await canvas.toBuffer('image/png'), { name: `${name}-card.png`})
            console.log(attachment)
            interaction.reply({ files: [attachment] })
        }

        const applyText = (canvas, randomThing, width) => {
            const ctx = canvas.getContext('2d')
            console.log(ctx)
        
            let fontSize = 150;
        
            do {
                ctx.font = `${fontSize -= 10}px Hypereality`;
            } while (ctx.measureText(randomThing).width > width)
            console.log(ctx.measureText(randomThing))
            return ctx.font;
        }
    }
}