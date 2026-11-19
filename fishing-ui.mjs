import { isCorrectAnswer } from './problem-generator.mjs'
import { problemsForArea, generatePageProblem } from './page-problems.mjs'
import { areas, fish, fishInArea, rods, rarityNames, areaOdds, newProgress, restoreProgress, level, collected, canVisit, canBuy, canCatch, codeRodId, redeemRod, catchFish, saleValue, sell } from './fishing-game.mjs'

const get = id => document.getElementById(id)
const quiz = get('quiz')
const answer = get('answer')
const codeDialog = get('code-dialog')
const shrineButton = get('code-shrine')

function openCodeDialog() {
  if (quiz.open || codeDialog.open || shrineButton.hidden) return
  get('code-form').reset()
  get('code-result').textContent = ''
  codeDialog.showModal()
  get('reward-code').focus()
}

shrineButton.addEventListener('click', openCodeDialog)
get('code-close').addEventListener('click', () => codeDialog.close())
get('code-form').addEventListener('submit', event => {
  event.preventDefault()
  if (shrineButton.hidden) return
  const result = redeemRod(structuredClone(progress), get('reward-code').value)
  const feedback = get('code-result')
  if (result === 'invalid') feedback.textContent = 'あいことばがちがいます。'
  if (result === 'owned') feedback.textContent = '秘宝の竿は受け取り済みです。'
  if (result === 'redeemed') {
    if (commit(state => redeemRod(state, get('reward-code').value), '秘宝の竿を手に入れ、装備しました！')) {
      playTreasureFanfare()
      codeDialog.close()
    } else {
      feedback.textContent = '保存できませんでした。'
    }
  }
})
const choice = get('choice')
const storageKey = 'ratio-fishing-v1'
const fishExpansions = ['fish-atlas-river', 'fish-atlas-frontier', 'fish-atlas-ocean']
const areaAtlases = ['area-portraits', 'area-portraits-inland', 'area-portraits-ocean']
const problemArtCells = {
  capacity: 0, ratio: 1, part: 2, groups: 2, compared: 3, base: 3,
  priceUp: 4, priceBefore: 4, equation: 5, priceRatio: 4, percent: 6, percentPart: 7,
  percentBase: 4, bus: 8, buai: 6, comparison: 9, sale: 4, original: 4, increase: 10, tax: 11,
  whichBase: 2, remainingRate: 5, decreaseAmount: 3, chooseExpression: 5, restPart: 7,
  equalGrowth: 9, discountCompare: 4, taxBefore: 1, taxDiscount: 11,
  timesTable: 5, exactDivision: 5, groupsTotal: 3, groupSize: 3, groupsCount: 3, tensTimes: 6, tensDivide: 6,
}
const views = { collection: '図鑑', inventory: '魚かご', shop: '店', map: '地図' }
const saleSelection = new Set()
const recent = new Map()
const questionBags = new Map()
const lastTypes = new Map()
const percentFormat = new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 2 })
const foundationHints = {
  timesTable: '同じ数を何回分集めるか考えましょう。',
  exactDivision: '割る数に何をかけると、もとの数になりますか。',
  groupsTotal: '1つ分の数に、いくつ分あるかをかけましょう。',
  groupSize: '全部の数を、分ける組の数で割りましょう。',
  groupsCount: '全部の数を、1組分の数で割りましょう。',
  tensTimes: '10のまとまりが何個あるか、九九で考えましょう。',
  tensDivide: '10のまとまりを、同じ数ずつ分けて考えましょう。',
}
let progress = newProgress()
let question
let view = 'collection'
let collectionArea = null
let world
let dockReady = false
let saleIds = null
let streak = 0
let catchSound = null
const drawer = get('drawer')
const shortcuts = [...document.querySelectorAll('.hotbar button')]

try {
  const saved = localStorage.getItem(storageKey)
  if (saved) progress = restoreProgress(JSON.parse(saved))
} catch {
  get('notice').textContent = '保存データを読み込めませんでした。'
}

function updateProgress(change) {
  const updated = structuredClone(progress)
  const result = change(updated)
  try {
    localStorage.setItem(storageKey, JSON.stringify(updated))
  } catch {
    return { saved: false }
  }
  progress = updated
  return { saved: true, result }
}

function make(tag, text, className) {
  const node = document.createElement(tag)
  if (text) node.textContent = text
  if (className) node.className = className
  return node
}

function button(label, action, disabled = false) {
  const node = make('button', label)
  node.type = 'button'
  node.disabled = disabled
  node.addEventListener('click', action)
  return node
}

function icon(kind, id, rarity = 0) {
  const art = make('span', '', 'loot-art rarity-' + rarity)
  art.setAttribute('aria-hidden', 'true')
  const sprite = make('span', '', kind + '-sprite')
  const addedFish = id - 74
  const [atlas, cols, rows, cell] = kind === 'fish'
    ? addedFish >= 0 ? [`expedition-fish-${Math.floor(addedFish / 16)}`, 4, 4, addedFish % 16]
      : fish[id].unlockArea ? ['fish-atlas-milestones', 4, 2, fish[id].area]
      : id < 18 ? ['fish-atlas', 6, 3, id] : [fishExpansions[Math.floor((id - 18) / 16)], 4, 4, (id - 18) % 16]
    : id >= 15 ? ['expedition-rods', 4, 4, id - 15]
    : id < 5 ? ['rod-atlas', 3, 2, id] : ['rod-atlas-expedition', 5, 2, id - 5]
  sprite.style.backgroundImage = `url("./assets/${atlas}.png")`
  sprite.style.backgroundSize = `${cols * 100}% ${rows * 100}%`
  sprite.style.backgroundPosition = `${cell % cols * 100 / (cols - 1)}% ${Math.floor(cell / cols) * 100 / (rows - 1)}%`
  art.append(sprite)
  return art
}

function item(title, detail, action, art) {
  const row = make('li', '', 'item')
  const info = make('div', '', 'item-info')
  info.append(make('strong', title), make('small', detail))
  if (art) row.append(art)
  row.append(info)
  if (action) row.append(action)
  return row
}

function render() {
  get('stats').textContent = `Lv ${level(progress)}　·　${progress.xp} XP　·　${progress.coins} コイン`
  get('xp-bar').value = progress.xp % 100
  get('xp-label').textContent = `${progress.xp % 100} / 100`
  renderStreak()
  get('area-name').textContent = areas[progress.area].name
  get('rod-name').textContent = rods[progress.rod].name
  const slotArt = get('rod-slot-art')
  if (slotArt.dataset.rod !== String(progress.rod)) {
    slotArt.replaceChildren(icon('rod', progress.rod))
    slotArt.dataset.rod = progress.rod
  }
  const total = progress.xp / 10
  const target = total < 2 ? 2 : (Math.floor(total / 10) + 1) * 10
  get('quest-text').textContent = target === 2 ? '魚を2匹釣ろう！' : `魚を合計${target}匹釣ろう！`
  get('quest-count').textContent = `${total} / ${target}`
  for (const tab of document.querySelectorAll('[data-view]')) {
    if (tab.dataset.view === 'collection') tab.hidden = !progress.collection.length
    tab.setAttribute('aria-expanded', String(!drawer.hidden && tab.dataset.view === view))
  }
  const panel = get('panel')
  panel.setAttribute('aria-label', views[view])
  panel.replaceChildren(make('h2', views[view]))
  const list = make('ul')
  if (view === 'collection') {
    const area = collectionArea ?? progress.area
    const selector = make('select')
    selector.setAttribute('aria-label', '図鑑の釣り場')
    for (const [id, entry] of areas.entries()) {
      selector.add(new Option(`${entry.name}　${collected(progress, id)} / ${fishInArea[id].length} 種`, id))
    }
    selector.value = area
    selector.addEventListener('change', () => {
      collectionArea = Number(selector.value)
      render()
      get('panel').querySelector('select').focus()
    })
    panel.append(selector)
    list.className = 'collection-grid'
    for (const entry of fishInArea[area]) {
      if (progress.collection.includes(entry.id)) {
        list.append(item(entry.name, entry.unlockArea ? entry.label + ' · ステージ限定' : entry.label, null, icon('fish', entry.id, entry.rarity)))
      } else {
        const mystery = make('span', '？', 'loot-art mystery-art')
        mystery.setAttribute('aria-hidden', 'true')
        if (entry.unlockArea) {
          const detail = canCatch(progress, entry) ? '解放済み · ここで釣れる' : areas[entry.unlockArea].name + 'を解放'
          list.append(item('ステージ限定', detail, null, mystery))
        } else {
          list.append(item('未発見', '', null, mystery))
        }
      }
    }
  } else if (view === 'inventory') {
    const ids = fish.filter(entry => progress.inventory[entry.id]).map(entry => entry.id)
    if (!ids.length) panel.append(make('p', '桟橋で魚を釣ると、ここに入ります。'))
    for (const id of ids) {
      const { name, price, rarity } = fish[id]
      const checkbox = make('input')
      checkbox.type = 'checkbox'
      checkbox.checked = saleSelection.has(id)
      checkbox.setAttribute('aria-label', name + 'を売却対象にする')
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) saleSelection.add(id)
        else saleSelection.delete(id)
        saleIds = null
        const confirm = get('sale-confirm')
        if (confirm) confirm.remove()
        get('sell-selected').disabled = !saleSelection.size
      })
      list.append(item(name, `${progress.inventory[id]} 匹 · 1匹 ${price} コイン`, checkbox, icon('fish', id, rarity)))
    }
    if (ids.length) {
      const selected = button('選んだ魚を売る', () => confirmSale([...saleSelection]), !saleSelection.size)
      selected.id = 'sell-selected'
      const actions = make('div', '', 'actions')
      actions.append(selected, button('全て売る', () => confirmSale(ids)))
      panel.append(list, actions)
      return
    }
  } else if (view === 'shop') {
    panel.append(make('p', `${areas[progress.area].name}での抽選確率（初回正解・通常抽選）`, 'shop-odds-note'))
    for (const [id, rod] of rods.entries()) {
      const owned = progress.owned.includes(id)
      if (id === codeRodId) {
        if (owned) {
          const equipped = progress.rod === id
          panel.append(item(rod.name, '石碑の景品', button(equipped ? '装備中' : '装備する',
            () => commit(state => { state.rod = id }, rod.name + 'を装備しました。'), equipped), icon('rod', id)))
        }
        continue
      }
      const equipped = progress.rod === id
      const registered = collected(progress, rod.area)
      const coinShortfall = Math.max(0, rod.price - progress.coins)
      const fishShortfall = Math.max(0, rod.required - registered)
      const action = owned
        ? button(equipped ? '装備中' : '装備する', () => commit(s => { s.rod = id }, rod.name + 'を装備しました。'), equipped)
        : button(`${rod.price} コイン`, () => {
          if (canBuy(progress, rod) && !progress.owned.includes(id)) {
            commit(s => { s.coins -= rod.price; s.owned.push(id) }, rod.name + 'を買いました。')
          }
        }, !canBuy(progress, rod))
      const odds = areaOdds(progress, id).map((chance, rarity) => `${rarityNames[rarity]} ${percentFormat.format(chance)}%`).join(' · ')
      const tier = rod.odds[4] >= 3 ? 4 : rod.odds[4] >= 1.5 ? 3 : rod.odds[3] >= 2 ? 2 : id ? 1 : 0
      const row = item(rod.name, odds, action, icon('rod', id, tier))
      if (!owned && rod.required > 0) {
        row.querySelector('.item-info').append(make('small',
          `購入条件　${areas[rod.area].name}の魚を図鑑に${rod.required}種類登録（現在${registered}種類）`))
      }
      const missing = []
      if (!owned && coinShortfall) missing.push(`あと${coinShortfall}コイン`)
      if (!owned && fishShortfall) missing.push(`図鑑にあと${fishShortfall}種類`)
      if (missing.length) {
        row.querySelector('.item-info').append(make('small', missing.join(' · '), 'shop-shortfall'))
      }
      list.append(row)
    }
  } else {
    list.className = 'area-list'
    for (const [id, area] of areas.entries()) {
      const active = progress.area === id
      const unlocked = canVisit(progress, area)
      const condition = area.required ? `Lv ${area.level} ＋ ${areas[area.previous].name} ${area.required} 種` : '初めの釣り場'
      const travel = button(active ? '現在地' : unlocked ? '移動する' : '未解放', () => {
        if (canVisit(progress, area) && commit(s => { s.area = id }, area.name + 'に着きました。')) {
          question = null
          world?.changeArea(id)
        }
      }, active || !unlocked)
      const card = item(area.name, condition, travel)
      card.classList.add('area-card')
      const art = make('span', '', 'area-art')
      const atlas = areaAtlases[Math.floor(id / 3)] ?? `expedition-areas-${Math.floor((id - 9) / 3)}`
      art.style.backgroundImage = `url("./assets/${atlas}.png")`
      art.style.backgroundPositionY = id % 3 * 50 + '%'
      if (active) card.classList.add('area-current')
      art.setAttribute('aria-hidden', 'true')
      card.prepend(art)
      list.append(card)
    }
  }
  panel.append(list)
}

function renderStreak() {
  const badge = get('streak')
  badge.hidden = streak < 2
  badge.textContent = `🔥 ${streak} 連続正解`
}

function showCatch(caught, isNew, leveledUp, unlockedCollection) {
  const target = get('catch-art')
  const reward = make('div', '', 'catch-card catch-rarity-' + caught.rarity)
  const title = caught.rarity ? caught.label + 'を釣り上げた！' : '正解！ 釣れた！'
  const headline = make('strong', title, 'catch-headline')
  if (isNew) {
    reward.classList.add('first-discovery')
    reward.append(make('span', '✦ 新種発見！ ✦', 'discovery-banner'))
  }
  const portrait = make('div', '', 'catch-portrait')
  const ring = make('span', '', 'catch-ring')
  ring.setAttribute('aria-hidden', 'true')
  const xp = make('span', '+10 XP', 'catch-xp')
  portrait.append(ring, icon('fish', caught.id, caught.rarity), xp)
  const particles = make('span', '', 'catch-particles')
  particles.setAttribute('aria-hidden', 'true')
  const count = [24, 32, 44, 52, 60][caught.rarity] + (isNew ? 16 : 0)
  const colors = ['#91ffe2', '#ffe29a', '#ff9cc6', '#aab8ff', '#fff9dc']
  for (let i = 0; i < count; i++) {
    const spark = make('i')
    spark.style.setProperty('--angle', i * 360 / count + 'deg')
    spark.style.setProperty('--distance', (isNew ? 98 : 75) + (i * 19 % 8) * 19 + 'px')
    spark.style.setProperty('--particle', colors[i % colors.length])
    spark.style.setProperty('--spin', i % 2 ? '490deg' : '-390deg')
    particles.append(spark)
  }
  portrait.append(particles)
  const details = make('div', '', 'catch-details')
  details.append(make('span', caught.label, 'catch-tier'), make('strong', caught.name, 'catch-name'))
  const rewards = make('div', '', 'catch-rewards')
  if (unlockedCollection) rewards.append(make('span', '図鑑解放！'))
  else if (isNew) rewards.append(make('span', '図鑑 NEW'))
  if (caught.unlockArea) rewards.append(make('span', 'ステージ限定'))
  if (leveledUp) rewards.append(make('span', `レベルアップ！ Lv ${level(progress)}`))
  if (streak > 1) rewards.append(make('span', `🔥 ${streak} 連続正解`))
  if (rewards.childElementCount) details.append(rewards)
  reward.append(headline, portrait, details)
  target.replaceChildren(reward)
  target.hidden = false
  quiz.classList.add('catch-mode')
  get('question-body').hidden = true
}

const soundButton = get('catch-sound')
soundButton.addEventListener('click', async () => {
  if (soundButton.getAttribute('aria-pressed') === 'true') {
    soundButton.setAttribute('aria-pressed', 'false')
    soundButton.textContent = '効果音 オフ'
    return
  }
  try {
    catchSound ??= new AudioContext()
    await catchSound.resume()
    soundButton.setAttribute('aria-pressed', 'true')
    soundButton.textContent = '効果音 オン'
  } catch {
    soundButton.disabled = true
    soundButton.textContent = '効果音 利用不可'
  }
})

async function playTreasureFanfare() {
  if (!get('code-sound').checked) return
  try {
    catchSound ??= new AudioContext()
    await catchSound.resume()
    const now = catchSound.currentTime
    const melody = [392, 523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98]
    melody.forEach((frequency, index) => {
      soundNote(frequency, now + index * .09, .29, .065, 'triangle')
      soundNote(frequency * 2, now + index * .09, .19, .021, 'sine')
    })
    for (const frequency of [130.81, 261.63, 392, 523.25, 659.25, 783.99, 1046.5]) {
      soundNote(frequency, now + .64, .95, .04, 'triangle')
    }
    for (const [index, frequency] of [2093, 2637, 3136, 4186].entries()) {
      soundNote(frequency, now + .75 + index * .11, .36, .018, 'sine')
    }
  } catch {
    // The reward is already saved if audio is unavailable.
  }
}

function soundNote(frequency, start, duration, peak, type) {
  const voice = catchSound.createOscillator()
  const volume = catchSound.createGain()
  voice.type = type
  voice.frequency.value = frequency
  volume.gain.setValueAtTime(.001, start)
  volume.gain.exponentialRampToValueAtTime(peak, start + .018)
  volume.gain.exponentialRampToValueAtTime(.001, start + duration - .01)
  voice.connect(volume).connect(catchSound.destination)
  voice.start(start)
  voice.stop(start + duration)
}

function playCatchSound(rarity, leveledUp, isNew) {
  if (soundButton.getAttribute('aria-pressed') !== 'true' || catchSound?.state !== 'running') return
  const notes = isNew || rarity >= 3 ? [523, 659, 784, 988, 1047, 1319, 1568]
    : leveledUp || rarity === 2 ? [523, 659, 784, 1047, 1319]
    : rarity === 1 ? [587, 740, 880, 1175] : [523, 659, 1047]
  const now = catchSound.currentTime
  for (const [index, frequency] of notes.entries()) {
    const start = now + index * .086
    soundNote(frequency, start, .25, .048, 'sine')
  }
}

function commit(change, message) {
  if (!updateProgress(change).saved) {
    get('notice').textContent = '保存できませんでした。ブラウザの保存設定を確認してください。'
    return false
  }
  render()
  get('notice').textContent = message
  return true
}

function confirmSale(ids) {
  saleIds = ids
  get('sale-confirm')?.remove()
  const section = make('div', '', 'sale-confirm')
  section.id = 'sale-confirm'
  const amount = saleValue(progress, ids)
  const confirm = button('売却を確定', () => {
    if (saleIds !== ids) return
    if (commit(s => sell(s, ids), `${amount} コインを受け取りました。`)) {
      saleIds = null
      saleSelection.clear()
      render()
      document.querySelector('[data-view=inventory]').focus()
    }
  })
  section.append(make('p', `合計 ${amount} コインで売りますか？`), confirm,
    button('取り消す', () => { saleIds = null; section.remove(); get('sell-selected').focus() }))
  get('panel').append(section)
  confirm.focus()
}

function fingerprint(problem) {
  return JSON.stringify([problem.prompt, problem.table?.rows])
}

function newQuestion() {
  const key = progress.area
  let bag = questionBags.get(key)
  if (!bag?.length) {
    bag = [...problemsForArea(key)]
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const current = bag[i]
      bag[i] = bag[j]
      bag[j] = current
    }
    if (bag.length > 1 && bag.at(-1)[1] === lastTypes.get(key)) bag.unshift(bag.pop())
    questionBags.set(key, bag)
  }
  const [label, type] = bag.pop()
  lastTypes.set(key, type)
  const previous = recent.get(type) ?? []
  const start = Math.floor(Math.random() * 48000)
  let problem
  for (let offset = 0; offset < 48000; offset++) {
    problem = generatePageProblem(type, (start + offset) % 48000)
    if (!previous.includes(fingerprint(problem))) break
  }
  recent.set(type, [...previous.slice(-9), fingerprint(problem)])
  question = { problem, type, attempts: 0, done: false }
  get('problem-label').textContent = label
  get('prompt').textContent = problem.prompt
  const imageCell = problemArtCells[type]
  const art = get('problem-art')
  art.hidden = imageCell === undefined
  if (!art.hidden) art.style.backgroundPosition = `${imageCell % 4 * 100 / 3}% ${Math.floor(imageCell / 4) * 50}%`
  get('problem-table').replaceChildren()
  if (problem.table) {
    const table = make('table')
    const head = table.createTHead().insertRow()
    for (const column of problem.table.columns) {
      const cell = make('th', column)
      cell.scope = 'col'
      head.append(cell)
    }
    const body = table.createTBody()
    for (const row of problem.table.rows) {
      const tr = body.insertRow()
      for (const value of row) tr.insertCell().textContent = value
    }
    get('problem-table').append(table)
  }
  answer.value = ''
  answer.inputMode = typeof problem.answer.value === 'number' ? 'decimal' : 'text'
  get('number-label').hidden = Boolean(problem.choices)
  get('choice-label').hidden = !problem.choices
  choice.replaceChildren(new Option('選んでください', ''), ...(problem.choices ?? []).map(name => new Option(name, name)))
  get('unit').textContent = problem.answer.unit
  get('feedback').textContent = ''
  get('catch-art').hidden = true
  get('catch-art').replaceChildren()
  get('question-body').hidden = false
  quiz.classList.remove('catch-mode')
  get('feedback').className = ''
  get('solution').hidden = true
  get('next').hidden = true
  get('submit-answer').disabled = false
  answer.disabled = false
  choice.disabled = false
}

function openQuiz() {
  if (!dockReady || quiz.open) return
  if (!question) newQuestion()
  quiz.showModal()
  focusQuestion()
}

function focusQuestion() {
  if (question.done) get('next').focus()
  else (question.problem.choices ? choice : answer).focus()
}

function resolveQuestion(message, success = false) {
  question.done = true
  get('submit-answer').disabled = true
  answer.disabled = true
  choice.disabled = true
  get('solution').hidden = true
  get('next').hidden = false
  get('feedback').textContent = message
  get('feedback').className = success ? 'success' : ''
  focusQuestion()
}

function meaningfulInput(problem, raw) {
  const value = raw.normalize('NFKC').trim()
  if (problem.choices) return problem.choices.includes(value)
  if (typeof problem.answer.value === 'string') return /^(?:[0-9]+[割分厘]\s*)+$/.test(value)
  const unit = problem.answer.unit.normalize('NFKC')
  const amount = unit && value.endsWith(unit) ? value.slice(0, -unit.length).trimEnd() : value
  return /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$|^\.\d+$/.test(amount)
}

get('answer-form').addEventListener('submit', event => {
  event.preventDefault()
  if (!question || question.done) return
  const { problem } = question
  const raw = problem.choices ? choice.value : answer.value
  if (!meaningfulInput(problem, raw)) {
    const instruction = problem.choices ? '答えを選びましょう。'
      : typeof problem.answer.value === 'string' ? '「3割5分」のように入力しましょう。' : '答えを数字で入力しましょう。'
    get('feedback').textContent = instruction
    return
  }
  if (isCorrectAnswer(problem, raw)) {
    const previousLevel = level(progress)
    const hadCollection = progress.collection.length > 0
    const retried = question.attempts > 0
    const { saved, result } = updateProgress(state => catchFish(state, Math.random, { retried }))
    if (!saved) {
      get('feedback').textContent = '保存できませんでした。入力を残しています。もう一度お試しください。'
      return
    }
    const { caught, isNew } = result
    const leveledUp = level(progress) > previousLevel
    streak++
    const collectionMessage = !hadCollection ? ' · 図鑑解放！' : isNew ? ' · 図鑑に登録' : ''
    const message = `${retried ? '解き直しで正解！' : '正解！'} ${caught.name}（${caught.label}）が釣れました。 +10 XP${collectionMessage}`
    showCatch(caught, isNew, leveledUp, !hadCollection)
    resolveQuestion(message, true)
    saleIds = null
    render()
    get('notice').textContent = message
    playCatchSound(caught.rarity, leveledUp, isNew)
    return
  }
  question.attempts++
  streak = 0
  renderStreak()
  get('solution').hidden = false
  get('next').hidden = false
  const tip = foundationHints[question.type] ?? (question.attempts === 1
    ? '問題がたずねている量と、くらべるもとを確認しましょう。'
    : '問題に出てくる数が、もとにする量・くらべる量・割合のどれに当たるか考えましょう。')
  get('feedback').textContent = tip + (question.attempts === 1
    ? `解き直して正解すると「${rarityNames[0]}」の魚が釣れます。` : '')
})
get('solution').addEventListener('click', () => {
  if (question.done || !question.attempts) return
  const { answer, explanation } = question.problem
  resolveQuestion(`答えは ${answer.value}${answer.unit} です。 ${explanation}`)
})
get('next').addEventListener('click', () => { newQuestion(); focusQuestion() })
get('close-quiz').addEventListener('click', () => quiz.close())
get('fish-button').addEventListener('click', openQuiz)
get('dock').addEventListener('click', () => { world?.goToDock(); get('fish-button').focus() })
get('rod-slot').addEventListener('click', () => {
  if (dockReady) openQuiz()
  else { world?.goToDock(); get('fish-button').focus() }
})
const stick = get('move-stick')
let stickPointer
function updateStick(event) {
  const bounds = stick.getBoundingClientRect()
  const radius = bounds.width / 3
  const x = (event.clientX - bounds.left - bounds.width / 2) / radius
  const y = (event.clientY - bounds.top - bounds.height / 2) / radius
  const scale = Math.max(1, Math.hypot(x, y))
  stick.firstElementChild.style.transform = `translate(${x / scale * radius}px, ${y / scale * radius}px)`
  world?.setTouchMovement(x / scale, y / scale)
}
function releaseStick() {
  if (stickPointer === undefined) return
  const id = stickPointer
  stickPointer = undefined
  if (stick.hasPointerCapture(id)) stick.releasePointerCapture(id)
  stick.firstElementChild.style.removeProperty('transform')
  world?.setTouchMovement(0, 0)
}
stick.addEventListener('pointerdown', event => {
  if (!world || stickPointer !== undefined || event.button !== 0) return
  stickPointer = event.pointerId
  stick.setPointerCapture(event.pointerId)
  updateStick(event)
})
stick.addEventListener('pointermove', event => {
  if (event.pointerId === stickPointer) updateStick(event)
})
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  stick.addEventListener(name, event => {
    if (event.pointerId === stickPointer) releaseStick()
  })
}
stick.addEventListener('contextmenu', event => event.preventDefault())
window.addEventListener('blur', releaseStick)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) releaseStick()
})
quiz.addEventListener('close', releaseStick)

for (const control of document.querySelectorAll('[data-move]')) {
  control.addEventListener('pointerdown', event => {
    if (!world || event.button !== 0) return
    control.setPointerCapture(event.pointerId)
    world.step(control.dataset.move)
    world.moveWithPointer(event.pointerId, control.dataset.move)
  })
  for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    control.addEventListener(eventName, event => world?.moveWithPointer(event.pointerId))
  }
  control.addEventListener('contextmenu', event => event.preventDefault())
  control.addEventListener('click', event => {
    if (event.detail === 0) world?.step(control.dataset.move)
  })
}
for (const tab of document.querySelectorAll('[data-view]')) {
  tab.addEventListener('click', () => {
    if (tab.hidden) return
    drawer.hidden = !drawer.hidden && view === tab.dataset.view
    view = tab.dataset.view
    saleIds = null
    render()
  })
}
function closePanel() {
  drawer.hidden = true
  render()
  document.querySelector(`[data-view="${view}"]`).focus()
}
get('close-panel').addEventListener('click', closePanel)
window.addEventListener('keydown', event => {
  if (quiz.open || codeDialog.open || event.repeat || event.ctrlKey || event.metaKey || event.altKey ||
      event.target?.closest?.('input, select, textarea')) return
  if (event.key === 'Escape' && !drawer.hidden) closePanel()
  if (/^[1-5]$/.test(event.key)) shortcuts[Number(event.key) - 1].click()
})

function setDock(available) {
  dockReady = available
  get('fish-button').disabled = !available
  const touch = matchMedia('(pointer: coarse)').matches
  const note = get('world-note')
  note.hidden = touch
  note.textContent = available ? 'E キーで釣りを始める' : 'WASDで移動 · ドラッグまたはQ／Rで視点回転'
}

setDock(false)
render()
try {
  const { createWorld } = await import('./fishing-world.mjs')
  world = await createWorld(get('viewport'), {
    onDock: setDock, onFish: openQuiz,
    onShrine: near => { shrineButton.hidden = !near },
    openShrine: openCodeDialog,
    inputBlocked: () => quiz.open || codeDialog.open,
  })
  world.changeArea(progress.area)
} catch (error) {
  console.error(error)
  setDock(true)
  get('world-note').hidden = false
  get('world-note').textContent = 'この環境では3Dを表示できません。釣り問題と持ち物は引き続き使えます。'
  get('dock').hidden = true
  document.querySelector('.dpad').hidden = true
  stick.hidden = true
}
