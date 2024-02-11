const { AttachmentBuilder } = require("discord.js");
const BaseSubcommandExecutor = require("../../utils/BaseSubCommandExecutor");
const sqlite3 = require("sqlite3").verbose();
const Canvas = require('canvas')
const fs = require('fs');
let sql;
const { refreshSelect }  = require('../../utils/updateManga')
const data = new sqlite3.Database('data/manga.db',sqlite3.OPEN_READWRITE,(err)=>{
    if (err) return console.error(err.message);
})

module.exports = class mangaCardSubCommand extends BaseSubcommandExecutor {
    constructor(baseCommand, group) {
        super(baseCommand, group, 'card')
    }

    run(client, interaction) {
        const authID = interaction.member.id
        const name = interaction.options.get('title').value
        // refreshSelect(name)

        sql = `SELECT * FROM userData WHERE userID = ? AND mangaName = ?`
        data.get(sql,[authID, name], (err, userRow)=> {
            sql = `SELECT * FROM mangaData WHERE mangaName = ?`
            data.get(sql,[name], (err, mangaRow)=> {
                const latest = mangaRow.latestCard
                const updateTime = mangaRow.updateTime
                const chaps = mangaRow.list.split(",")
                var current = ''
                var next = ''
                if (userRow != undefined) {
                    current = userRow.currentCard
                    next = userRow.nextCard
                } else {
                    current = 'Not Reading'
                    next = chaps[0]

                }

                generateCard(name.toString(), latest, current, next, (chaps.length + 1).toString() + " Chapters", updateTime)
            })
        })
    

        async function generateCard(name, latest, current, next, total, updateTime) {

            latest = latest.charAt(0).toUpperCase() + latest.slice(1)
            next = next.charAt(0).toUpperCase() + next.slice(1)

            const canvas = Canvas.createCanvas(1643, 1425)
            const context = canvas.getContext('2d')

            const template = await Canvas.loadImage('data/template/cardTemplate.png')
            context.drawImage(template, 0, 0, canvas.width, canvas.height)

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

            context.textAlign = "left"
            context.font = applyText(canvas, updateTime, 600);
            context.fillText(updateTime, 100, 1365);

            const x = 890
            const y = 230
            const radius = 30
            const width = 655
            const height = 950

            // context.strokeStyle = "red";
            context.beginPath()
            context.moveTo(x + radius, y)
            context.lineTo(x + width - radius, y)
            context.quadraticCurveTo(x + width, y, x + width, y + radius)
            context.lineTo(x + width, y + height - radius)
            context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
            context.lineTo(x + radius, y + height)
            context.quadraticCurveTo(x, y + height, x, y + height - radius)
            context.lineTo(x, y + radius)
            context.quadraticCurveTo(x, y, x + radius, y)
            context.closePath()
            context.clip()
            

            // console.log('`data/icons/'+name.replace(/[^a-zA-Z]+/g, "")+'.png')
            const banner = await Canvas.loadImage('data/icons/'+name.replace(/[^a-zA-Z]+/g, "")+'.png')
            context.drawImage(banner, x, y, width, height)

            context.restore()

            const attachment = new AttachmentBuilder(await canvas.toBuffer('image/png'), { name: `${name}-card.png`})
            // console.log(attachment)
            interaction.reply({ files: [attachment], ephemeral: true })
        }

        // automatically find propper font size to get text to fit within certain width
        const applyText = (canvas, text, width) => {
            const ctx = canvas.getContext('2d')
            // console.log(ctx)
        
            let fontSize = 150;
        
            do {
                ctx.font = `${fontSize -= 10}px Hypereality`;
            } while (ctx.measureText(text).width > width)
            // console.log(ctx.measureText(text))
            return ctx.font;
        }
    }
}