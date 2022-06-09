const puppeteer = require('puppeteer-extra')
const { sendMessageFor } = require('simple-telegram-message')
const { MAIN_URL, TOKEN, USER_ID } = require('./constants')

const sleep = async ms => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const clickByXpath = async (page, xpath) => {
  const elements = await page.$x(xpath)
  return await elements[0].click()
}

const doesNotHaveErrorMsg = async page => {
  return await page.evaluate(() => {
    try {
      // eslint-disable-next-line no-undef
      const tableBody = document.querySelectorAll('div#messagesBox ul li')
      return Array.from(tableBody).length === 0
    } catch (err) {
      return false
    }
  })
}

const checkMsgLoop = async page => {
  console.log('running loop')
  await sleep(3000)
  await page.click('div.buttons.right button')
  await page.waitForNavigation({
    waitUntil: ['networkidle0', 'domcontentloaded'],
  })
  await sleep(1000)
  if (await doesNotHaveErrorMsg(page)) {
    return 'Found something'
  }
  await sleep(15000)
  return await checkMsgLoop(page)
}

const sendTelegram = async (msg = 'There is a possible time available') => {
  const sendMessage = sendMessageFor(TOKEN, USER_ID)
  await sendMessage(`${msg}`)
  await sleep(1000)
  await sendMessage(`RUN BITCH!`)
  await sleep(1000)
  await sendMessage(`RUN!`)
}

const scraping = async () => {
  let browser

  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
    })

    const page = await browser.newPage()

    let response = 'There is no time available'

    await page.goto(MAIN_URL)
    await page.waitForNavigation({
      waitUntil: ['networkidle0', 'domcontentloaded'],
    })

    await page.waitForSelector('#xi-cb-1')
    await page.click('#xi-cb-1')
    await sleep(500)
    await page.click('div.buttons.right button')
    await page.waitForNavigation({
      waitUntil: ['networkidle0', 'domcontentloaded'],
    })
    await sleep(500)
    await page.waitForXPath('//*[@id="xi-sel-400"]', { visible: true })
    //select BR as a citizenship
    await page.select('#xi-sel-400', '327')
    await sleep(200)
    await page.waitForXPath('//*[@id="xi-fs-19"]/div[3]', { visible: true })
    //select 2 person for the appointment
    await page.select('#xi-sel-422', '2')
    await sleep(200)
    //select yes for citzenship
    await page.select('#xi-sel-427', '1')
    await sleep(200)
    //select BR as a citizenship of the spouse
    await page.select('#xi-sel-428', '327-0')
    await sleep(500)

    //select reason
    await clickByXpath(page, '//*[@id="xi-div-30"]/div[1]/label/p')
    await sleep(200)
    //select reason section
    await clickByXpath(page, '//*[@id="inner-327-0-1"]/div/div[3]/label')
    await sleep(200)
    //select the proper service / skilled professinal with vacational training
    await clickByXpath(page, '//*[@id="SERVICEWAHL_EN327-0-1-1-305304"]')

    let foundSomething = await checkMsgLoop(page)

    if (foundSomething) {
      sendTelegram()
      response = foundSomething
    }
    return response
  } catch (err) {
    console.log('Error found', err)
    browser.close()
    return 'err'
  }
}

const startUp = async () => {
  const res = await scraping()
  console.log(res)
  if (res === 'err') {
    console.log('restarting')
    startUp()
  }
}

startUp()
