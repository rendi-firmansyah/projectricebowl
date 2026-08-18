import { useState, useEffect, useRef } from 'react'
import { Send, Sparkles, ShoppingCart, ChevronLeft, Zap, Trash2, ArrowRight, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getMenuItems, formatPrice, optimizeImageUrl } from '../data/menuData'
import { useCart } from '../context/CartContext'
import { defaultRiceOption, getEmptyCustomization, isCustomizableBowl } from '../data/orderOptions'

const initialSuggestions = [
  "2 Nasi Jeruk + 2 Suwir",
  "1 Katsu, 1 Telur, dan 1 Risol Mayo",
  "Tambah 1 Nasi Bom Merah",
]

const followUpSuggestions = [
  "Tambah 1 Scrambled Eggs",
  "Tambah 1 Nugget",
  "Tidak, itu saja",
]

const menuAliasDictionary = [
  {
    match: 'ayam suwir',
    aliases: ['ayam suwir', 'suwir pedas', 'suwir', 'ayam swir', 'swir', 'ayam suir', 'suir'],
  },
  {
    match: 'ayam asam manis',
    aliases: ['asam manis', 'asem manis', 'ayam asem manis', 'asam', 'asem'],
  },
  {
    match: 'ayam teriyaki',
    aliases: ['teriyaki', 'ayam teriyaki', 'teriaki'],
  },
  {
    match: 'ayam lada hitam',
    aliases: ['lada hitam', 'blackpepper', 'black pepper', 'ayam lada', 'lada'],
  },
  {
    match: 'ayam sambal matah',
    aliases: ['sambal matah', 'matah', 'ayam matah'],
  },
  {
    match: 'ayam salted egg',
    aliases: ['salted egg', 'salted', 'telur asin', 'ayam telur asin'],
  },
  {
    match: 'ayam mentai',
    aliases: ['mentai', 'ayam mentai'],
  },
  {
    match: 'kanzler mercon',
    aliases: ['kanzler', 'kenzler', 'kansler', 'mercon', 'sosis mercon'],
  },
  {
    match: 'chicken katsu',
    aliases: ['katsu', 'ayam katsu', 'chiken katsu'],
  },
  {
    match: 'nasi daun jeruk',
    aliases: ['nasi jeruk', 'daun jeruk', 'jeruk'],
  },
  {
    match: 'nasi bom merah',
    aliases: ['nasi bom', 'bom merah', 'bom pedas', 'nasi merah'],
  },
  {
    match: 'nasi biasa',
    aliases: ['nasi putih', 'nasi polos', 'nasi biasa'],
  },
  {
    match: 'risol sosis mayo',
    aliases: ['risol sosis', 'risol mayo', 'sosis mayo', 'sosis mayones'],
  },
  {
    match: 'risol ayam suwir',
    aliases: ['risol ayam', 'risol suwir', 'risol ayam suwir'],
  },
  {
    match: 'scrambled eggs',
    aliases: ['scrambled eggs', 'scrambled egg', 'scramble egg', 'scramble', 'telur dadar', 'telur'],
  },
  {
    match: 'nugget',
    aliases: ['nugget', 'nuggets', 'naget'],
  },
]

const genericMenuWords = new Set(['ayam', 'chicken', 'rice', 'bowl', 'nasi', 'risol', 'extra'])

const buildGeneratedAliases = (name) => {
  const cleanedName = name
    .replace(/\brice bowl\b/g, '')
    .replace(/\bextra\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  const tokens = cleanedName.split(' ').filter(token => token && !genericMenuWords.has(token))
  const aliases = [cleanedName]

  if (tokens.length >= 2) {
    aliases.push(tokens.join(' '))
  }

  return aliases
}

const getItemAliases = (item) => {
  const name = item.name.toLowerCase()
  const aliases = [name, ...buildGeneratedAliases(name)]

  if (name.includes('rice bowl')) {
    aliases.push(name.replace(' rice bowl', ''))
  }

  menuAliasDictionary.forEach(entry => {
    if (name.includes(entry.match)) {
      aliases.push(...entry.aliases)
    }
  })

  if (name.includes('nasi daun jeruk')) {
    aliases.push('nasi jeruk', 'daun jeruk')
  } else if (name.includes('nasi bom merah')) {
    aliases.push('nasi bom', 'bom merah', 'bom pedas')
  } else if (name.includes('nasi biasa')) {
    aliases.push('nasi biasa')
  } else if (name.includes('ayam suwir')) {
    aliases.push('ayam suwir', 'suwir pedas', 'ayam swir', 'suwir')
  } else if (name.includes('ayam asam manis')) {
    aliases.push('asam manis', 'ayam asem manis', 'asem manis')
  } else if (name.includes('ayam teriyaki')) {
    aliases.push('teriyaki')
  } else if (name.includes('ayam lada hitam')) {
    aliases.push('lada hitam', 'blackpepper', 'black pepper')
  } else if (name.includes('ayam sambal matah')) {
    aliases.push('sambal matah', 'matah')
  } else if (name.includes('ayam salted egg')) {
    aliases.push('salted egg', 'telur asin')
  } else if (name.includes('ayam mentai')) {
    aliases.push('mentai')
  } else if (name.includes('kanzler mercon')) {
    aliases.push('mercon', 'sosis mercon')
  } else if (name.includes('katsu')) {
    aliases.push('ayam katsu')
  } else if (name.includes('risol sosis mayo')) {
    aliases.push('risol sosis', 'risol mayo', 'sosis mayo')
  } else if (name.includes('risol ayam suwir')) {
    aliases.push('risol ayam', 'risol suwir')
  } else if (name.includes('scrambled eggs')) {
    aliases.push('scrambled egg', 'telur dadar', 'telur')
  } else if (name.includes('nugget')) {
    aliases.push('nuggets')
  }

  return [...new Set(aliases.map(alias => alias.trim()).filter(Boolean))]
    .sort((a, b) => b.length - a.length)
}

const numberWords = {
  satu: 1,
  se: 1,
  sebuah: 1,
  seporsi: 1,
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  tujuh: 7,
  delapan: 8,
  sembilan: 9,
  sepuluh: 10,
}

const fillerWords = new Set([
  'aku', 'saya', 'mau', 'pesan', 'order', 'tolong', 'dong', 'ya', 'aja',
  'lagi', 'nambah', 'tambah', 'tambahkan', 'tambahin', 'dan', 'sama',
  'plus', 'dengan', 'untuk', 'menu', 'porsi', 'pcs', 'biji', 'buah',
])

const normalizeText = (value = '') =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\//g, ' ')
    .replace(/[.,!?;:()[\]{}"'`]/g, ' ')
    .replace(/\bnasih\b/g, 'nasi')
    .replace(/\s+/g, ' ')
    .trim()

const parseQuantityValue = (value) => {
  if (!value) return 1
  const normalized = normalizeText(value)
  if (numberWords[normalized]) return numberWords[normalized]
  const numeric = parseInt(normalized, 10)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 1
}

const escapeRegex = (value) =>
  value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\s+/g, '\\s+')

const quantityPattern = `(?:\\d+|${Object.keys(numberWords).join('|')})`

const levenshtein = (a, b) => {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i])
  for (let j = 1; j <= b.length; j += 1) rows[0][j] = j

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
  }

  return rows[a.length][b.length]
}

const similarity = (a, b) => {
  if (!a || !b) return 0
  if (a === b) return 1
  const longest = Math.max(a.length, b.length)
  return longest === 0 ? 1 : 1 - levenshtein(a, b) / longest
}

const meaningfulTokens = (input) =>
  normalizeText(input)
    .split(' ')
    .filter(token => token && !fillerWords.has(token))

const getNgrams = (tokens, minSize = 1, maxSize = 5) => {
  const grams = []
  for (let size = minSize; size <= Math.min(maxSize, tokens.length); size += 1) {
    for (let i = 0; i <= tokens.length - size; i += 1) {
      grams.push(tokens.slice(i, i + size).join(' '))
    }
  }
  return grams
}

const getQuantityNearPhrase = (normalizedInput, phrase) => {
  const escapedPhrase = escapeRegex(phrase)
  const before = normalizedInput.match(new RegExp(`(?:^|\\s)(${quantityPattern})\\s*(?:x|pcs|porsi)?\\s+${escapedPhrase}(?:\\s|$)`, 'i'))
  if (before) return parseQuantityValue(before[1])

  const after = normalizedInput.match(new RegExp(`(?:^|\\s)${escapedPhrase}\\s*(?:x|pcs|porsi)?\\s*(${quantityPattern})(?:\\s|$)`, 'i'))
  if (after) return parseQuantityValue(after[1])

  return 1
}

const getClosestMenuSuggestions = (input, list, limit = 3) => {
  const tokens = meaningfulTokens(input)
  const grams = getNgrams(tokens, 1, 5)
  if (grams.length === 0) return []

  return list
    .map(item => {
      const score = getItemAliases(item).reduce((best, alias) => {
        const normalizedAlias = normalizeText(alias)
        const aliasScore = grams.reduce((max, gram) => Math.max(max, similarity(gram, normalizedAlias)), 0)
        return Math.max(best, aliasScore)
      }, 0)
      return { item, score }
    })
    .filter(result => result.score >= 0.55)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(result => result.item.name)
}

const extractItemNote = (input) => {
  return ''
}

const cleanOrderCommandPrefix = (value = '') =>
  value.replace(/^\s*(?:tambah|tambahkan|tambahin|pesan|order|mau|saya mau)\s+/i, '').trim()

const extractRecipientFromText = (input) => {
  const normalizedInput = input.trim()
  const match = normalizedInput.match(/\s+(?:untuk|buat|atas\s+nama)\s+([A-Za-zÀ-ÿ0-9 ._]{2,40})\s*$/i)
  if (!match) return { orderText: normalizedInput, note: '' }

  const recipient = match[1].trim()
  const normalizedRecipient = normalizeText(recipient)
  if (!recipient || /\d/.test(normalizedRecipient)) return { orderText: normalizedInput, note: '' }

  return {
    orderText: normalizedInput.slice(0, match.index).trim(),
    note: `Untuk: ${recipient}`,
  }
}

const riceRequestOptions = [
  {
    option: 'Nasi Bom Merah',
    aliases: ['nasi bom merah', 'nasi bom', 'bom merah', 'nasi merah', 'bom pedas', 'merah'],
  },
  {
    option: 'Nasi Daun Jeruk',
    aliases: ['nasi daun jeruk', 'nasi jeruk', 'daun jeruk', 'jeruk'],
  },
  {
    option: 'Nasi Uduk',
    aliases: ['nasi uduk', 'uduk'],
  },
  {
    option: defaultRiceOption,
    aliases: ['nasi biasa', 'nasi putih', 'nasi polos', 'putih', 'polos', 'biasa'],
  },
]

const riceChangeIntentPattern = /\b(?:ganti|diganti|gantinya|gantiin|digantiin|pake|pakai|pakek|gunakan|ubah|rubah)\b/

const riceOptionAliasLookup = riceRequestOptions
  .flatMap(entry => entry.aliases.map(alias => ({
    alias: normalizeText(alias),
    option: entry.option,
  })))
  .sort((a, b) => b.alias.length - a.alias.length)

const riceOptionAliasPattern = riceOptionAliasLookup
  .map(entry => escapeRegex(entry.alias))
  .join('|')

const getMentionedRiceOption = (input, options = {}) => {
  const normalized = normalizeText(input)
  const hasRiceWord = /\bnasi\b/.test(normalized)
  const allowShortAlias = options.allowShortAlias === true

  for (const entry of riceOptionAliasLookup) {
    const found = new RegExp(`(^|\\s)${escapeRegex(entry.alias)}(?=\\s|$)`).test(normalized)
    if (found && (allowShortAlias || hasRiceWord || entry.option === 'Nasi Uduk')) return entry.option
  }

  return ''
}

const getRequestedRiceOption = (input) => {
  const normalized = normalizeText(input)
  if (!riceChangeIntentPattern.test(normalized)) return ''

  return getMentionedRiceOption(input, { allowShortAlias: true })
}

const hasRiceReplacementRequest = (input) => Boolean(getRequestedRiceOption(input))

const extractCustomization = (input, item, options = {}) => {
  const customization = getEmptyCustomization(item)
  if (!isCustomizableBowl(item)) return customization

  const normalized = normalizeText(input)
  const requestedRice = getRequestedRiceOption(input) || (
    options.allowDirectRiceMention ? getMentionedRiceOption(input) : ''
  )
  if (requestedRice) {
    customization.rice = requestedRice
  }

  if (/\b(tidak|ga|gak|nggak|enggak)\s+pedas\b/.test(normalized)) {
    customization.spice = 'Tidak Pedas'
  } else if (/\bpedas\b/.test(normalized)) {
    customization.spice = 'Pedas'
  }

  return customization
}

const shouldSkipSmartMatch = (input, item) => {
  const normalized = normalizeText(input)
  const itemName = normalizeText(item.name)

  const isRiceItem = item.category === 'nasi' || item.category_id === 'nasi' || itemName.includes('nasi ')
  if (isRiceItem && hasRiceReplacementRequest(input)) {
    return true
  }

  if (itemName.includes('risol ayam suwir') && !/\brisol\b/.test(normalized)) {
    return true
  }

  return false
}

const isRiceMenuItem = (item) => {
  const itemName = normalizeText(item?.name || '')
  return item?.category === 'nasi' || item?.category_id === 'nasi' || itemName.includes('nasi ')
}

const splitOrderSegments = (input) =>
  input
    .split(/\s*(?:,|\+|&|\bdan\b|\bsama\b|\bplus\b)\s*/i)
    .map(segment => segment.trim())
    .filter(Boolean)

const sumQuantityMatches = (normalized, patterns) =>
  patterns.reduce((sum, pattern) => {
    const matches = [...normalized.matchAll(pattern)]
    return sum + matches.reduce((total, match) => total + parseQuantityValue(match[1]), 0)
  }, 0)

const findItemPosition = (normalizedInput, item) => {
  if (Number.isFinite(item.smartPosition)) {
    return { index: item.smartPosition, alias: item.smartMatchedPhrase || '' }
  }

  const aliases = getItemAliases(item).map(normalizeText)

  for (const alias of aliases) {
    const regex = new RegExp(`(^|\\s)${escapeRegex(alias)}(?=\\s|$)`, 'g')
    const match = regex.exec(normalizedInput)
    if (match) {
      return {
        index: match.index + (match[1] ? match[1].length : 0),
        alias,
      }
    }
  }

  return { index: Number.MAX_SAFE_INTEGER, alias: '' }
}

const getPositionedItems = (normalizedInput, items) =>
  items
    .map(item => ({ ...item, smartPosition: findItemPosition(normalizedInput, item) }))
    .sort((a, b) => a.smartPosition.index - b.smartPosition.index)

const extractQuantityCustomizationGroups = (input) => {
  const normalized = normalizeText(input)
  if (!riceOptionAliasPattern) return []

  const groups = []
  const seenRanges = new Set()
  const spicePattern = `((?:tidak|ga|gak|nggak|enggak)\\s+pedas|pedas)`
  const quantitySpiceRicePattern = new RegExp(
    `(?:^|\\s)(${quantityPattern})\\s*(?:x|pcs|porsi)?\\s+${spicePattern}\\s+(?:pake|pakai|pakek|diganti|ganti|dengan)?\\s*(${riceOptionAliasPattern})(?=\\s|$)`,
    'g'
  )
  const quantityRiceSpicePattern = new RegExp(
    `(?:^|\\s)(${quantityPattern})\\s*(?:x|pcs|porsi)?\\s+(?:pake|pakai|pakek|diganti|ganti|dengan)?\\s*(${riceOptionAliasPattern})\\s+${spicePattern}(?=\\s|$)`,
    'g'
  )
  const quantityIntentRicePattern = new RegExp(
    `(?:^|\\s)(${quantityPattern})\\s*(?:x|pcs|porsi)?\\s+(?:ganti|diganti|gantinya|gantiin|digantiin|pake|pakai|pakek|gunakan|ubah|rubah|dengan)\\s+(${riceOptionAliasPattern})(?=\\s|$)`,
    'g'
  )

  const addGroup = (match, riceAlias, spiceText = '') => {
    const rangeKey = `${match.index}:${match[0].length}`
    if (seenRanges.has(rangeKey)) return
    seenRanges.add(rangeKey)

    const riceOption = riceOptionAliasLookup.find(entry => entry.alias === normalizeText(riceAlias))?.option || ''
    if (!riceOption) return

    groups.push({
      quantity: parseQuantityValue(match[1]),
      rice: riceOption,
      spice: spiceText
        ? (/\b(tidak|ga|gak|nggak|enggak)\s+pedas\b/.test(normalizeText(spiceText)) ? 'Tidak Pedas' : 'Pedas')
        : '',
      start: match.index,
      end: match.index + match[0].length,
    })
  }

  for (const match of normalized.matchAll(quantitySpiceRicePattern)) {
    addGroup(match, match[3], match[2])
  }

  for (const match of normalized.matchAll(quantityRiceSpicePattern)) {
    addGroup(match, match[2], match[3])
  }

  for (const match of normalized.matchAll(quantityIntentRicePattern)) {
    addGroup(match, match[2])
  }

  return groups.sort((a, b) => a.start - b.start)
}

const parseSpiceQuantitySplit = (input, list, parseMessageForItems, options = {}) => {
  const normalized = normalizeText(input)
  const baseItems = parseMessageForItems(input, list)

  if (baseItems.length === 0) return []

  const positionedItems = getPositionedItems(normalized, baseItems)
  const items = []
  let hasLocalSpiceInstruction = false
  const consumedRiceRanges = []

  positionedItems.forEach((item, index) => {
    const nextItem = isCustomizableBowl(item)
      ? positionedItems.slice(index + 1).find(candidate => !isRiceMenuItem(candidate))
      : positionedItems[index + 1]
    const start = item.smartPosition.index === Number.MAX_SAFE_INTEGER ? 0 : item.smartPosition.index
    const end = nextItem?.smartPosition.index && nextItem.smartPosition.index !== Number.MAX_SAFE_INTEGER
      ? nextItem.smartPosition.index
      : normalized.length
    const localText = normalized.slice(start, end)
    const localCustomization = extractCustomization(localText, item, {
      allowDirectRiceMention: options.allowDirectRiceMention === true,
    })

    if (!isCustomizableBowl(item)) {
      const isRiceItem = isRiceMenuItem(item)
      const itemPosition = item.smartPosition.index
      const isDirectRiceOption = options.allowDirectRiceMention === true
        && isRiceItem
        && positionedItems.some(candidate => isCustomizableBowl(candidate))
      const isConsumedAsRiceOption = isRiceItem && consumedRiceRanges.some(range => (
        itemPosition >= range.start && itemPosition <= range.end
      ))

      if (isDirectRiceOption || isConsumedAsRiceOption) return

      items.push({
        ...item,
        note: '',
        customization: getEmptyCustomization(item),
      })
      return
    }

    const customizationGroups = extractQuantityCustomizationGroups(localText)
    if (customizationGroups.length > 0) {
      hasLocalSpiceInstruction = true
      let groupedQty = 0

      customizationGroups.forEach(group => {
        groupedQty += group.quantity
        consumedRiceRanges.push({
          start: start + group.start,
          end: start + group.end,
        })
        items.push({
          ...item,
          quantity: group.quantity,
          customization: { ...getEmptyCustomization(item), rice: group.rice, spice: group.spice },
          note: '',
        })
      })

      const remainingQty = Math.max(0, Number(item.quantity || 0) - groupedQty)
      if (remainingQty > 0) {
        items.push({
          ...item,
          quantity: remainingQty,
          customization: getEmptyCustomization(item),
          note: '',
        })
      }

      return
    }

    const spicyQty = sumQuantityMatches(localText, [
      new RegExp(`(?:^|\\s)(${quantityPattern})\\s*(?:x|pcs|porsi)?\\s+pedas\\b`, 'g'),
    ])
    const notSpicyQty = sumQuantityMatches(localText, [
      new RegExp(`(?:^|\\s)(${quantityPattern})\\s*(?:x|pcs|porsi)?\\s+(?:tidak|ga|gak|nggak|enggak)\\s+pedas\\b`, 'g'),
    ])

    if (spicyQty + notSpicyQty > 0) {
      hasLocalSpiceInstruction = true

      if (spicyQty > 0) {
        items.push({
          ...item,
          quantity: spicyQty,
          customization: { ...getEmptyCustomization(item), rice: localCustomization.rice || '', spice: 'Pedas' },
          note: '',
        })
      }

      if (notSpicyQty > 0) {
        items.push({
          ...item,
          quantity: notSpicyQty,
          customization: { ...getEmptyCustomization(item), rice: localCustomization.rice || '', spice: 'Tidak Pedas' },
          note: '',
        })
      }

      const remainingQty = Math.max(0, Number(item.quantity || 0) - spicyQty - notSpicyQty)
      if (remainingQty > 0) {
        items.push({
          ...item,
          quantity: remainingQty,
          customization: localCustomization.rice
            ? { ...getEmptyCustomization(item), rice: localCustomization.rice }
            : getEmptyCustomization(item),
          note: '',
        })
      }

      return
    }

    if (localCustomization.spice || localCustomization.rice) hasLocalSpiceInstruction = true

    items.push({
      ...item,
      note: '',
      customization: (localCustomization.spice || localCustomization.rice) ? localCustomization : getEmptyCustomization(item),
    })
  })

  return hasLocalSpiceInstruction ? items : []
}

const parseSingleOrderText = (input, list, parseMessageForItems, options = {}) => {
  const recipientData = extractRecipientFromText(input)
  const orderInput = recipientData.orderText || input
  const inheritedNote = options.note || recipientData.note || ''

  const splitBySpice = parseSpiceQuantitySplit(orderInput, list, parseMessageForItems, {
    allowDirectRiceMention: options.allowDirectRiceMention === true,
  })
  if (splitBySpice.length > 0) {
    return splitBySpice.map(item => ({
      ...item,
      note: inheritedNote || item.note || '',
    }))
  }

  const segments = splitOrderSegments(orderInput)
  const shouldReadRiceAsBowlOption = options.allowDirectRiceMention === true
  const parsed = []
  const usedKeys = new Set()

  const sourceSegments = segments.length > 1 ? segments : [orderInput]
  sourceSegments.forEach(segment => {
    const segmentItems = parseMessageForItems(segment, list)
    const customBowlCount = segmentItems.filter(item => isCustomizableBowl(item)).length
    const hasRiceOption = Boolean(getMentionedRiceOption(segment))
    const segmentNote = inheritedNote || extractItemNote(segment)

    segmentItems.forEach(item => {
      if (shouldReadRiceAsBowlOption && customBowlCount > 0 && hasRiceOption && isRiceMenuItem(item)) return

      const customization = customBowlCount <= 1
        ? extractCustomization(segment, item, { allowDirectRiceMention: shouldReadRiceAsBowlOption })
        : getEmptyCustomization(item)
      const key = [
        item.id,
        customization.rice || '',
        customization.spice || '',
        segmentNote,
      ].join('::')

      if (usedKeys.has(key)) {
        const existing = parsed.find(parsedItem => {
          const parsedKey = [
            parsedItem.id,
            parsedItem.customization?.rice || '',
            parsedItem.customization?.spice || '',
            parsedItem.note || '',
          ].join('::')
          return parsedKey === key
        })
        if (existing) existing.quantity += item.quantity
        return
      }

      usedKeys.add(key)
      parsed.push({
        ...item,
        note: segmentNote,
        customization,
      })
    })
  })

  return parsed
}

const parseNamedOrderLine = (line) => {
  const cleanedLine = cleanOrderCommandPrefix(line)
  const match = cleanedLine.match(/^\s*([A-Za-zÀ-ÿ0-9 ._]{2,40}?)\s*(?:-|:|–|—)\s*(.+)$/)
  if (!match) return null

  const customerName = cleanOrderCommandPrefix(match[1]).trim()
  const orderText = cleanOrderCommandPrefix(match[2]).trim()
  const normalizedName = normalizeText(customerName)

  if (!customerName || !orderText) return null
  if (/\d/.test(normalizedName)) return null
  if (['pesan', 'order', 'tambah', 'mau', 'saya'].some(word => normalizedName.includes(word))) return null

  return { customerName, orderText }
}

const parseStructuredOrderList = (input, list, parseMessageForItems) => {
  const lines = input
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)

  if (lines.length === 1) {
    const row = parseNamedOrderLine(lines[0])
    if (!row) return []

    return parseSingleOrderText(row.orderText, list, parseMessageForItems, {
      allowDirectRiceMention: true,
      note: `Untuk: ${row.customerName}`,
    })
  }

  const parsedRows = lines
    .map(parseNamedOrderLine)
    .filter(Boolean)

  if (parsedRows.length < 2) return []

  return parsedRows.flatMap(row =>
    parseSingleOrderText(row.orderText, list, parseMessageForItems, {
      allowDirectRiceMention: true,
      note: `Untuk: ${row.customerName}`,
    })
  )
}

const parseSegmentsForItems = (input, list, parseMessageForItems) => {
  const structuredList = parseStructuredOrderList(input, list, parseMessageForItems)
  if (structuredList.length > 0) return structuredList

  return parseSingleOrderText(input, list, parseMessageForItems)
}

const getSmartRecommendations = (input, list) => {
  const lower = normalizeText(input)
  const asksRecommendation = ['rekomendasi', 'saran', 'paling enak', 'favorit', 'terlaris', 'best seller', 'hemat', 'pedas', 'buat 2'].some(keyword => lower.includes(keyword))
  if (!asksRecommendation) return []

  let candidates = [...list]

  if (lower.includes('pedas')) {
    candidates = candidates.filter(item =>
      normalizeText(`${item.name} ${(item.tags || []).join(' ')} ${item.description || ''}`).includes('pedas') ||
      normalizeText(`${item.name} ${(item.tags || []).join(' ')} ${item.description || ''}`).includes('spicy')
    )
  } else if (lower.includes('hemat') || lower.includes('murah')) {
    candidates = candidates.filter(item => Number(item.price) <= 26000)
  } else if (lower.includes('buat 2')) {
    candidates = candidates.filter(item => item.category_id === 'rice-bowl' || item.category === 'rice-bowl')
  } else {
    candidates = candidates.filter(item => item.isPopular || item.rating >= 4.8)
  }

  return candidates
    .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0) || Number(a.price || 0) - Number(b.price || 0))
    .slice(0, lower.includes('buat 2') ? 2 : 3)
}

const getSmartOrderItemKey = (item) => {
  const toppings = (item.customization?.toppings || [])
    .map(topping => topping.id || topping.name)
    .sort()
    .join(',')

  return [
    item.id,
    item.customization?.rice || '',
    item.customization?.spice || '',
    toppings,
    item.note || '',
  ].join('::')
}

const describeSmartOrderOptions = (item) => {
  const parts = []
  if (isCustomizableBowl(item)) {
    if (item.customization?.rice && item.customization.rice !== defaultRiceOption) {
      parts.push(item.customization.rice)
    }
    if (item.customization?.spice) parts.push(item.customization.spice)
  }
  if (item.note) parts.push(item.note)
  return parts.length > 0 ? ` (${parts.join(', ')})` : ''
}

const isMenuUnavailable = (item) => String(item?.status || 'Tersedia').toLowerCase() !== 'tersedia'

export default function SmartOrderPage() {
  const [text, setText] = useState('')
  const [menuList, setMenuList] = useState([])
  const [currentOrder, setCurrentOrder] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [isCompact, setIsCompact] = useState(() => window.innerWidth < 900)
  const { addItem } = useCart()
  const [showToast, setShowToast] = useState(false)
  const inputRef = useRef(null)
  
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Halo! Saya adalah AI Order Assistant.\nMenu apa yang ingin Anda pesan hari ini? Saya bisa membaca nama menu pendek, jumlah angka/kata, typo ringan, pilihan rasa, pilihan nasi, dan list pesanan kantor. Contoh: 'dua nasi jeruk, 1 suwir pedas, 1 asam manis tidak pedas'.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])

  const chatEndRef = useRef(null)

  useEffect(() => {
    getMenuItems().then(data => setMenuList(data))
  }, [])

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    const handleResize = () => setIsCompact(window.innerWidth < 900)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const parseMessageForItems = (input, list) => {
    const found = []
    const normalizedInput = normalizeText(input)
    
    // Sort items so longer/more specific names are matched first
    const sortedList = [...list].sort((a, b) => b.name.length - a.name.length)
    let trackingInput = normalizedInput

    sortedList.forEach(item => {
      if (shouldSkipSmartMatch(input, item)) return

      const aliases = getItemAliases(item).map(normalizeText)
      let quantity = 0
      let matched = false
      let matchedIndex = Number.MAX_SAFE_INTEGER
      let matchedPhrase = ''

      for (const alias of aliases) {
        const escaped = escapeRegex(alias)
        
        // Match: "2 nasi", "dua nasi", "nasi x2", or just "nasi"
        const regex1 = new RegExp(`(?:^|\\s)(${quantityPattern})\\s*(?:x|pcs|porsi)?\\s+${escaped}(?:\\s|$)`, 'i')
        const regex2 = new RegExp(`(?:^|\\s)${escaped}\\s*(?:x|pcs|porsi)?\\s*(${quantityPattern})(?:\\s|$)`, 'i')
        const regex3 = new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`, 'i')

        const m1 = regex1.exec(trackingInput)
        const m2 = regex2.exec(trackingInput)
        const m3 = regex3.exec(trackingInput)

        if (m1) {
          quantity = parseQuantityValue(m1[1])
          matched = true
          matchedIndex = m1.index
          matchedPhrase = alias
          trackingInput = trackingInput.replace(m1[0], ' '.repeat(m1[0].length))
          break
        } else if (m2) {
          quantity = parseQuantityValue(m2[1])
          matched = true
          matchedIndex = m2.index
          matchedPhrase = alias
          trackingInput = trackingInput.replace(m2[0], ' '.repeat(m2[0].length))
          break
        } else if (m3) {
          quantity = 1
          matched = true
          matchedIndex = m3.index
          matchedPhrase = alias
          trackingInput = trackingInput.replace(m3[0], ' '.repeat(m3[0].length))
          break
        }
      }

      if (matched && quantity > 0) {
        found.push({ ...item, quantity, smartPosition: matchedIndex, smartMatchedPhrase: matchedPhrase })
      }
    })

    // Fuzzy fallback for small typos, e.g. "ayam swir" or "nasi bom mera".
    const tokens = meaningfulTokens(input)
    const grams = getNgrams(tokens, 1, 5)
    const usedIds = new Set(found.map(item => item.id))

    sortedList.forEach(item => {
      if (usedIds.has(item.id)) return
      if (shouldSkipSmartMatch(input, item)) return

      let bestMatch = { score: 0, phrase: '' }
      getItemAliases(item).map(normalizeText).forEach(alias => {
        grams.forEach(gram => {
          const score = similarity(gram, alias)
          if (score > bestMatch.score) {
            bestMatch = { score, phrase: gram }
          }
        })
      })

      if (bestMatch.score >= 0.82) {
        usedIds.add(item.id)
        const fuzzyIndex = normalizedInput.indexOf(bestMatch.phrase)
        found.push({
          ...item,
          quantity: getQuantityNearPhrase(normalizedInput, bestMatch.phrase),
          smartPosition: fuzzyIndex >= 0 ? fuzzyIndex : Number.MAX_SAFE_INTEGER,
          smartMatchedPhrase: bestMatch.phrase,
          matchedBy: 'fuzzy',
        })
      }
    })

    return found
  }

  const isNegativeOrFinish = (input) => {
    const lower = normalizeText(input)
    const finishPhrases = [
      'cukup', 'selesai', 'udah', 'sudah', 'itu saja', 'cukup itu saja',
      'stop', 'done', 'tidak ada tambahan', 'ga ada tambahan', 'gak ada tambahan',
      'nggak ada tambahan', 'enggak ada tambahan', 'no more',
    ]
    const shortNoPhrases = ['no', 'tidak', 'ga', 'gak', 'nggak', 'enggak']
    return finishPhrases.some(phrase => lower.includes(phrase)) || shortNoPhrases.some(phrase => lower === phrase)
  }

  const isResetIntent = (input) => {
    const lower = normalizeText(input)
    return ['reset', 'batal', 'hapus semua', 'ulang', 'mulai ulang'].some(phrase => lower.includes(phrase))
  }

  const isSummaryIntent = (input) => {
    const lower = normalizeText(input)
    return ['total', 'berapa', 'ringkasan', 'pesanan saya', 'cek pesanan'].some(phrase => lower.includes(phrase))
  }

  const handleSend = (inputText) => {
    const query = inputText.trim()
    if (!query) return

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setMessages(prev => [...prev, userMessage])
    setText('')
    setIsTyping(true)

    // Simulate AI typing delay
    setTimeout(() => {
      setIsTyping(false)
      const botMessageId = (Date.now() + 1).toString()
      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      if (isResetIntent(query)) {
        setCurrentOrder([])
        setMessages(prev => [...prev, {
          id: botMessageId,
          sender: 'bot',
          text: "Baik, draft pesanan saya kosongkan. Silakan mulai pesanan baru.",
          time: botTime
        }])
        return
      }

      if (isSummaryIntent(query)) {
        if (currentOrder.length === 0) {
          setMessages(prev => [...prev, {
            id: botMessageId,
            sender: 'bot',
            text: "Draft pesanan Anda masih kosong. Silakan sebutkan menu yang ingin dipesan.",
            time: botTime
          }])
        } else {
          const summaryLines = currentOrder.map(item => `- ${item.quantity}x ${item.name}${describeSmartOrderOptions(item)}: ${formatPrice(item.price * item.quantity)}`).join('\n')
          setMessages(prev => [...prev, {
            id: botMessageId,
            sender: 'bot',
            text: `Ini ringkasan sementara pesanan Anda:\n${summaryLines}\n\nTotal: ${formatPrice(currentOrder.reduce((sum, item) => sum + item.price * item.quantity, 0))}`,
            orderItems: [...currentOrder],
            time: botTime
          }])
        }
        return
      }

      // Check if user is finishing the order
      if (isNegativeOrFinish(query)) {
        if (currentOrder.length === 0) {
          setMessages(prev => [...prev, {
            id: botMessageId,
            sender: 'bot',
            text: "Keranjang pesanan Anda masih kosong. Menu apa yang ingin Anda tambahkan terlebih dahulu?",
            time: botTime
          }])
        } else {
          setMessages(prev => [...prev, {
            id: botMessageId,
            sender: 'bot',
            text: "Luar biasa! Berikut adalah ringkasan pesanan akhir Anda. Klik tombol di bawah untuk memasukkan semua item ke keranjang belanja!",
            isFinalReceipt: true,
            orderItems: [...currentOrder],
            time: botTime
          }])
        }
        return
      }

      // Parse input for items. Notes are read per menu segment so they do not leak to other items.
      const parsedItems = parseSegmentsForItems(query, menuList, parseMessageForItems)

      if (parsedItems.length > 0) {
        const availableItems = parsedItems.filter(item => !isMenuUnavailable(item))
        const unavailableItems = parsedItems.filter(isMenuUnavailable)

        if (availableItems.length === 0) {
          const unavailableLines = unavailableItems.map(item => `- ${item.name} sedang habis`).join('\n')
          setMessages(prev => [...prev, {
            id: botMessageId,
            sender: 'bot',
            text: `Maaf, menu berikut sedang habis dan tidak bisa dipesan:\n${unavailableLines}\n\nSilakan pilih menu lain yang tersedia.`,
            time: botTime
          }])
          return
        }

        // Merge with current order
        let updatedOrder = [...currentOrder]
        availableItems.forEach(newItem => {
          const newItemKey = getSmartOrderItemKey(newItem)
          const existingIndex = updatedOrder.findIndex(item => getSmartOrderItemKey(item) === newItemKey)
          if (existingIndex > -1) {
            updatedOrder[existingIndex].quantity += newItem.quantity
          } else {
            updatedOrder.push(newItem)
          }
        })
        setCurrentOrder(updatedOrder)

        // Generate bot speech response
        const itemLines = availableItems.map(item => `- ${item.quantity}x ${item.name}${describeSmartOrderOptions(item)}`).join('\n')
        const unavailableText = unavailableItems.length > 0
          ? `\n\nMenu berikut tidak saya masukkan karena sedang habis:\n${unavailableItems.map(item => `- ${item.name}`).join('\n')}`
          : ''
        const textResponse = `Saya berhasil menambahkan:\n${itemLines}${unavailableText}\n\nApakah ada tambahan menu lainnya? (Jika tidak, ketik "Selesai" atau "Cukup")`

        setMessages(prev => [...prev, {
          id: botMessageId,
          sender: 'bot',
          text: textResponse,
          orderItems: updatedOrder,
          time: botTime
        }])
      } else {
        const recommendations = getSmartRecommendations(query, menuList.filter(item => !isMenuUnavailable(item)))
        if (recommendations.length > 0) {
          const recommendationLines = recommendations.map(item => `- ${item.name} (${formatPrice(item.price)})`).join('\n')
          setMessages(prev => [...prev, {
            id: botMessageId,
            sender: 'bot',
            text: `Rekomendasi saya:\n${recommendationLines}\n\nKalau cocok, ketik jumlahnya. Contoh: "1 ${recommendations[0].name}".`,
            time: botTime
          }])
          return
        }

        // Fallback responses
        let fallbackText = "Maaf, saya tidak menemukan nama menu yang sesuai dalam pesan Anda. Silakan sebutkan nama menu (seperti: 'Ayam Suwir' atau 'Risol')."
        const suggestions = getClosestMenuSuggestions(query, menuList)
        if (suggestions.length > 0) {
          fallbackText = `Saya belum yakin menu yang dimaksud. Mungkin maksud Anda salah satu ini?\n- ${suggestions.join('\n- ')}\n\nCoba ketik dengan jumlahnya, misalnya "1 ${suggestions[0]}".`
        } else if (normalizeText(query).includes('nasi') && !normalizeText(query).includes('daun') && !normalizeText(query).includes('bom') && !normalizeText(query).includes('uduk')) {
          fallbackText = "Kami memiliki pilihan nasi: 'Nasi Biasa', 'Nasi Daun Jeruk', 'Nasi Bom Merah', atau 'Nasi Uduk'. Jika ingin mengganti nasi rice bowl, ketik contoh: '1 ayam suwir pake nasi bom merah'."
        }

        setMessages(prev => [...prev, {
          id: botMessageId,
          sender: 'bot',
          text: fallbackText,
          time: botTime
        }])
      }
    }, 1000)
  }

  const handleSuggestionClick = (suggestion) => {
    handleSend(suggestion)
  }

  const addAllToCart = (itemsToCheckout = currentOrder) => {
    const availableItems = itemsToCheckout.filter(item => !isMenuUnavailable(item))
    if (availableItems.length === 0) return
    availableItems.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        addItem(item)
      }
    })
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  const handleReset = () => {
    if (window.confirm("Apakah Anda ingin menghapus obrolan dan memulai pesanan baru?")) {
      setCurrentOrder([])
      setMessages([
        {
          id: 'welcome',
          sender: 'bot',
          text: "Halo! Saya adalah AI Order Assistant.\nMenu apa yang ingin Anda pesan hari ini? Saya bisa membaca nama menu pendek, jumlah angka/kata, typo ringan, pilihan rasa, pilihan nasi, dan list pesanan kantor. Contoh: 'dua nasi jeruk, 1 suwir pedas, 1 asam manis tidak pedas'.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    }
  }

  const currentTotal = currentOrder.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const suggestionsToUse = currentOrder.length > 0 ? followUpSuggestions : initialSuggestions

  return (
    <div className="smart-order-page" style={{ minHeight: isCompact ? 'calc(100vh - 88px)' : 'calc(100vh - 120px)', height: isCompact ? 'auto' : 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: isCompact ? 96 : undefined }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isCompact ? 'flex-start' : 'center', flexShrink: 0, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: isCompact ? 'flex-start' : 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/" style={{ color: '#1F2937', marginTop: isCompact ? 2 : 0 }}><ChevronLeft size={24} /></Link>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                AI Smart Order
                <Zap size={18} color="#F59E0B" style={{ animation: 'bounce-soft 2s infinite' }} />
              </h1>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFBEB 100%)',
                border: '2px solid #F59E0B',
                color: '#7C2D12',
                borderRadius: 16,
                padding: isCompact ? '12px 14px' : '13px 16px',
                fontSize: isCompact ? 12 : 13,
                fontWeight: 800,
                lineHeight: 1.45,
                maxWidth: isCompact ? '100%' : 680,
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.18)',
              }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background: '#F59E0B',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
                }}>
                  <AlertCircle size={17} />
                </div>
                <span><strong>Format penting:</strong> Contoh: 1 ayam suwir pake nasi bom merah, 2 ayam katsu diganti nasi uduk. Bisa juga paste list kantor: exa - ayam suwir nasi bom merah. Pisahkan setiap menu dengan koma agar terbaca akurat.</span>
              </div>
            </div>
            <span style={{ fontSize: 11, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, marginTop: 2 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} /> Online Assistant
            </span>
          </div>
        </div>
        
        {currentOrder.length > 0 && (
          <button 
            onClick={handleReset} 
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#DC2626', background: '#FEE2E2', border: 'none', padding: '6px 12px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#FCA5A5'}
            onMouseLeave={e => e.currentTarget.style.background = '#FEE2E2'}
          >
            <Trash2 size={13} />
            <span>Reset Chat</span>
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isCompact || currentOrder.length === 0 ? '1fr' : '1.5fr 1fr', gap: isCompact ? 14 : 20, flex: 1, minHeight: 0 }}>
        
        {/* Chatbot Column */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'white', borderRadius: isCompact ? 18 : 24, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.03)', minHeight: isCompact ? '62vh' : undefined }}>
          {/* Messages Feed */}
          <div style={{ flex: 1, overflowY: 'auto', padding: isCompact ? 14 : 20, display: 'flex', flexDirection: 'column', gap: isCompact ? 12 : 16 }}>
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot'
              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: isBot ? 'flex-start' : 'flex-end', alignItems: 'flex-end', gap: 8 }}>
                  {isBot && (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #DC2626, #EF4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 800, flexShrink: 0, boxShadow: '0 4px 10px rgba(220, 38, 38, 0.2)' }}>
                      AI
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', flexDirection: 'column', maxWidth: isCompact ? '86%' : '75%', gap: 4 }}>
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: isBot ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                      background: isBot ? '#F3F4F6' : 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
                      color: isBot ? '#1F2937' : 'white',
                      fontSize: 14,
                      lineHeight: 1.5,
                      whiteSpace: 'pre-line',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.01)',
                      border: isBot ? '1px solid #E5E7EB' : 'none'
                    }}>
                      {msg.text}

                      {/* Render Final Receipt summary card inside chat bubble if flagged */}
                      {msg.isFinalReceipt && msg.orderItems && (
                        <div style={{ marginTop: 12, background: 'white', borderRadius: 12, padding: 14, color: '#1F2937', border: '1px solid #E5E7EB' }}>
                          <h4 style={{ margin: '0 0 10px 0', fontSize: 13, fontWeight: 800, borderBottom: '1px solid #F3F4F6', paddingBottom: 6 }}>Final Receipt</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {msg.orderItems.map((item, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                <span style={{ fontWeight: 600 }}>{item.quantity}x {item.name}{describeSmartOrderOptions(item)}</span>
                                <span style={{ color: '#DC2626', fontWeight: 700 }}>{formatPrice(item.price * item.quantity)}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 13, borderTop: '1px dashed #E5E7EB', paddingTop: 8, marginTop: 8 }}>
                            <span>Total</span>
                            <span style={{ color: '#DC2626' }}>{formatPrice(msg.orderItems.reduce((s, i) => s + i.price * i.quantity, 0))}</span>
                          </div>
                          <button 
                            onClick={() => addAllToCart(msg.orderItems)} 
                            className="btn-primary" 
                            style={{ width: '100%', marginTop: 12, padding: '8px 12px', fontSize: 12, borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}
                          >
                            <ShoppingCart size={13} />
                            <span>Add All to Cart</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 9, color: '#9CA3AF', alignSelf: isBot ? 'flex-start' : 'flex-end', marginRight: isBot ? 0 : 4, marginLeft: isBot ? 4 : 0 }}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              )
            })}

            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #DC2626, #EF4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 800 }}>
                  AI
                </div>
                <div style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', padding: '12px 18px', borderRadius: '16px 16px 16px 4px', display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span className="dot-blink" style={{ width: 6, height: 6, background: '#9CA3AF', borderRadius: '50%', display: 'inline-block' }} />
                  <span className="dot-blink" style={{ width: 6, height: 6, background: '#9CA3AF', borderRadius: '50%', display: 'inline-block', animationDelay: '0.2s' }} />
                  <span className="dot-blink" style={{ width: 6, height: 6, background: '#9CA3AF', borderRadius: '50%', display: 'inline-block', animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggestions Bar */}
          <div style={{ padding: '8px 16px', background: '#F9FAFB', borderTop: '1px solid #E5E7EB', display: 'flex', gap: 8, overflowX: 'auto', flexShrink: 0 }}>
            {suggestionsToUse.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(s)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 12,
                  background: 'white',
                  border: '1.5px solid #E5E7EB',
                  fontSize: 12,
                  color: '#4B5563',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#DC2626'; e.currentTarget.style.color = '#DC2626' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#4B5563' }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Message Input Box */}
          <div style={{ padding: 16, borderTop: '1px solid #E5E7EB', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(text)
                }
              }}
              placeholder="Ketik pesanan"
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 14,
                border: '1.5px solid #E5E7EB',
                fontSize: 14,
                outline: 'none',
                transition: 'all 0.2s',
                resize: 'none',
                minHeight: isCompact ? 46 : 52,
                maxHeight: 120,
                lineHeight: 1.35,
                fontFamily: 'inherit'
              }}
              onFocus={e => e.target.style.borderColor = '#DC2626'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'}
            />
            <button
              onClick={() => handleSend(text)}
              disabled={!text.trim() || isTyping}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: text.trim() ? 'linear-gradient(135deg, #DC2626, #EF4444)' : '#E5E7EB',
                color: 'white',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: text.trim() ? 'pointer' : 'default',
                transition: 'all 0.2s',
                boxShadow: text.trim() ? '0 4px 12px rgba(220, 38, 38, 0.25)' : 'none'
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Live Basket Panel (Only shows when items exist, Desktop Only) */}
        {currentOrder.length > 0 && (
          <div className="animate-scale-in" style={{ display: 'flex', flexDirection: 'column', background: 'white', borderRadius: isCompact ? 18 : 24, border: '1px solid #E5E7EB', padding: isCompact ? 16 : 20, boxShadow: '0 4px 24px rgba(0,0,0,0.03)', height: isCompact ? 'auto' : '100%', minHeight: 0 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px 0', borderBottom: '1px solid #F3F4F6', paddingBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              Draft Order Basket
            </h3>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
              {currentOrder.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #F9FAFB' }}>
                  <img src={optimizeImageUrl(item.image, 140)} alt={item.name} loading="lazy" decoding="async" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1F2937' }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{formatPrice(item.price)} x{item.quantity}</div>
                    {describeSmartOrderOptions(item) && <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{describeSmartOrderOptions(item).replace(/^\s*\(|\)\s*$/g, '')}</div>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#DC2626' }}>
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '2px solid #F3F4F6', paddingTop: 14, marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, fontSize: 14, marginBottom: 14 }}>
                <span>Subtotal ({currentOrder.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span style={{ color: '#DC2626', fontSize: 16 }}>{formatPrice(currentTotal)}</span>
              </div>
              <button 
                onClick={() => addAllToCart()} 
                className="btn-primary" 
                style={{ width: '100%', padding: '12px 16px', borderRadius: 14, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
              >
                <ShoppingCart size={16} />
                <span>Add All to Cart</span>
              </button>
            </div>
          </div>
        )}

      </div>
      {showToast && <div className="toast">Pesanan berhasil dimasukkan ke keranjang!</div>}
    </div>
  )
}
