const Telegraf = require('telegraf')
const data = require('./data')
const TelegrafInlineMenu = require('telegraf-inline-menu')
const Telegram = require('telegraf/telegram')


const telegram = new Telegram(data.token, {
  agent: null,        // https.Agent instance, allows custom proxy, certificate, keep alive, etc.
  webhookReply: true  // Reply via webhook
})

class CustomContext extends Telegraf.Context {
  constructor (update, telegram, options) {
    console.log('Creating contexy for %j', update)
    super(update, telegram, options)
  }

  reply (...args) {
    console.log('reply called with args: %j', args)
    return super.reply(...args)
  }
}

const bot = new Telegraf(data.token, { contextType: CustomContext })
bot.start((ctx) => {
	ctx.reply('Hello')
	telegram.sendMessage(163700134, ctx.chat)// + msgInfo.message_id)
})
bot.help((ctx) => ctx.reply('Help message'))

bot.command('oldschool', (ctx) => ctx.reply('Hello'))
bot.command('modern', ({ reply }) => reply('Yo'))
bot.command('hipster', Telegraf.reply('λ'))

bot.command('HAHA', (ctx) => {
	telegram.forwardMessage(163700134, 438473347, 333)
	telegram.editMessageText(438473347, 333, 333, '.')
 	// telegram.deleteMessage(438473347, 329)
 })

bot.command('photo', (ctx) => {
	telegram.forwardMessage(163700134, 438473347, 390)
	telegram.editMessageMedia(438473347, 390, "/Users/ukhatov/Downloads/pobeda_team/Ухатов-2.jpg")//"./test.jpg")
 	// telegram.deleteMessage(438473347, 329)
 })
// bot.command('HAHA', (ctx) => )

const menu = new TelegrafInlineMenu(ctx => `Hey ${ctx.from.first_name}!`)
menu.setCommand('play')
menu.simpleButton('I am excited!', 'a', {
  doFunc: ctx => ctx.reply('As am I!')
})
menu.simpleButton('I am not excited!', 'b', {
  doFunc: ctx => ctx.reply('Coronatime!')
})



bot.use(menu.init())
 
bot.startPolling()
// bot.monkey((ctx) => ctx.reply('HAHA'))
bot.launch()