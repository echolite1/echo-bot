const Telegraf = require('telegraf')
const data = require('./data') // admins, token
const Extra = require('telegraf/extra') //for buttons
const Markup = require('telegraf/markup') //for buttons
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
const commandParts = require('./telegrafCommandParts'); // for args parsing
bot.use(commandParts()) // for args parsing

// available commands:      a, b, c, start(text), help, play, hide, send(id,text), (onPhoto)

const msg = 'On+my+way'
const startLink = 'https://api.telegram.org/bot' + data.token + '/sendMessage?chat_id='
msg_id = 202

//===============
keysLink = Markup.inlineKeyboard([
  [Markup.urlButton('💎', 'https://play.google.com/')],
  [Markup.callbackButton('Хорошо', '-'), Markup.callbackButton('Отлично', '-')]
])                                                                                 //шаблон кнопок
//===============

bot.on('photo', (ctx) => ctx.telegram.sendMessage(
  ctx.chat.id, 
  "text response on photo with keysLink", 
  Extra.markup(keysLink)
)) // перебивает всё, но реагирует только на фото

bot.start((ctx) => {

  ctx.reply(
    `Привет ${ctx.chat.first_name}`,
    Extra.markup(keysLink)
  )

  console.log(ctx.state.command) // отображение аргументов

  telegram.sendMessage(
    data.admins[0],
    `ID: ${ctx.chat.id}\nusr: ${ctx.chat.username}\n${startLink}${ctx.chat.id}&text=${ctx.state.command.args}`
    //Extra.markup(keysLink) //как вариант - админские кнопки(забанить, удалить)
  )//убрать аргумент
  
})

//telegram.sendMessage(163700134, ctx.chat)
//bot.on('message', (ctx) => ctx.reply('???????')) // перебивает все, включая команды
//       message = любое сообщение юзера

bot.help(Telegraf.reply('Komy nuzhen help?'))

bot.command('send', (ctx) => ctx.telegram.sendMessage(
    ctx.state.command.args.split(' ')[0], 
    ctx.state.command.args.split(' ')[1], 
    Extra.markup(keysLink)
)) // (id_to, text_tolko_tak, extra)

bot.command('a', (ctx) => ctx.reply('Command a'))
bot.command('b', ({ reply }) => reply('Command b'))
bot.command('c', Telegraf.reply('Command c'))

bot.command('hide', (ctx) => {
  //telegram.editMessageText(data.admins[0], 205, 205, 'Содержимое скрыто.')
  telegram.forwardMessage(438473347, 163700134, ctx.state.command.args) //(to, from, msg_id)

  //  console.log('start sleeping')
  //  function sleep(milliseconds) {
  //    const date = Date.now()
  //    let currentDate = null
  //    do {
  //      currentDate = Date.now()
  //    } while (currentDate - date < milliseconds)
  //  }
  //  sleep(10000)
  //  console.log('stop sleeping')
  //  function flush() {
  //    process.stdout.clearLine();
  //    process.stdout.cursorTo(0);
  //  }
  //  flush();

  telegram.deleteMessage(163700134, ctx.state.command.args) //(delete from which chat, msg_id)
  console.log(ctx.state.command.args)
  ctx.reply('Сообщение ' + ctx.state.command.args + ' было спрятано')
})   //if сообщ переслалось == true подождать и только потом delete

//==================
const menu = new TelegrafInlineMenu(ctx => `Это классное меню!`)  // создаем тип "menu"

menu.setCommand('play')

menu.simpleButton('Логин', '1', {
  doFunc: ctx => ctx.reply('Вводи:') // hide(msg_id + 1)
})
menu.simpleButton('Пароль', '2', {
  doFunc: ctx => ctx.reply('Вводи:')
})

bot.use(menu.init())
//==================

bot.startPolling()

//   market://details?id=com.google.android.apps.maps