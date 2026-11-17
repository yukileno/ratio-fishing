import { generateProblem, mentalMathPair } from './problem-generator.mjs'

const stageProblems = [
  [['九九の掛け算', 'timesTable'], ['わり切れる割り算', 'exactDivision'], ['同じ数ずつの合計', 'groupsTotal']],
  [['同じ数ずつの合計', 'groupsTotal'], ['同じ数ずつ分ける', 'groupSize'], ['何組できるか', 'groupsCount'],
    ['何十の掛け算', 'tensTimes'], ['何十の割り算', 'tensDivide']],
  [['何十の掛け算', 'tensTimes'], ['何十の割り算', 'tensDivide'],
    ['もとにする量を見つける', 'whichBase'], ['定員の何倍か', 'ratio'], ['答えを求める式を選ぶ', 'chooseExpression']],
  [['何倍かを求める', 'ratio'], ['全体に対する割合', 'part'], ['二つの量の比べ方', 'groups']],
  [['くらべる量を求める', 'compared'], ['残りの割合', 'remainingRate'], ['減った数を求める', 'decreaseAmount']],
  [['もとにする量を求める', 'base'], ['式の□をうめる', 'equation'], ['値下がり前のねだん', 'priceBefore']],
  [['小数と百分率', 'percent'], ['百分率から量を求める', 'percentPart'], ['残りの量', 'restPart'], ['百分率から全体を求める', 'percentBase']],
  [['歩合の変換', 'buai'], ['値引き後の代金', 'sale'], ['値上がり率の比較', 'equalGrowth'], ['割引後の価格比較', 'discountCompare']],
  [['値引き前のねだん', 'original'], ['増量前の量', 'increase'], ['税ぬきのねだん', 'taxBefore'], ['値引きと消費税', 'taxDiscount']],
  [['全体に対する割合', 'part'], ['百分率から量を求める', 'percentPart'], ['残りの量', 'restPart']],
  [['くらべる量を求める', 'compared'], ['もとにする量を求める', 'base'], ['百分率から全体を求める', 'percentBase']],
  [['値上がり率の比較', 'equalGrowth'], ['増量前の量', 'increase'], ['式の□をうめる', 'equation']],
  [['歩合の変換', 'buai'], ['値引き後の代金', 'sale'], ['割引後の価格比較', 'discountCompare']],
  [['残りの割合', 'remainingRate'], ['減った数を求める', 'decreaseAmount'], ['値下がり前のねだん', 'priceBefore']],
  [['値引き後の代金', 'sale'], ['値引き前のねだん', 'original'], ['税ぬきのねだん', 'taxBefore']],
  [['答えを求める式を選ぶ', 'chooseExpression'], ['百分率から全体を求める', 'percentBase'], ['値引き前のねだん', 'original']],
  [['割引後の価格比較', 'discountCompare'], ['値上がり率の比較', 'equalGrowth'], ['値引きと消費税', 'taxDiscount']],
  [['値引き前のねだん', 'original'], ['増量前の量', 'increase'], ['割引後の価格比較', 'discountCompare'], ['値引きと消費税', 'taxDiscount']],
]
export const problemsForArea = area => stageProblems[area] ?? stageProblems[0]

export function generatePageProblem(type, n) {
  const { base, percent, ratio, part, variant } = mentalMathPair(n)
  const money = mentalMathPair(n, 'price')
  const { base: price, part: paid } = money
  const make = (prompt, value, unit, explanation) => ({ prompt, answer: { value, unit }, explanation })
  const pick = (prompt, value, options, explanation, table) => {
    const offset = (Math.floor(n / 3) + variant) % options.length
    return { ...make(prompt, value, '', explanation),
      choices: options.slice(offset).concat(options.slice(0, offset)), table }
  }
  switch (type) {
    case 'timesTable':
    case 'exactDivision':
    case 'groupsTotal':
    case 'groupSize':
    case 'groupsCount':
    case 'tensTimes':
    case 'tensDivide': {
      const each = n % 8 + 2
      const groups = Math.floor(n / 8) % 8 + 2
      const total = each * groups
      if (type === 'timesTable') return make(`${each} × ${groups} = □`, total, '',
        `${each}を${groups}回分集めるので、${each} × ${groups} = ${total}。`)
      if (type === 'exactDivision') return make(`${total} ÷ ${each} = □`, groups, '',
        `${each} × □ = ${total} と考えると、□には ${groups} が入ります。`)
      if (type === 'tensTimes') return make(`${each * 10} × ${groups} = □`, total * 10, '',
        `${each} × ${groups} = ${total}。10のまとまりで考えると、答えは ${total * 10}。`)
      if (type === 'tensDivide') return make(`${total * 10} ÷ ${groups} = □`, each * 10, '',
        `${total} ÷ ${groups} = ${each}。10のまとまりで考えると、答えは ${each * 10}。`)
      const [thing, counter, container] = [['貝がら', 'こ', 'ふくろ'], ['色えんぴつ', '本', '箱'], ['カード', '枚', 'ケース']][Math.floor(n / 64) % 3]
      if (type === 'groupsTotal') return make(`${thing}を1${container}に${each}${counter}ずつ入れます。${groups}${container}では全部でいくつですか。`,
        total, counter, `1${container}の数 × ${container}の数 → ${each} × ${groups} = ${total}。`)
      if (type === 'groupSize') return make(`${thing}${total}${counter}を${groups}${container}に同じ数ずつ入れます。1${container}にいくつ入りますか。`,
        each, counter, `全部の数 ÷ ${container}の数 → ${total} ÷ ${groups} = ${each}。`)
      return make(`${thing}${total}${counter}を1${container}に${each}${counter}ずつ入れます。何${container}できますか。`,
        groups, container, `全部の数 ÷ 1${container}の数 → ${total} ÷ ${each} = ${groups}。`)
    }
    case 'whichBase': {
      const examples = [
        ['合奏の人数', '合唱の人数', '発表会の参加者全体の人数'],
        ['今日の入館者数', '昨日の入館者数', '2日間の入館者数'],
        ['赤いリボンの長さ', '青いリボンの長さ', '2本を合わせた長さ'],
      ]
      const [compared, reference, total] = examples[Math.floor(n / 3) % examples.length]
      return pick(`${compared}は、${reference}の${ratio}倍です。もとにする量はどれですか。`,
        reference, [compared, reference, total], `「${reference}の${ratio}倍」なので、${reference}を1としてくらべます。`)
    }
    case 'remainingRate':
      return make(`水そうに水が${base}L入っています。そのうち${part}Lを使いました。はじめの量に対する残りの割合を小数で表しましょう。`,
        (100 - percent) / 100, '', `使った量 ÷ はじめの量 → ${part} ÷ ${base} = ${ratio}。残りの割合は 1 − ${ratio} = ${(100 - percent) / 100}。`)
    case 'decreaseAmount':
      return make(`今週の図書室の利用者は${base}人です。来週は今週の${ratio}倍になる見こみです。何人へる見こみですか。`,
        base - part, '人', `へる割合は 1 − ${ratio}。もとの人数 × へる割合 → ${base} × (1 − ${ratio}) = ${base - part}。`)
    case 'chooseExpression': {
      const scenarios = [
        [`校庭には全部で${base}人います。そのうち${part}人が遊具で遊んでいます。遊具で遊ぶ人の割合を求める式はどれですか。`,
          [`${part} ÷ ${base}`, `${base} ÷ ${part}`, `${base} × ${part}`], '割合 ＝ くらべる量 ÷ もとにする量。'],
        [`全体で${base}人いて、そのうち${ratio}倍にあたる人数が図書室にいます。図書室にいる人数を求める式はどれですか。`,
          [`${base} × ${ratio}`, `${base} ÷ ${ratio}`, `${ratio} ÷ ${base}`], 'くらべる量 ＝ もとにする量 × 割合。'],
        [`参加した${part}人は、全体の${ratio}倍です。全体の人数を求める式はどれですか。`,
          [`${part} ÷ ${ratio}`, `${part} × ${ratio}`, `${ratio} ÷ ${part}`], 'もとにする量 ＝ くらべる量 ÷ 割合。'],
      ]
      const [prompt, options, rule] = scenarios[variant % scenarios.length]
      return pick(prompt, options[0], options, rule + 'したがって「' + options[0] + '」。')
    }
    case 'restPart':
      return make(`農園には苗が${base}本あります。そのうち${percent}%を花だんに植えました。まだ植えていない苗は何本ですか。`,
        base - part, '本', `残りは 100% − ${percent}% = ${100 - percent}%。全体の本数 × 残りの割合 → ${base} × ${(100 - percent) / 100} = ${base - part}。`)
    case 'equalGrowth': {
      const names = ['A店', 'B店', 'C店']
      const outlier = n % 3
      const increase = [10, 20, 25, 50][Math.floor(n / 3) % 4]
      const other = increase === 25 ? 50 : 25
      const scale = Math.floor(n / 12) % 4 + 1
      const rows = names.map((name, i) => {
        const before = (i + 1) * scale * 100
        return [name, before, before * (100 + (i === outlier ? other : increase)) / 100]
      })
      return pick('表のうち、値上がりした割合が同じ2つの店はどれですか。', names.filter((_, i) => i !== outlier).join('と'),
        ['A店とB店', 'A店とC店', 'B店とC店'], '値上がりした金額 ÷ もとのねだん。' +
        rows.map(([name, before, after]) => `${name}は ${after - before} ÷ ${before} = ${(after - before) / before}`).join('、') + '。',
        { columns: ['店', 'もとのねだん（円）', '値上がり後（円）'], rows })
    }
    case 'discountCompare': {
      const offers = [[400, 25, 400, 20], [600, 25, 500, 20], [400, 25, 600, 50],
        [600, 50, 400, 20], [500, 20, 600, 25], [600, 50, 400, 25]]
      const scale = n % 4 + 1
      const [a, da, b, db] = offers[Math.floor(n / 4) % offers.length]
      const discount = value => value % 10 ? `${value}%引き` : `${value / 10}割引き`
      const rows = [['A店', a * scale, discount(da)], ['B店', b * scale, discount(db)]]
      const first = a * scale * (100 - da) / 100
      const second = b * scale * (100 - db) / 100
      const best = first === second ? '同じ' : first < second ? 'A店' : 'B店'
      return pick('同じ商品を買います。表を見て、値引き後の代金が安い店を選びましょう。同じ代金なら「同じ」を選びます。', best,
        ['A店', 'B店', '同じ'], `もとのねだん × (1 − 値引きの割合)。A店は${first}円、B店は${second}円です。`,
        { columns: ['店', 'もとのねだん（円）', '値引き'], rows })
    }
    case 'taxBefore': {
      const total = price * 11 / 10
      return make(`工作キットの税込の代金は${total}円です。消費税率は10%です。税ぬきのねだんは何円ですか。`, price, '円',
        `税込の代金は税ぬきのねだんの 1.1 倍。税込の代金 ÷ 1.1 → ${total} ÷ 1.1 = ${price}。`)
    }
    case 'taxDiscount': {
      const discount = [20, 50][Math.floor(n / 12) % 2]
      const remaining = (100 - discount) / 100
      const beforeTax = price * (100 - discount) / 100
      const total = beforeTax * 11 / 10
      return make(`税ぬきで${price}円の文具セットを、まず${discount}%引きにし、その金額に消費税10%を足します。支払う代金は何円ですか。`,
        total, '円', `値引き後は ${price} × ${remaining} = ${beforeTax} 円。そこに消費税を足すので ${beforeTax} × 1.1 = ${total} 円。`)
    }
    case 'capacity': {
      const scale = n % 4 + 1
      const winner = Math.floor(n / 4) % 3
      const names = ['工作', '絵画', '手芸']
      const counts = [[20, 30], [40, 50], [40, 40]]
      const rows = names.map((name, i) => [name, ...counts[(i - winner + 3) % 3].map(count => count * scale)])
      return { ...make('定員をもとにしたとき、希望者の割合がいちばん大きい教室はどれですか。', names[winner], '',
        '割合 ＝ 希望者の人数 ÷ 定員。' +
        rows.map(([name, seats, count]) => `${name}は ${count} ÷ ${seats} ＝ ${count / seats}`).join('、') + '。'),
        table: { columns: ['教室', '定員（人）', '希望者（人）'], rows }, choices: rows.map(row => row[0]) }
    }
    case 'part': return make(`5年生は全部で${base}人です。そのうち${part}人が合唱に参加しました。全体に対する参加者の割合を小数で表しましょう。`, ratio, '', `参加した人数 ÷ 全体の人数 → ${part} ÷ ${base} = ${ratio}`)
    case 'groups': return make(`発表会で、合唱に${base}人、合奏に${part}人が参加しました。合奏の人数は合唱の人数の何倍ですか。`, ratio, '倍', `合奏の人数 ÷ もとにする合唱の人数 → ${part} ÷ ${base} = ${ratio}`)
    case 'priceUp': {
      const increase = money.percent
      const multiplier = (100 + increase) / 100
      const total = price * (100 + increase) / 100
      return make(`去年${price}円だったかばんが、ことしは去年の${multiplier}倍になりました。ことしは何円ですか。`, total, '円',
        `去年のねだん × 割合 → ${price} × ${multiplier} = ${total}`)
    }
    case 'priceBefore': return make(`去年の${money.ratio}倍に値下がりしたかばんが、ことしは${paid}円です。去年は何円でしたか。`, price, '円', `ことしのねだん ÷ 割合 → ${paid} ÷ ${money.ratio} = ${price}`)
    case 'priceRatio': return make(`${price}円のかばんを${paid}円で買いました。代金はもとのねだんの何倍ですか。`, money.ratio, '倍', `代金 ÷ もとのねだん → ${paid} ÷ ${price} = ${money.ratio}`)
    case 'equation': {
      const values = [base, ratio, part]
      const blank = variant % 3
      const shown = values.map((value, i) => i === blank ? '□' : value)
      return make(`もとにする量 × 割合 = くらべる量 の式です。□に入る数を求めましょう。\n${shown[0]} × ${shown[1]} = ${shown[2]}`,
        values[blank], '', [`${part} ÷ ${ratio} = ${base}`, `${part} ÷ ${base} = ${ratio}`, `${base} × ${ratio} = ${part}`][blank])
    }
    case 'percentPart': return make(`面積が${base}m²の花だんのうち、${percent}%に花を植えました。花を植えた面積は何m²ですか。`, part, 'm²', `${percent}% = ${ratio}。 花だん全体の面積 × 割合 → ${base} × ${ratio} = ${part}`)
    case 'percentBase': return make(`かばんをもとのねだんの${money.percent}%にあたる${paid}円で買いました。もとのねだんは何円ですか。`, price, '円', `${money.percent}% = ${money.ratio}。 代金 ÷ 割合 → ${paid} ÷ ${money.ratio} = ${price}`)
    case 'bus': {
      const seats = 20 + (n % 4) * 20
      const riders = seats * percent / 100
      return make(`定員が${seats}人のバスに、乗客が${riders}人います。乗客は定員の何％ですか。`, percent, '%', `乗客の人数 ÷ 定員 → ${riders} ÷ ${seats} = ${ratio}。 ${ratio} × 100 = ${percent}`)
    }
    case 'sale':
    case 'original': {
      const remaining = (100 - money.percent) / 100
      const amount = price - paid
      const discount = money.variant % 2 && money.percent % 10 === 0 ? `${money.percent / 10}割` : `${money.percent}%`
      const step = `代金の割合は 1 − ${money.ratio} = ${remaining}。`
      return type === 'sale'
        ? make(`${price}円のかばんを${discount}引きで買います。代金は何円ですか。`, amount, '円', `${step} ${price} × ${remaining} = ${amount}`)
        : make(`かばんを${discount}引きで買うと、代金は${amount}円でした。もとのねだんは何円ですか。`, price, '円', `${step} ${amount} ÷ ${remaining} = ${price}`)
    }
    default: return generateProblem({ type, random: () => (n + 0.5) / 48000 })
  }
}
