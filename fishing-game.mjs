export const rarityNames = Object.freeze(['ノーマル', 'レア', 'エピック', 'レジェンド', 'ミシック'])
const prices = [12, 30, 75, 150, 300]

export const areas = [
  { name: 'みどり池', level: 1, previous: 0, required: 0, species: ['メダカ', 'フナ', 'ドジョウ', 'コイ', 'ウナギ', '星ひれゴイ'] },
  { name: 'しおかぜ浜', level: 2, previous: 0, required: 3, species: ['イワシ', 'アジ', 'ハゼ', 'カレイ', 'タコ', '月光タイ'] },
  { name: 'ひかり洞窟', level: 4, previous: 1, required: 4, species: ['ヌマエビ', 'カワムツ', 'ヨシノボリ', '透明ナマズ', '青光ウナギ', '水晶リュウグウノツカイ'] },
  { name: 'かわせみ渓流', level: 5, previous: 2, required: 4, species: ['アユ', 'オイカワ', 'ウグイ', 'モクズガニ', 'ヤマメ', 'イワナ', 'カワセミマス', '翡翠アユ'] },
  { name: 'もみじ峡谷', level: 7, previous: 3, required: 5, species: ['カワニナ', 'カジカ', 'アブラハヤ', 'サワガニ', 'アマゴ', 'ニジマス', '黄金イワナ', '紅葉サーモン'] },
  { name: 'オーロラ氷原', level: 9, previous: 4, required: 5, species: ['ワカサギ', 'シラウオ', 'トゲウオ', 'スジエビ', 'ホッキョクイワナ', '白銀マス', '氷紋パイク', 'オーロラトラウト'] },
  { name: 'ほむら火山港', level: 11, previous: 5, required: 5, species: ['サンマ', 'カサゴ', 'ウツボ', 'イセエビ', 'マグマフグ', '火花アンコウ', '緋色ガニ', '溶岩ドラゴンフィッシュ'] },
  { name: 'なないろ礁', level: 13, previous: 6, required: 6, species: ['クマノミ', 'デバスズメダイ', 'チョウチョウウオ', 'ヤドカリ', 'ナンヨウハギ', 'タツノオトシゴ', 'ナポレオンフィッシュ', '虹色マンタ'] },
  { name: '星夜の外洋', level: 15, previous: 7, required: 6, species: ['チョウチンハダカ', 'メギス', 'キンメダイ', 'ダイオウグソクムシ', 'メンダコ', 'ミズウオ', 'ホタルイカ', '星雲クジラ'] },
]

const regularFish = areas.flatMap(({ species }, area) => {
  const normalCount = species.length === 6 ? 3 : 4
  return species.map((name, index) => ({
    area, name, rarity: area === 8 && index >= 6 ? (index === 7 ? 4 : 2)
      : index < normalCount ? 0 : index < species.length - 1 ? 1 : 2,
  }))
}).map(({ area, name, rarity }, id) => {
  const rate = area <= 2 ? 1 : [1.35, 1.65, 2, 2.4, 2.8, 3.2][area - 3]
  return { id, area, name, rarity, label: rarityNames[rarity], price: Math.round(prices[rarity] * rate) }
})
const milestones = ['朝焼けメダカ', '潮風トビウオ', '紫晶ウーパールーパー', '滝しぶきマス',
  '紅葉ゴイ', '雪華イワナ', '黒曜スズキ', '真珠オウムガイ']
export const fish = regularFish.concat(milestones.map((name, area) => ({
  id: regularFish.length + area, area, name, rarity: area < 4 ? 3 : 4, label: rarityNames[area < 4 ? 3 : 4],
  price: (area < 4 ? 175 : 350) + area * 26, unlockArea: area + 1,
})))
export const fishInArea = areas.map((_, area) => fish.filter(item => item.area === area))

export const rods = [
  { name: 'はじめの竿', price: 0, area: 0, required: 0, odds: [75, 22, 2.6, .35, .05] },
  { name: 'ねらい竿', price: 80, area: 0, required: 3, odds: [55, 35, 8.6, 1.2, .2] },
  { name: '小魚の竿', price: 55, area: 0, required: 3, odds: [90, 9, .86, .12, .02] },
  { name: '星ひれの竿', price: 190, area: 0, required: 6, odds: [40, 45, 12.2, 2.4, .4] },
  { name: '月光の竿', price: 360, area: 1, required: 6, odds: [30, 45, 20.2, 4, .8] },
  { name: '水晶の竿', price: 290, area: 2, required: 4, odds: [40, 36, 19.5, 3.8, .7] },
  { name: '瀬なみの竿', price: 115, area: 3, required: 3, odds: [72, 24, 3.3, .6, .1] },
  { name: '翡翠の竿', price: 400, area: 3, required: 6, odds: [31, 45, 19.1, 4.1, .8] },
  { name: '紅葉の竿', price: 490, area: 4, required: 6, odds: [24, 52, 18.8, 4.2, 1] },
  { name: '氷紋の竿', price: 235, area: 5, required: 4, odds: [56, 37, 5.7, 1.1, .2] },
  { name: '極光の竿', price: 730, area: 5, required: 7, odds: [26, 44, 22, 6.5, 1.5] },
  { name: '黒曜の竿', price: 870, area: 6, required: 6, odds: [20, 52, 19.5, 6.8, 1.7] },
  { name: '珊瑚の竿', price: 980, area: 7, required: 5, odds: [35, 36, 20, 7, 2] },
  { name: '深潮の竿', price: 340, area: 8, required: 4, odds: [47, 44, 7, 1.7, .3] },
  { name: '星図の竿', price: 1580, area: 8, required: 8, odds: [18, 44, 25, 9.5, 3.5] },
]

export function newProgress() {
  return {
    xp: 0, coins: 0, area: 0, rod: 0, owned: [0],
    collection: [], inventory: Array(fish.length).fill(0), misses: Array(areas.length).fill(0),
  }
}

export function restoreProgress(saved) {
  const defaults = newProgress()
  if (!saved || typeof saved !== 'object') return defaults
  return {
    ...defaults, ...saved,
    inventory: defaults.inventory.map((_, index) => saved.inventory?.[index] ?? 0),
    misses: defaults.misses.map((_, index) => saved.misses?.[index] ?? 0),
  }
}

export const level = state => Math.floor(state.xp / 100) + 1
export const collected = (state, area) => state.collection.filter(id => fish[id].area === area).length
export const canVisit = (state, area) =>
  level(state) >= area.level && collected(state, area.previous) >= area.required
export const canBuy = (state, rod) => state.coins >= rod.price && collected(state, rod.area) >= rod.required
export const canCatch = (state, item) => item.unlockArea === undefined || canVisit(state, areas[item.unlockArea])

function rarityDistribution(local, rod) {
  const counts = rarityNames.map((_, rarity) => local.filter(item => item.rarity === rarity).length)
  const odds = rods[rod].odds.slice()
  for (let tier = odds.length - 1; tier > 0; tier--) {
    if (counts[tier]) continue
    odds[tier - 1] += odds[tier]
    odds[tier] = 0
  }
  return { counts, odds }
}

export function areaOdds(state, rod) {
  const local = fishInArea[state.area].filter(item => canCatch(state, item))
  return rarityDistribution(local, rod).odds
}

export function catchFish(state, random = Math.random, { retried = false } = {}) {
  const { area, rod, xp } = state
  const local = fishInArea[area].filter(item => canCatch(state, item))
  const unseen = local.filter(item => !state.collection.includes(item.id))
  const candidates = retried ? local.filter(item => item.rarity === 0)
    : state.misses[area] >= 8 && unseen.length ? unseen : local
  const { counts, odds } = rarityDistribution(local, rod)
  const weights = candidates.map(item => odds[item.rarity] / counts[item.rarity])
  let roll = random() * weights.reduce((total, weight) => total + weight, 0)
  const index = weights.findIndex(weight => (roll -= weight) < 0)
  const caught = xp < 30 ? fish[xp / 10] : candidates[index < 0 ? candidates.length - 1 : index]
  const isNew = !state.collection.includes(caught.id)
  if (isNew) state.collection.push(caught.id)
  state.misses[area] = isNew || !unseen.length ? 0 : state.misses[area] + 1
  state.inventory[caught.id]++
  state.xp += 10
  return { caught, isNew }
}

export function saleValue(state, ids) {
  return [...new Set(ids)].reduce((total, id) => total + fish[id].price * state.inventory[id], 0)
}

export function sell(state, ids) {
  const amount = saleValue(state, ids)
  for (const id of ids) state.inventory[id] = 0
  state.coins += amount
  return amount
}
