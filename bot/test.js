const Telegraf = require('telegraf')
const data = require('./data')

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
bot.start((ctx) => ctx.reply('Hello'))
bot.help((ctx) => ctx.reply('Help message'))
bot.launch()