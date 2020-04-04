const Telegraf = require('telegraf')
const fetch = require("node-fetch") //for fwd-del
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
    console.log('contexy %j', update)
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

// available commands:      start, hide, send(id,text)

const id = 163700134
const msg = 'filler'
const tokenLink = `https://api.telegram.org/bot${data.token}/`


//            === КЛАВИАТУРЫ ===
keysAdmin = Markup.inlineKeyboard([
  Markup.callbackButton('Бан', 'ban'),
  Markup.callbackButton('Удалить историю', 'del')
])

keysLink = Markup.inlineKeyboard([
  [Markup.urlButton('★', 'https://play.google.com/')],
  [Markup.callbackButton('🅰', 'A'), Markup.callbackButton('🅱', 'B')]
])
//       =============================



bot.action('A', ctx => ctx.reply('Напишите что-то'))
bot.action('B', ctx => {
  ctx.reply('Недоступно'), 
  telegram.sendMessage(data.admins[0], 'usr clicked b')
})



//          === COMMANDS ===
bot.start((ctx) => {
  ctx.reply(
    `Привет ${ctx.chat.first_name}, это главное меню`,
    Extra.markup(keysLink)
  )
  telegram.sendMessage(
    data.admins[0],
    `ID: ${ctx.chat.id}\nusr: ${ctx.chat.username}\n/send ${ctx.chat.id} filler`,
    Extra.markup(keysAdmin)
  )
})

bot.command('send', (ctx) => ctx.telegram.sendMessage(
    ctx.state.command.args.split(' ')[0], 
    ctx.state.command.args.split(' ')[1], 
    Extra.markup(keysLink)
)) // (id_to, text_tolko_tak, extra)

bot.command('hide', (ctx) => {                // переделать в реакцию
  const userAction = async () => {
    const response = await fetch(`${tokenLink}forwardMessage?chat_id=${data.admins[0]}&from_chat_id=${id}&message_id=`+ctx.state.command.args);
    const myJson = await response.json(); //extract JSON from the http response
    console.log(myJson)
    var jsonData = JSON.stringify(myJson);
    var fs = require('fs')
    fs.writeFile("test.txt", jsonData, function(err) {
      if (err) {console.log(err)}
    })
    telegram.deleteMessage(id, ctx.state.command.args) //(delete from which chat, msg_id)
    telegram.sendMessage(id, 'Отправленное вами сообщение было скрыто')
  }
  userAction()
})
//    ==========================



// const replies = {
//   // text
//   "i did not hit her": { type: 'text', value: 'https://www.youtube.com/watch?v=zLhoDB-ORLQ'}
  
//   // gif
//   "nodejs": { type: 'gif', id: 'CgADBAADLQIAAlnKaVMm_HsznW30oQI' },

//   // sticker
//   "woah": { type: 'sticker', id: 'CAADAgAD5gADJQNSD34EF_pwQMgbAg' },
// }



var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017";

bot.command("ban", (ctx) => {
  const user_id = ctx.state.command.args
  MongoClient.connect(url, function(err, db) {
    if (err) throw err
    var dbo = db.db("mydb")
    // // var collection = db.collection('user_ids');
    dbo.createCollection("user_ids", function(err, res) {
      if (err) throw err
      console.log("Collection user_ids created!")
      ctx.reply("Collection user_ids created!")
    })

    var myobj = { name: "Alex", id: user_id };

    dbo.collection("user_ids").insertOne(myobj, function(err, res) {
      if (err) throw err;
      console.log(user_id + " inserted");
      ctx.reply(user_id + " inserted");
    });
    // ctx.reply(dbo.getCollection("user_ids"))
    dbo.collection('user_ids').count(function(err, count) {
      // assert.equal(null, err);
      // assert.equal(4, count);
      console.logcount
      ctx.reply(count)
    })
    
  })
})

bot.command("connect", (ctx) =>{
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");
    var query = { address: "Park Lane 38" };
    dbo.collection("customers").find(query).toArray(function(err, result) {
      if (err) throw err;
      console.log(result);
      console.log(ctx.state.command.args);
      db.close();
    });
  });
})



bot.on('text', ctx => {
  let cmd = ctx.message.text.toLowerCase()
  // ЛОГИКА ЛОГИКА ЛОГИКА
  const answer = cmd+cmd
  ctx.reply(answer)
})

bot.startPolling()





//      === МУСОРКА ===

// bot.command('a', (ctx) => ctx.reply('Command a'))
// bot.command('b', ({ reply }) => reply('Command b'))
// bot.command('c', Telegraf.reply('Command c'))

// telegram.editMessageText(data.admins[0], 205, 205, 'Содержимое скрыто.')
// telegram.forwardMessage(438473347, 163700134, ctx.state.command.args) //(to, from, msg_id)
// telegram.deleteMessage(163700134, ctx.state.command.args) //(delete from which chat, msg_id)
// ctx.reply('Сообщение ' + ctx.state.command.args + ' было спрятано')
// telegram.sendMessage(163700134, ctx.chat)
// bot.on('message', (ctx) => ctx.reply('???????')) // перебивает все, включая команды
//         message = любое сообщение юзера

// bot.on('photo', (ctx) => ctx.telegram.sendMessage(
//   ctx.chat.id, 
//   "text response on photo with keysLink", 
//   Extra.markup(keysLink)
// )) // перебивает всё, но реагирует только на фото
//bot.on(['forward', 'sticker'], (ctx) => console.log('YYY', ctx.fetch.id)) // a OR b

//==================
// const menu = new TelegrafInlineMenu(ctx => `Это классное меню!`)  // создаем тип "menu"
// menu.setCommand('play')
// menu.simpleButton('Логин', '1', {
//   doFunc: ctx => ctx.reply('Вводи:') // hide(msg_id + 1)
// })
// menu.simpleButton('Пароль', '2', {
//   doFunc: ctx => ctx.reply('Вводи:')
// })
// bot.use(menu.init())
//==================

// market://details?id=com.google.android.apps.maps