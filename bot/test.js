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
const commandParts = require('./telegrafCommandParts') // for args parsing
bot.use(commandParts()) // for args parsing


// functions:     save_usr_msg_id(ctx), get_keysAdmin(id)
// commands:      start, help, send(id,text), showC
// reactions:     onText, onMessage, onA, onB, ban
// keyboards:     keysMain, keysAdmin, keysBack

// TODO: 

//        ======= КЛАВИАТУРЫ =======
function get_keysAdmin(id) {
  return Markup.inlineKeyboard([
    Markup.callbackButton('Бан ' + id, 'ban ' + id),
    Markup.callbackButton('Удалить историю у ' + id, 'del ' + id)     // del does not work yet
  ])
}

keysBack = Markup.inlineKeyboard([
  [Markup.callbackButton('Главное меню', 'mainMenu'), Markup.callbackButton('Авторизация', 'A')]
])

keysMain = Markup.inlineKeyboard([
  [Markup.urlButton('Website', 'https://play.google.com/')],
  [Markup.callbackButton('🅰uthorisation', 'A'), Markup.callbackButton('🅱utton', 'B')],
  [Markup.callbackButton('Something', '1'), Markup.callbackButton('Quooquooshka', '2')]
])

//        ======= КЛАВИАТУРЫ ======= 


//       ========= COMMANDS =========
bot.start((ctx) => {
  (async () => { // продублировать везде
    if (await not_in_ban(ctx.chat.id)){
      save_usr_msg_id(ctx)

      ctx.reply(
        `Привет ${ctx.chat.first_name}, это главное меню`,
        Extra.markup(keysMain)
      )

      telegram.sendMessage(
        data.admins[0],
        `ID: ${ctx.chat.id}\nusr: ${ctx.chat.username}\n/send ${ctx.chat.id} the_text`,
        Extra.markup(get_keysAdmin(ctx.chat.id))
      )
      
      telegram.sendMessage(
        data.admins[0],
        `/send ${ctx.chat.id} the_text`
      )

      telegram.deleteMessage(ctx.chat.id, ctx.message.message_id)       // удаляем ненужный текст юзера
    }
  })() // что это ()
})

bot.help(ctx => {
  ctx.reply(
    'This is your help. This is your help. \nThis is your help. This is your help.', 
    Extra.markup(keysBack), 
    telegram.deleteMessage(ctx.chat.id, ctx.message.message_id)       // удаляем ненужный текст юзера
  )
})

bot.command('send', (ctx) => ctx.telegram.sendMessage(        // сделать сложный парсер
    ctx.state.command.args.split(' ')[0], 
    ctx.state.command.args.split(' ')[1]
)) // (id_to, text)
//       ========= COMMANDS =========


//    ========== DB ============
var MongoClient = require('mongodb').MongoClient
var url = "mongodb://localhost:27017"
var bot_db = "bot_db_4"

MongoClient.connect(url, function(err, db) { if (err) throw err
  var dbo = db.db(bot_db)
  dbo.createCollection("black_list", function(err, res) { if (err) throw err })
  dbo.createCollection("users_messages", function(err, res) { if (err) throw err })
  // db.close()
})  

bot.command("showC", (ctx) => {     // show collections
  MongoClient.connect(url, function(err, db) { if (err) throw err
    var dbo = db.db(bot_db)
    dbo.listCollections().toArray(function(err, collInfos) {
      for (i = 0; i < collInfos.length; i++) {
        ctx.reply(collInfos[i].name),
        (dbo.collection(collInfos[i].name)).find().toArray(function(err, items) { 
          ctx.reply(items) 
        })
      } 
    })
  })
})

bot.action(/ban (\d+)/gi, (ctx) => {  
  const cur_chat_id = ctx.match[1]
  MongoClient.connect(url, function(err, db) { if (err) throw err
    var dbo = db.db(bot_db)
    var myobj = {chat_id: cur_chat_id}
    dbo.collection("black_list").insertOne(myobj, function(err, res) { if (err) throw err 
      ctx.reply(cur_chat_id + " inserted to black list")
    })
  })
})

async function not_in_ban(check_id) {           // проверка есть ли уже айди в коллекции
  const client = await MongoClient.connect(url, { useNewUrlParser: true })
      .catch(err => { console.log(err) })
  if (!client) {
    return
  }
  const dbo = client.db(bot_db)
  let blc = dbo.collection("black_list")
  var items = await blc.find({chat_id: check_id.toString()}).toArray()

  if (items.length){          // что это значит???
    return false
  } else {
    return true
  }
  // return items[0].id
}

function save_usr_msg_id(ctx) {   // saving msg_id of the each user
  MongoClient.connect(url, function(err, db) { if (err) throw err
    var dbo = db.db(bot_db)
    var myobj = {id: ctx.chat.id, msg_id: ctx.message.message_id}
    dbo.collection("users_messages").insertOne(myobj, function(err, res) { if (err) throw err })
  })
}
//    ========== DB ============


//       ========= REACTIONS =========
bot.action('A', ctx => {
  ctx.reply('Введите данные для авторизации в таком формате:\n\nE-Mail\nПароль\n\nОтправленные вами данные будут скрыты'),
  telegram.sendMessage(data.admins[0], `${ctx.chat.id} clicked AUTH`)
})

bot.action('B', ctx => {
  ctx.reply('Эта функция недоступна в данный момент ☹︎')
})

bot.action('del', ctx => {
  ctx.reply('Ничего не произошло')      //пока что бесполезное
})

bot.action('mainMenu', ctx => {
  ctx.reply(
    `Привет ${ctx.chat.first_name}, это главное меню`,
    Extra.markup(keysMain)
  )
})

bot.on('text', ctx => {

  save_usr_msg_id(ctx)

  const usrText = ctx.message.text
  ctx.telegram.sendMessage(data.admins[0], `ID: ${ctx.chat.id}\n\n` + usrText)
  ctx.telegram.deleteMessage(ctx.chat.id, ctx.message.message_id)
  telegram.sendMessage(ctx.chat.id, 'Отправленные вами данные были скрыты в целях безопасности')
})

bot.on('message', ctx => {
  //save_usr_msg_id(ctx)
  telegram.deleteMessage(ctx.chat.id, ctx.message.message_id)       // удаляем ненужный текст юзера
})
//       ========= REACTIONS =========


bot.startPolling()





//      === МУСОРКА ===

// bot.command('a', (ctx) => ctx.reply('Command a'))
// bot.command('b', ({ reply }) => reply('Command b'))
// bot.command('c', Telegraf.reply('Command c'))
// telegram.editMessageText(data.admins[0], 205, 205, 'Содержимое скрыто.')
// telegram.forwardMessage(438473347, 163700134, ctx.state.command.args) //(to, from, msg_id)
// telegram.deleteMessage(163700134, ctx.state.command.args) //(delete from which chat, msg_id)
// bot.on(['forward', 'sticker'], (ctx) => console.log('YYY', ctx.fetch.id)) // a OR b
// ===================
// bot.command('hide', (ctx) => {                // переделать в реакцию
//   const userAction = async () => {
//     const response = await fetch(`${tokenLink}forwardMessage?chat_id=${data.admins[0]}&from_chat_id=${id}&message_id=`+ctx.state.command.args);
//     const myJson = await response.json(); //extract JSON from the http response
//     console.log(myJson)
//     var jsonData = JSON.stringify(myJson);
//     var fs = require('fs')
//     fs.writeFile("test.txt", jsonData, function(err) {
//       if (err) {console.log(err)}
//     })
//     telegram.deleteMessage(id, ctx.state.command.args) //(delete from which chat, msg_id)
//     telegram.sendMessage(id, 'Отправленное вами сообщение было скрыто')
//   }
//   userAction()
// })
// ===================
// market://details?id=com.google.android.apps.maps


// db commands:   connect                   - MongoClient.connect(url, function(err, db) {...} 
//                choose db                 - dbo = db.db("db_name")
//                create collection         - dbo.createCollection("collection_name", function(err, res) {...}
//                insert myobj to collcetion- dbo.collection("collection_name").insertOne(myobj, function(err, res) {...}
//                list collections          - dbo.listCollections().toArray(function(err, collInfos) {...}
//                find objs in collection   - dbo.collection(collInfos[i].name)).find().toArray(function(err, items) {...}

// bot.command("ban", (ctx) => {        // can be deleted
//   const user_id = ctx.state.command.args
//   MongoClient.connect(url, function(err, db) {
//     if (err) throw err
//     var dbo = db.db("mydb")
//     dbo.createCollection("black_list", function(err, res) { if (err) throw err }) // for INITIALIZATION
//     var myobj = { id: user_id }
//     dbo.collection("black_list").insertOne(myobj, function(err, res) { if (err) throw err })
//   })
// })