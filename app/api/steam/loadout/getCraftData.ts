import type { ResponseDataSticker } from './route'
import { fetchData, getFullItemData, getFullPriceData, getFullSkinData } from "@/lib/data-loader"
import { ItemData, SkinItem, Sticker } from "@/types/raw-item"
import { PriceData } from "@/types/price"
import type { InventoryItem } from "@/lib/steam-api"
import protobuf from 'protobufjs';
import CRC32 from 'crc-32';
import path from 'path'


let full_price_data: PriceData;
let full_item_data: ItemData;

function generateRandomID(length = 20) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}



async function generateInspectLinkFromObject(props: SkinItem): Promise<string | null> {
    const previewLink = "steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20";

    function floatToBytes(floatValue: number): number {
        const floatArray = new Float32Array(1);
        floatArray[0] = floatValue;
        const byteArray = new Uint32Array(floatArray.buffer);
        return byteArray[0];
    }

    async function generateHex(props: SkinItem): Promise<string> {
        const stickers = props.stickers || [];

        const econ = {
            defindex: props.def_index,
            paintindex: props.paint_index,
            paintseed: props.paint_seed,
            rarity: props.rarity,
            paintwear: floatToBytes(props?.paint_wear),
            customname: props.custom_name || "",
            stickers: stickers.map((sticker: Sticker) => ({
                ...sticker,
                stickerId: sticker.sticker_id,
                offsetX: sticker.offset_x === undefined ? 0 : sticker.offsetX,
                offsetY: sticker.offset_y === undefined ? 0 : sticker.offsetY,
                rotation: sticker.rotation === undefined ? 0 : sticker.rotation,
            })),
        };

        const filePath = path.join(process.cwd(), 'public/econ.proto');
        const root = await protobuf.load(filePath);
        const CEconItemPreviewDataBlock = root.lookupType('CEconItemPreviewDataBlock');

        const errMsg = CEconItemPreviewDataBlock.verify(econ);
        if (errMsg) throw new Error(errMsg);

        let payload = CEconItemPreviewDataBlock.encode(econ).finish();

        payload = Buffer.concat([Uint8Array.from([0]), payload]);

        let crc = CRC32.buf(payload);

        const x_crc = (crc & 0xffff) ^ (CEconItemPreviewDataBlock.encode(econ).finish().length * crc);

        const crcBuffer = Buffer.alloc(4);
        crcBuffer.writeUInt32BE((x_crc & 0xffffffff) >>> 0, 0);

        const buffer = Buffer.concat([payload, crcBuffer]);

        return buffer.toString("hex").toUpperCase();
    }

    const hex = await generateHex(props);

    return `${previewLink}${hex}`;
}


export async function getSuggestionCraftInfo(
    sticker: ResponseDataSticker,
    item: InventoryItem,
): Promise<any | null> {

    await fetchData();

    full_price_data = getFullPriceData()
    full_item_data = getFullItemData()

    const sticker_info = Object.values(full_item_data).find(item => item.name === sticker.name);

    if (!sticker_info) {
        console.error(`Sticker not found: ${sticker.name}`);
        return null;
    }

    const item_data = {
        ...item,
    };

    item_data.stickers = Array.from({ length: 4 }, (_, i) => ({
        slot: i,
        sticker_id: parseInt(sticker_info.id.split('-')[1], 10),
        wear: null,
        scale: null,
        rotation: null,
        offset_x: null,
        offset_y: null,
        name: sticker.name,
        image: sticker_info.image,
        steam_price: full_price_data[sticker.name]
          ? full_price_data[sticker.name].steam.last_ever
          : null,
    }));
    item_data.id = generateRandomID();
    item_data.inspect_link = await generateInspectLinkFromObject(item_data as any);
    item_data.reason = sticker.description;

    return item_data;
};