const {readFileSync} = require('fs')
const data = require('./data')
const Telegraf = require('telegraf')
const session = require('telegraf/session')
const TelegrafInlineMenu = require('telegraf-inline-menu')
const bot = new Telegraf(data.token)
let mainMenuToggle = true               // первое меню

const people = {Mark: {}, Paul: {}, Boris: {}, Kirk: {}, Юрец: {}} //  второе меню
const food = ['транс', 'жопа', 'священник', 'друг']    // третье меню

const menu = new TelegrafInlineMenu('Main Menu (первое меню)')
const foodMenu = new TelegrafInlineMenu('People like food. What do they like? (второе меню)')
const foodSelectSubmenu = new TelegrafInlineMenu(foodSelectText)
.select('f', food, {
  setFunc: (ctx, key) => {
    const person = ctx.match[1]
    people[person].food = key
  },
  isSetFunc: (ctx, key) => {
    const person = ctx.match[1]
    return people[person].food === key
  }
})

// загадки: 
//то назад 2 кнп то 1, когда+1, то показывает все равно 2 
//откуда берется эмоджи при выборе

//главное меню
menu.toggle('toggle (убрать меню)', 'a', {
  setFunc: (_ctx, newVal) => {  // _стх = обратное от стх? =- обратное от стх передать в нювал
    mainMenuToggle = newVal
  },
  isSetFunc: () => mainMenuToggle
})
menu.submenu('Food menu (следующее меню)', 'food', foodMenu, {
  hide: () => mainMenuToggle    // хайд == тру или фолс
})
//главное меню


//второе меню
foodMenu.selectSubmenu('p', () => Object.keys(people), foodSelectSubmenu, {
  textFunc: personButtonText,
  columns: 2
})
//второе меню


// FUNCTIONS
function personButtonText(_ctx, key) {
  const entry = people[key]
  if (entry && entry.food) {
    return `${key} (${entry.food} пока что)`
  }
  return key
}
function foodSelectText(ctx) {
  const person = ctx.match[1]
  const hisChoice = people[person].food
  if (!hisChoice) {
    return `${person} is still unsure what to eat. (третье меню)`
  }
  return `${person} likes ${hisChoice} currently. (третье меню)`
}
// FUNCTIONS





//                            nizhe ne interesno
menu.setCommand('start')

bot.use(session())
bot.use((ctx, next) => {
  if (ctx.callbackQuery) {
    console.log('callbackQuery happened', ctx.callbackQuery.data.length, ctx.callbackQuery.data)
  }
  return next()
})
bot.use(menu.init({
  backButtonText: 'назад на 1', 
  nextButtonText: 'вперед на 1',         // где это запрограммировано?
  mainMenuButtonText: 'в первое меню' // где это запрограммировано?
}))

async function startup() {
  await bot.launch()
  console.log(new Date(), 'имя бота =', bot.options.username)
}

startup()

// bot.catch(error => {
//   console.log('telegraf error', error.response, error.parameters, error.on || error)
// })

// menu.simpleButton('click me', 'c', {
//   doFunc: async ctx => ctx.answerCbQuery('you clicked me!'),
//   hide: () => mainMenuToggle
// })

// menu.simpleButton('click me harder', 'd', {
//   doFunc: async ctx => ctx.answerCbQuery('you can do better!'),
//   joinLastRow: true,              // что это вообще???
//   hide: () => mainMenuToggle
// })

// .simpleButton('Just a button', 'a', {
//   doFunc: async ctx => ctx.answerCbQuery('Just a callback query answer')
// })


// foodMenu.question('Add person', 'add', {
//   uniqueIdentifier: '666',
//   questionText: 'Who likes food too?',
//   setFunc: (_ctx, key) => {
//     people[key] = {}
//   }
// })

//let selectedKey = 'b'

// menu.select('s', ['A', 'B', 'C'], {
//   setFunc: async (ctx, key) => {
//     selectedKey = key
//     await ctx.answerCbQuery(`you selected ${key}`)
//   },
//   isSetFunc: (_ctx, key) => key === selectedKey
// })
//let isAndroid = true
// menu.submenu('Photo Menu', 'photo', new TelegrafInlineMenu('', {
//   photo: () => isAndroid ? 'https://telegram.org/img/SiteAndroid.jpg' : 'https://telegram.org/img/SiteiOs.jpg'
// }))

// .setCommand('photo')

// .select('img', ['iOS', 'Android'], {
//   isSetFunc: (_ctx, key) => key === 'Android' ? isAndroid : !isAndroid,
//   setFunc: (_ctx, key) => {
//     isAndroid = key === 'Android'
//   }
// })

// .toggle('Prefer Tee', 't', {
//   setFunc: (ctx, choice) => {
//     const person = ctx.match[1]
//     people[person].tee = choice
//   },
//   isSetFunc: ctx => {
//     const person = ctx.match[1]
//     return people[person].tee === true
//   }
// })