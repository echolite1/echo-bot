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
    console.log('contexy %j', update, '\n')
    super(update, telegram, options)
  }
  reply (...args) {
    console.log('reply called with args: %j', args, '\n')
    return super.reply(...args)
  }
}
const bot = new Telegraf(data.token, { contextType: CustomContext })
const commandParts = require('./telegrafCommandParts') // for args parsing
bot.use(commandParts()) // for args parsing


// functions:           saveUserMsgId(ctx), keysAdmin(id), notBanned(check_id)

//       commands:      start, help
// admin commands:      send(id*text), showC

//       reactions:     onText, onMessage, onA, onB
// admin reactions:     ban, remove, clearHistory

// keyboards:           keysMain, keysAdmin, keysBack


//        ======= КЛАВИАТУРЫ =======
function keysAdmin(id) {
  return Markup.inlineKeyboard([
    [Markup.callbackButton('Бан', 'ban ' + id), Markup.callbackButton('Разбанить', 'remove ' + id)],
    [Markup.callbackButton('Удалить историю', 'clearHistory ' + id)],     // clearHistory does not work yet
  ])
}

function keysCustom(btnText1, btnText2, cmd1, cmd2) {
  return Markup.inlineKeyboard([
    [Markup.callbackButton(btnText1, cmd1)], 
    [Markup.callbackButton(btnText2, cmd2)]
  ])
}

keysBack = Markup.inlineKeyboard([
  [Markup.callbackButton('Главное меню', 'mainMenu'), Markup.callbackButton('Авторизация', 'A')]
])

keysMain = Markup.inlineKeyboard([
  [Markup.urlButton('Website', 'https://play.google.com/')],
  [Markup.callbackButton('Авторизация', 'A'), Markup.callbackButton('Буттон', 'B')]
])

//        ======= КЛАВИАТУРЫ ======= 


//       ========= COMMANDS =========
bot.start(ctx => {
  (async () => {
    if (await notBanned(ctx.chat.id)){

      telegram.sendMessage(
        ctx.chat.id, `Привет ${ctx.chat.first_name}, это главное меню`,
        Extra.markup(keysMain)
      )           //  to USER

      telegram.sendMessage(
        data.admins[0], `ID: ${ctx.chat.id}\nusr: ${ctx.chat.username}`,
        Extra.markup(keysAdmin(ctx.chat.id))
      )           //  to ADMIN

      telegram.sendMessage(data.admins[0], `/send ${ctx.chat.id}*the_text`)   //  to ADMIN

      telegram.deleteMessage(ctx.chat.id, ctx.message.message_id)       // удаляем ненужный текст юзера
    }
  })()
})

bot.help(ctx => {
  (async () => {
    if (await notBanned(ctx.chat.id)){
      telegram.sendMessage(
        ctx.chat.id, `This is your help. This is your help. \nThis is your help. This is your help.`,
        Extra.markup(keysBack)
      )
      telegram.deleteMessage(ctx.chat.id, ctx.message.message_id)
    }
  })()
})

bot.command('send', ctx => 
  ctx.telegram.sendMessage(
    ctx.state.command.args.split('*')[0], 
    ctx.state.command.args.split('*')[1],
    // if(ctx.state.command.args.split('*')[2] == undefined){
    //   return console.log('vse ok')
    // }
    Extra.markup(keysCustom(
      ctx.state.command.args.split('*')[2],
      ctx.state.command.args.split('*')[3],
      ctx.state.command.args.split('*')[4],
      ctx.state.command.args.split('*')[5]
    ))
  )
) // (id_to, text, btntxt1, btntxt2, cmd1, cmd2)
//       ========= COMMANDS =========


//    ========== DB ============
var MongoClient = require('mongodb').MongoClient
const url = 'mongodb://localhost:27017'
const bot_db = 'DB1'
const collMsg = 'userMessages'
const collBlack = 'blacklist'

MongoClient.connect(url, function(err, db) { if (err) throw err
  var dbo = db.db(bot_db)
  dbo.createCollection(collBlack, function(err, res) { if (err) throw err })
  dbo.createCollection(collMsg, function(err, res) { if (err) throw err })
  // db.close()
})  

bot.command('showC', ctx => {     // show collections
  MongoClient.connect(url, function(err, db) { if (err) throw err
    var dbo = db.db(bot_db)
    dbo.listCollections().toArray(function(err, collInfos) {
      for (i = 0; i < collInfos.length; i++) {
        ctx.reply(collInfos[i].name),         // появился баг с 2х пустыми скобками
        (dbo.collection(collInfos[i].name)).find().toArray(function(err, items) { 
          ctx.reply(items) 
        })
      } 
    })
  })
})

bot.action(/ban (\d+)/, ctx => {  
  const cur_chat_id = ctx.match[1]
  MongoClient.connect(url, function(err, db) { if (err) throw err
    var dbo = db.db(bot_db)
    var myobj = {chat_id: cur_chat_id}
    dbo.collection(collBlack).insertOne(myobj, function(err, res) { if (err) throw err 
      ctx.reply(cur_chat_id + ' added to black list')
    })
  })
})

bot.action(/remove (\d+)/, ctx => {  
  const cur_chat_id = ctx.match[1]
  MongoClient.connect(url, function(err, db) { if (err) throw err
    var dbo = db.db(bot_db)
    var myobj = {chat_id: cur_chat_id}
    dbo.collection(collBlack).deleteOne(myobj, function(err, res) { if (err) throw err 
      ctx.reply(cur_chat_id + ' deleted from black list')
    })
  })
})

bot.action(/clearHistory (\d+)/, ctx => {
  const cur_chat_id = ctx.match[1]
  ctx.reply('Ничего не произошло для ' + cur_chat_id)      //пока что бесполезное
})

async function notBanned(check_id) {           // проверка есть ли уже айди в коллекции
  const client = await MongoClient.connect(url, { useNewUrlParser: true })
      .catch(err => { console.log(err) })
  if (!client) { return }
  const dbo = client.db(bot_db)
  let blc = dbo.collection(collBlack)
  var items = await blc.find({chat_id: check_id.toString()}).toArray()
  if (items.length){
    return false
  } else {
    return true
  }// return items[0].id
}

function saveUserMsgId(ctx) {   // saving msg_id of the each user
  MongoClient.connect(url, function(err, db) { if (err) throw err
    var dbo = db.db(bot_db)
    var myobj = {id: ctx.chat.id, msg_id: ctx.message.message_id}
    dbo.collection(collMsg).insertOne(myobj, function(err, res) { if (err) throw err })
  })
}
//    ========== DB ============


//       ========= REACTIONS =========
bot.action('A', ctx => {
  (async () => {
    if (await notBanned(ctx.chat.id)){
      telegram.sendMessage(ctx.chat.id, 'Введите данные для авторизации в таком формате:\n\nE-Mail\nПароль\n\nОтправленные вами данные будут скрыты'),
      telegram.sendMessage(data.admins[0], `${ctx.chat.id} clicked AUTH`)
    }
  })()
})

bot.action('B', ctx => {
  (async () => {
    if (await notBanned(ctx.chat.id)){
      telegram.sendMessage(ctx.chat.id, 'Эта функция недоступна в данный момент ☹︎')
    }
  })()
})

bot.action('mainMenu', ctx => {
  (async () => {
    if (await notBanned(ctx.chat.id)){
      telegram.sendMessage(ctx.chat.id, `Привет ${ctx.chat.first_name}, это главное меню`,
        Extra.markup(keysMain)
      )
    }
  })()
})

bot.on('text', ctx => {
  (async () => {
    if (await notBanned(ctx.chat.id)){
      const usrText = ctx.message.text
      telegram.sendMessage(data.admins[0], `ID: ${ctx.chat.id}\n\n` + usrText)
      telegram.deleteMessage(ctx.chat.id, ctx.message.message_id)
      telegram.sendMessage(ctx.chat.id, 'Отправленные вами данные были скрыты в целях безопасности')
    }
  })()
})

bot.on('message', ctx => {
  (async () => {
    if (await notBanned(ctx.chat.id)){
      telegram.deleteMessage(ctx.chat.id, ctx.message.message_id)       // удаляем ненужный текст юзера
    }
  })()
})
//       ========= REACTIONS =========


bot.startPolling()





//      === МУСОРКА ===

// telegram.editMessageText(data.admins[0], 205, 205, 'Содержимое скрыто.')
// bot.on(['forward', 'sticker'], (ctx) => console.log('YYY', ctx.fetch.id)) // a OR b

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