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
  { name: '朝霧湿原', level: 16, previous: 8, required: 7, species: ['モツゴ', 'タイリクバラタナゴ', 'ギンブナ', 'スナヤツメ', 'ジュズカケハゼ', '霧羽グラミー', '銀露ライギョ', '朝霧オオナマズ'] },
  { name: '竹影の水路', level: 18, previous: 9, required: 6, species: ['タモロコ', 'シマドジョウ', 'テナガエビ', 'カワバタモロコ', 'スゴモロコ', '竹節ハヤ', '青竹ベタ', '笹舟ニシキゴイ'] },
  { name: '風車湖', level: 20, previous: 10, required: 6, species: ['ブルーギル', 'イエローパーチ', 'コクチバス', 'パンプキンシード', 'ブラウントラウト', '風切りバス', '白帆パーチ', '風車オオカワカマス'] },
  { name: '琥珀の砂州', level: 22, previous: 11, required: 6, species: ['シロギス', 'ボラ', 'コチ', 'スナガニ', 'クロダイ', '琥珀ヒラメ', '金砂クロダイ', '砂紋エイ'] },
  { name: '雷鳴の入江', level: 24, previous: 12, required: 6, species: ['サバ', 'カマス', 'サヨリ', 'ハコフグ', 'イシダイ', '雷光タチウオ', '稲妻シビレエイ', '雷鳴大ダコ'] },
  { name: '夕映えの群島', level: 26, previous: 13, required: 6, species: ['トビウオ', 'メバル', 'カワハギ', 'アオリイカ', 'ブリ', '夕映えカツオ', '茜マダイ', '残照バショウカジキ'] },
  { name: '鏡月の地底湖', level: 28, previous: 14, required: 6, species: ['ホトケドジョウ', 'メキシカンテトラ', 'ブラジルブラインドキャット', '洞窟エビ', 'グラスキャット', '薄月アロワナ', '鏡面ウナギ', '鏡月オオサンショウウオ'] },
  { name: '白波の断崖', level: 30, previous: 15, required: 6, species: ['アイナメ', 'ソイ', 'ホッケ', 'イシガキダイ', 'クエ', '白波ヒラマサ', '断崖ギンザメ', '潮壁オオクチイシナギ'] },
  { name: '暁光の深海', level: 32, previous: 16, required: 7, species: ['クロムツ', 'ギンメダイ', 'フウセンウナギ', 'デメニギス', 'メガマウス', '暁光オニキンメ', '曙ダイオウイカ', '太陽リュウグウノツカイ'] },
]

// Keep the original regular and milestone fish IDs in their saved order.
const originalAreaCount = 9
const regularFish = areas.slice(0, originalAreaCount).flatMap(({ species }, area) => {
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
const originalFish = regularFish.concat(milestones.map((name, area) => ({
  id: regularFish.length + area, area, name, rarity: area < 4 ? 3 : 4, label: rarityNames[area < 4 ? 3 : 4],
  price: (area < 4 ? 175 : 350) + area * 26, unlockArea: area + 1,
})))
const expeditionRarities = [0, 0, 0, 1, 1, 2, 3, 4]
const expeditionFish = areas.slice(originalAreaCount).flatMap(({ species }, index) =>
  species.map((name, slot) => {
    const rarity = expeditionRarities[slot]
    return {
      area: originalAreaCount + index, name, rarity, label: rarityNames[rarity],
      price: Math.round(prices[rarity] * (3.5 + index * .25)),
    }
  }))
expeditionFish.push(
  { area: 8, name: '航路のシーラカンス', rarity: 3, label: rarityNames[3], price: 595, unlockArea: 9 },
  { area: 17, name: '黎明のオウゴンクジラ', rarity: 4, label: rarityNames[4], price: 1980 },
)
export const fish = originalFish.concat(expeditionFish.map((item, index) => ({
  ...item, id: originalFish.length + index,
})))
export const fishInArea = areas.map((_, area) => fish.filter(item => item.area === area))

export const rods = [
  { name: 'はじめの竿', price: 0, area: 0, required: 0, odds: [75.36, 22.24, 2.08, 0.28, 0.04] },
  { name: 'ねらい竿', price: 80, area: 0, required: 3, odds: [56.2, 35.8, 6.88, 0.96, 0.16] },
  { name: '小魚の竿', price: 55, area: 0, required: 3, odds: [90.12, 9.08, 0.688, 0.096, 0.016] },
  { name: '星ひれの竿', price: 190, area: 0, required: 6, odds: [41.8, 46.2, 9.76, 1.92, 0.32] },
  { name: '月光の竿', price: 360, area: 1, required: 6, odds: [33, 47, 16.16, 3.2, 0.64] },
  { name: '水晶の竿', price: 290, area: 2, required: 4, odds: [42.88, 37.92, 15.6, 3.04, 0.56] },
  { name: '瀬なみの竿', price: 115, area: 3, required: 3, odds: [72.48, 24.32, 2.64, 0.48, 0.08] },
  { name: '翡翠の竿', price: 400, area: 3, required: 6, odds: [33.88, 46.92, 15.28, 3.28, 0.64] },
  { name: '紅葉の竿', price: 490, area: 4, required: 6, odds: [26.88, 53.92, 15.04, 3.36, 0.8] },
  { name: '氷紋の竿', price: 235, area: 5, required: 4, odds: [56.84, 37.56, 4.56, 0.88, 0.16] },
  { name: '極光の竿', price: 730, area: 5, required: 7, odds: [29.6, 46.4, 17.6, 5.2, 1.2] },
  { name: '黒曜の竿', price: 870, area: 6, required: 6, odds: [23.36, 54.24, 15.6, 5.44, 1.36] },
  { name: '珊瑚の竿', price: 980, area: 7, required: 5, odds: [38.48, 38.32, 16, 5.6, 1.6] },
  { name: '深潮の竿', price: 340, area: 8, required: 4, odds: [48.08, 44.72, 5.6, 1.36, 0.24] },
  { name: '星図の竿', price: 1580, area: 8, required: 8, odds: [22.56, 47.04, 20, 7.6, 2.8] },
  { name: '霧払いの竿', price: 940, area: 9, required: 3, odds: [70.72, 24.48, 4, 0.68, 0.12] },
  { name: '露しずくの竿', price: 1740, area: 9, required: 6, odds: [25.04, 41.36, 23.2, 8, 2.4] },
  { name: '青竹の竿', price: 1200, area: 10, required: 4, odds: [46.56, 43.04, 8, 2, 0.4] },
  { name: '笹舟の竿', price: 1950, area: 10, required: 6, odds: [29.76, 31.84, 25.6, 9.6, 3.2] },
  { name: '追い風の竿', price: 1480, area: 11, required: 4, odds: [33.4, 50.6, 11.2, 4, 0.8] },
  { name: '風車の竿', price: 2160, area: 11, required: 7, odds: [25.48, 31.32, 29.6, 9.6, 4] },
  { name: '砂金の竿', price: 1570, area: 12, required: 4, odds: [53.8, 34.2, 8, 3.2, 0.8] },
  { name: '琥珀の竿', price: 2390, area: 12, required: 6, odds: [24.72, 30.48, 26.4, 13.6, 4.8] },
  { name: '雷針の竿', price: 2560, area: 13, required: 6, odds: [24.84, 29.56, 23.2, 16, 6.4] },
  { name: '夕帆の竿', price: 1880, area: 14, required: 4, odds: [36.92, 50.28, 8.8, 3.2, 0.8] },
  { name: '茜雲の竿', price: 2780, area: 14, required: 6, odds: [23.96, 29.64, 21.6, 17.6, 7.2] },
  { name: '鏡月の竿', price: 2980, area: 15, required: 6, odds: [23.2, 28.8, 24, 16, 8] },
  { name: '白波の竿', price: 2250, area: 16, required: 4, odds: [57.68, 31.12, 8, 2.4, 0.8] },
  { name: '断崖の竿', price: 3260, area: 16, required: 7, odds: [22.44, 27.96, 20, 19.2, 10.4] },
  { name: '黎明の竿', price: 4200, area: 17, required: 8, odds: [20.28, 24.52, 18.4, 22.4, 14.4] },
]

export const codeRodId = rods.length
rods.push({ name: '秘宝の竿', odds: [11, 18, 20, 30, 21] })

export function redeemRod(state, code) {
  if (state.owned.includes(codeRodId)) return 'owned'
  if (code.trim().toUpperCase() !== 'HOSHITSURI26') return 'invalid'
  state.owned.push(codeRodId)
  state.rod = codeRodId
  return 'redeemed'
}

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
export const canBuy = (state, rod) => rod.price !== undefined && state.coins >= rod.price && collected(state, rod.area) >= rod.required
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
    : state.misses[area] >= 10 && unseen.length ? unseen : local
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
