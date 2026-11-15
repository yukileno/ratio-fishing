const easyCounts = [20, 40, 60, 80, 100, 120, 160, 200]
const easyPrices = [100, 200, 300, 400, 500, 600, 800, 1000, 1200, 1600, 2000, 2400]
const easyRates = [10, 20, 25, 50, 75]

// Vary the base and percentage independently so every pairing can appear.
export function mentalMathPair(n, kind = 'count') {
  const bases = kind === 'price' ? easyPrices : easyCounts
  const base = bases[n % bases.length]
  const percent = easyRates[Math.floor(n / bases.length) % easyRates.length]
  return { base, percent, ratio: percent / 100, part: base * percent / 100, variant: Math.floor(n / (bases.length * easyRates.length)) }
}

const generators = {
  ratio(n) {
    const base = easyCounts[n % easyCounts.length]
    const percent = [50, 75, 100, 125, 150][Math.floor(n / easyCounts.length) % 5]
    const count = base * percent / 100
    return problem(
      `工作教室の定員は${base}人で、希望者は${count}人です。希望者は定員の何倍ですか。`,
      count / base, '倍', `希望者の人数 ÷ 定員 → ${count} ÷ ${base} = ${percent / 100}`
    )
  },
  compared(n) {
    return quantity(n, false)
  },
  base(n) {
    return quantity(n, true)
  },
  percent(n) {
    const percentages = [1, 2, 5, 10, 12, 20, 25, 30, 40, 50, 60, 75, 80, 90, 100, 125, 150, 200]
    const p = percentages[n % percentages.length]
    const ratio = p / 100
    return Math.floor(n / percentages.length) % 2
      ? problem(`${p}%を小数で表しましょう。`, ratio, '', `${p} ÷ 100 = ${ratio}`)
      : problem(`割合${ratio}を百分率で表しましょう。`, p, '%', `${ratio} × 100 = ${p}`)
  },
  buai(n) {
    const examples = [5, 10, 30, 50, 75, 100, 105, 120, 125, 150, 200, 205, 250, 300, 350, 400, 500, 550, 750, 800, 900]
    const thousandths = examples[n % examples.length]
    const notation = [
      [Math.floor(thousandths / 100), '割'],
      [Math.floor(thousandths / 10) % 10, '分'],
      [thousandths % 10, '厘'],
    ].filter(([digit]) => digit).map(([digit, unit]) => digit + unit).join('')
    const ratio = thousandths / 1000
    const percent = thousandths / 10
    const rule = '1割は0.1、1分は0.01、1厘は0.001です。'
    switch (Math.floor(n / examples.length) % 4) {
      case 0: return problem(`割合${ratio}を歩合で表しましょう。`, notation, '', rule)
      case 1: return problem(`${notation}を小数で表しましょう。`, ratio, '', rule)
      case 2: return problem(`${percent}%を歩合で表しましょう。`, notation, '', `${percent}%は${ratio}です。${rule}`)
      default: return problem(`${notation}を百分率で表しましょう。`, percent, '%', `${rule}${ratio} × 100 = ${percent}`)
    }
  },
  comparison(n) {
    const scales = [1, 2, 5, 10]
    const scale = scales[n % scales.length]
    const vegetables = ['トマト', 'ピーマン', 'なす']
    const names = vegetables.map((_, index) => vegetables[(index + Math.floor(n / 12)) % vegetables.length])
    const bases = [40, 100, 50]
    const increases = [10, 20, 5]
    const rows = names.map((_, index) => {
      const i = (index + Math.floor(n / scales.length)) % names.length
      return [names[i], bases[i] * scale, (bases[i] + increases[i]) * scale]
    })
    return {
      ...problem('去年のねだんをもとにすると、ね上がりした割合がいちばん大きい野菜はどれですか。',
        names[0], '', '値上がりした割合 ＝ 値上がりした金額 ÷ 去年のねだん。' + rows.map(([name, before, after]) =>
          `${name}は (${after} − ${before}) ÷ ${before} = ${(after - before) / before}`).join('、') + '。'),
      table: { columns: ['野菜', '去年（円）', 'ことし（円）'], rows },
      choices: rows.map(([name]) => name),
    }
  },
  discount(n) {
    const { base, percent: pct, variant } = mentalMathPair(n, 'price')
    const paid = base * (100 - pct) / 100
    const multiplier = (100 - pct) / 100
    const rate = pct % 10 === 0 && Math.floor(variant / 2) % 2 ? `${pct / 10}割` : `${pct}%`
    const reverse = variant % 2
    const step = `代金の割合は 1 − ${pct / 100} = ${multiplier}。`
    return reverse
      ? problem(`筆箱を${rate}引きで買い、${paid}円はらいました。もとのねだんは何円ですか。`,
        base, '円', `${step}${paid} ÷ ${multiplier} = ${base}`)
      : problem(`${base}円の筆箱を${rate}引きで買います。代金は何円ですか。`,
        paid, '円', `${step}${base} × ${multiplier} = ${paid}`)
  },
  increase(n) {
    const volumes = [100, 200, 300, 400, 500, 600, 800, 1000]
    const base = volumes[n % volumes.length]
    const pct = [10, 20, 25, 50][Math.floor(n / volumes.length) % 4]
    const amount = base * (100 + pct) / 100
    const multiplier = (100 + pct) / 100
    return problem(`シャンプーがこれまでより${pct}%増量して、1本${amount}mLになりました。これまでは1本何mLでしたか。`,
      base, 'mL', `増量後は 1 ＋ ${pct / 100} = ${multiplier} 倍。 ${amount} ÷ ${multiplier} = ${base}`)
  },
  tax(n) {
    const base = easyPrices[n % easyPrices.length]
    const total = base * 110 / 100
    return problem(`税ぬきで${base}円のノートセットを買います。消費税率を10%とすると、代金は何円ですか。`,
      total, '円', `税込みの代金は 1 ＋ 0.1 = 1.1 倍。 ${base} × 1.1 = ${total}`)
  },
}

function problem(prompt, value, unit, explanation) {
  return { prompt, answer: { value, unit }, explanation }
}

function quantity(n, reverse) {
  const { base, percent, ratio, part: count, variant } = mentalMathPair(n)
  const rate = variant % 2 ? `${percent}%` : `${ratio}倍`
  const conversion = rate.endsWith('%') ? `${percent}%は${ratio}です。` : ''
  return reverse
    ? problem(`今週図書室で借りられた本のうち、物語の本は${count}さつでした。これは借りられた本全体の${rate}です。全体では何さつですか。`,
      base, 'さつ', `${conversion}くらべる量 ÷ 割合 → ${count} ÷ ${ratio} = ${base}`)
    : problem(`今週図書室で借りられた本は全部で${base}さつです。物語の本は全体の${rate}でした。物語の本は何さつですか。`,
      count, 'さつ', `${conversion}もとにする量 × 割合 → ${base} × ${ratio} = ${count}`)
}

export const problemTypes = Object.freeze([
  { id: 'ratio', label: '割合を求める', pages: '174〜176' },
  { id: 'compared', label: 'くらべる量を求める', pages: '177、179、181' },
  { id: 'base', label: 'もとにする量を求める', pages: '178〜179、181' },
  { id: 'percent', label: '小数と百分率', pages: '180' },
  { id: 'buai', label: '歩合', pages: '182' },
  { id: 'comparison', label: '割合でくらべる', pages: '183' },
  { id: 'discount', label: '値引き', pages: '184〜185' },
  { id: 'increase', label: '増量前の量', pages: '185' },
  { id: 'tax', label: '消費税', pages: '185' },
].map(Object.freeze))

/** type を省略すると、全分野からランダムに1問を出題する。 */
export function generateProblem({ type, random = Math.random } = {}) {
  function randomIndex(size) {
    const value = random()
    if (!Number.isFinite(value) || value < 0 || value >= 1) {
      throw new RangeError('random は 0 以上 1 未満の数を返してください。')
    }
    return Math.floor(value * size)
  }

  const selectedType = type ?? problemTypes[randomIndex(problemTypes.length)].id
  if (!Object.prototype.hasOwnProperty.call(generators, selectedType)) {
    throw new RangeError(`未知の問題タイプです: ${selectedType}`)
  }
  return { type: selectedType, ...generators[selectedType](randomIndex(48000)) }
}

/** 数値は単位付きでも入力できる。全角の数字と記号にも対応する。 */
export function isCorrectAnswer(problem, input) {
  if (typeof input !== 'string' && typeof input !== 'number') return false
  const { value } = problem.answer
  const unit = problem.answer.unit.normalize('NFKC')
  const normalized = String(input).normalize('NFKC').trim()
  if (typeof value === 'string') return normalized.replace(/\s+/gu, '') === value.normalize('NFKC').replace(/\s+/gu, '')
  const number = unit && normalized.endsWith(unit)
    ? normalized.slice(0, -unit.length).trimEnd()
    : normalized
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$|^\.\d+$/u.test(number)) return false
  return Number(number.replace(/,/gu, '')) === value
}



