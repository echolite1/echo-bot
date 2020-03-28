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

const menu = new TelegrafInlineMenu(ctx => `Это классное меню!`)

msg_id = 322

bot.start((ctx) => {
	ctx.reply(`Привет ${ctx.chat.first_name}`)
  //telegram.sendMessage(163700134, ctx.chat)// + msgInfo.message_id)
  telegram.sendMessage(163700134, `ID: ${ctx.chat.id}\nusr: ${ctx.chat.username}`)// + msgInfo.message_id)
})

//bot.on('message', (ctx) => ctx.reply('???????')) // перебивает команды

bot.help((ctx) => ctx.reply('Ответ на команду хелп'))

bot.command('a', (ctx) => ctx.reply('Command a'))

bot.command('b', ({ reply }) => reply('Command b'))

bot.command('c', Telegraf.reply('Command c'))

bot.command('hide', (ctx) => {
  //telegram.editMessageText(data.admins[0], 205, 205, 'Содержимое скрыто.')
  telegram.forwardMessage(554729289, 163700134, msg_id) //(to, from, msg_id)
  console.log('fwd')
  
  ctx.reply('Сообщение было спрятано')
  console.log('text')

  console.log('start sleeping')
  function sleep(milliseconds) {
    const date = Date.now()
    let currentDate = null
    do {
      currentDate = Date.now()
    } while (currentDate - date < milliseconds)
  }
  sleep(5000)
  
  telegram.deleteMessage(163700134, msg_id) //(where, msg_id)
  console.log('del')
})

menu.setCommand('play')

menu.simpleButton('Логин', '1', {
  doFunc: ctx => ctx.reply('Вводи:') // hide(msg_id + 1)
})
menu.simpleButton('Пароль', '2', {
  doFunc: ctx => ctx.reply('Вводи:')
})

bot.use(menu.init())
bot.startPolling()
bot.launch() // можно удалить