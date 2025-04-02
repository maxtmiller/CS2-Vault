import { NextResponse, NextRequest } from 'next/server';
import { getSuggestion } from './getSuggestion';
import { getSuggestionItemInfo, ItemData } from './getItemData';

export interface ResponseData {
    id: string,
    name: string;
    wear_name: string;
    description: string;
}

async function processJsonData(items: ResponseData[]): Promise<ItemData[]> {
    const results: ItemData[] = [];

    // Loop through each item in skins_data.json
    for (const item of items) {
        const result = await getSuggestionItemInfo(item);
        if (result) {
            results.push(result);
        }
    }

    return results;
}

export async function POST(request: NextRequest) {
    try {
        const items = await request.json();
        const results = await getSuggestion(items);
        const inventory = await processJsonData(results);
        return NextResponse.json(inventory);
    } catch (error) {
        console.error("Error retrieving inventory:", error);
        return NextResponse.json({ error: "Failed to get suggestion" }, { status: 500 });
    }
}