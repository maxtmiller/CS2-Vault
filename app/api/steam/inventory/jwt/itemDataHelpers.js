export function findFloatRange(float) {
    const floatRanges = [
        { min: 0.00, max: 0.01 },
        { min: 0.00, max: 0.02 },
        { min: 0.00, max: 0.03 },
        { min: 0.00, max: 0.04 },
        { min: 0.00, max: 0.07 },
        { min: 0.07, max: 0.08 },
        { min: 0.07, max: 0.09 },
        { min: 0.07, max: 0.10 },
        { min: 0.07, max: 0.15 },
        { min: 0.15, max: 0.18 },
        { min: 0.15, max: 0.21 },
        { min: 0.15, max: 0.24 },
        { min: 0.15, max: 0.27 },
        { min: 0.15, max: 0.38 },
        { min: 0.38, max: 0.39 },
        { min: 0.38, max: 0.40 },
        { min: 0.38, max: 0.41 },
        { min: 0.38, max: 0.42 },
        { min: 0.38, max: 0.45 },
        { min: 0.45, max: 0.50 },
        { min: 0.45, max: 0.60 },
        { min: 0.45, max: 0.70 },
        { min: 0.45, max: 0.80 },
        { min: 0.45, max: 0.90 },
        { min: 0.45, max: 1.00 },
    ];
    for (const range of floatRanges) {
        if (float >= range.min && float < range.max) return range;
    }
    return null;
}

export function getWearName(float) {
    if (float < 0.07) return 'Factory New';
    if (float < 0.15) return 'Minimal Wear';
    if (float < 0.38) return 'Field-Tested';
    if (float < 0.45) return 'Well-Worn';
    if (float <= 1.00) return 'Battle-Scarred';
    return null;
}

export function buildPriceTitle(item, data) {
    if (!('paint_wear' in data)) return item.name;
    if (data.is_stattrak) return `StatTrak™ ${item.name} (${data.wear_name})`;
    if (data.is_souvenir) return `Souvenir ${item.name} (${data.wear_name})`;
    return `${item.name} (${data.wear_name})`;
}

export function buildCSFloatUrl(data) {
    if ('paint_wear' in data) {
        const category = data.is_souvenir ? 3 : data.is_stattrak ? 2 : 1;
        const { min, max } = findFloatRange(data.paint_wear);
        return `https://csfloat.com/search?sort_by=lowest_price&category=${category}&min_float=${min}&max_float=${max}&def_index=${data.def_index}&paint_index=${data.paint_index}`;
    }
    if (data.sticker_id) return `https://csfloat.com/search?sort_by=lowest_price&sticker_index=${data.sticker_id}`;
    if (data.keychain_index) return `https://csfloat.com/search?sort_by=lowest_price&keychain_index=${data.keychain_index}`;
    return `https://csfloat.com/search?sort_by=lowest_price&def_index=${data.def_index}`;
}

export function buildSteamMarketUrl(item, data) {
    let name;
    if ('paint_wear' in data) {
        const prefix = data.is_souvenir ? 'Souvenir ' : data.is_stattrak ? 'StatTrak™ ' : '';
        name = `${prefix}${item.name} (${data.wear_name})`;
    } else {
        name = item.name;
    }
    const encoded = encodeURIComponent(name).replace(/\(/g, '%28').replace(/\)/g, '%29');
    return `https://steamcommunity.com/market/listings/730/${encoded}`;
}
