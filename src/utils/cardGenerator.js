const { AttachmentBuilder } = require("discord.js")
const Canvas = require('canvas')

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
    
    return canvas.toBuffer('image/png')
    // return attachment
    // interaction.reply({ files: [attachment], ephemeral: true })
}

async function generateUserStatCard(userName, mangaRead, chaptersRead, mangaUnread, chaptersUnread, updateTime) {
    mangaRead = mangaRead.charAt(0).toUpperCase() + mangaRead.slice(1)
    chaptersRead = chaptersRead.charAt(0).toUpperCase() + chaptersRead.slice(1)
    mangaUnread = mangaUnread.charAt(0).toUpperCase() + mangaUnread.slice(1)
    chaptersUnread = chaptersUnread.charAt(0).toUpperCase() + chaptersUnread.slice(1)
    const canvas = Canvas.createCanvas(1643, 1425)
    const context = canvas.getContext('2d')
    const template = await Canvas.loadImage('data/template/userStatCard.png')
    context.drawImage(template, 0, 0, canvas.width, canvas.height)
    context.font = applyText(canvas, userName, 1400);
    context.fillStyle = '#D0D3D6';
    context.textAlign = "center"
    context.fillText(userName, canvas.width / 2, 130);
    context.fillStyle = '#A8ABAE';
    context.font = applyText(canvas, mangaRead, 400);
    context.fillText(mangaRead, 410, 425);
    context.font = applyText(canvas, chaptersRead, 400);
    context.fillText(chaptersRead, 410, 670);
    context.font = applyText(canvas, mangaUnread, 400);
    context.fillText(mangaUnread, 410, 900);
    context.font = applyText(canvas, chaptersUnread, 400);
    context.fillText(chaptersUnread, 410, 1130);
    context.textAlign = "left"
    context.font = applyText(canvas, updateTime, 600);
    context.fillText(updateTime, 100, 1365);



    // const x = 890
    // const y = 230
    // const radius = 30
    // const width = 655
    // const height = 950
    // context.strokeStyle = "red";
    // context.beginPath()
    // context.moveTo(x + radius, y)
    // context.lineTo(x + width - radius, y)
    // context.quadraticCurveTo(x + width, y, x + width, y + radius)
    // context.lineTo(x + width, y + height - radius)
    // context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    // context.lineTo(x + radius, y + height)
    // context.quadraticCurveTo(x, y + height, x, y + height - radius)
    // context.lineTo(x, y + radius)
    // context.quadraticCurveTo(x, y, x + radius, y)
    // context.closePath()
    // context.clip()
    
    // const banner = await Canvas.loadImage('data/icons/'+name.replace(/[^a-zA-Z]+/g, "")+'.png')
    // context.drawImage(banner, x, y, width, height)
    // context.restore()
    // const attachment = new AttachmentBuilder(await canvas.toBuffer('image/png'), { name: `${name}-card.png`})
    
    return canvas.toBuffer('image/png')
    // return attachment
    // interaction.reply({ files: [attachment], ephemeral: true })
}

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

module.exports = {
    generateCard,
    generateUserStatCard,
}