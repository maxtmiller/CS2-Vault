import dotenv from "dotenv";
dotenv.config();
import { CohereClientV2 } from 'cohere-ai';
import { GoogleGenAI } from "@google/genai";


export async function getItemSuggestionCohere(data: { items: any[], weapon_preferences: any[]}): Promise<any> {

    const apiKey: string | undefined = process.env.COHERE_API_KEY;
    if (!apiKey) {
        throw new Error("COHERE_API_KEY is not defined in the environment variables.");
    }
    const cohere = new CohereClientV2({ token: apiKey });

    try {
        let prompt = `
            ## User Message
            I have the following items: 
        `;
        for (const item of data.items) {
            const cur = ` a ${item.name} in ${item.wear} that costs $${item.price} with image ${item.image},`
            prompt += cur;
        }
        prompt += "suggest at least 4 items that fit with my loadout with the same colours and a similar price."

        prompt += "I want suggestions for the following item types only: "
        for (const item of data.weapon_preferences) {
            prompt += ' '+item;
        }

        console.log(prompt)

        const systemMessage = `
            ## Task and Context
            You are a specialist in Valve's game CS2 and you will suggest items for the user that have very similar colours to the items provided.
            DO NOT provide an item that the user inputted. Do NOT provide the same item type (if they provided a glove, DO NOT provide a glove back)
            Provide as many items as needed to complete their loadout with the main guns if they input any. That is, provide AT LEAST 3 items.
            Only provide the item types requested by the user, do not provide any other item types.
            Give items in the same price range as the ones inputted, DO NOT provide an item that is much more expensive unless it is a knife or glove.
            DO NOT include the wear in the item name, do not suggest stattrak items.
            For knives and gloves, remember the names have a star in front, like "★ Karambit | Fade" and "★ Moto Gloves | Spearmint"
            Do not include doppler phases in the name or any other specific details, like souvenir or stattrak just the name of the item.

            ## Style Guide
            Respond in following the exact json specification below for each item suggested, and put all the items into an array that you will return
            {
                id: (a string starting from 0, unique for each one)
                name: (the market hash name of the item, ie. USPS | Prinstream)
                wear_name: (the wear_name of the item, ie. Factory New)
                description: (why you think this is a good fit)
            }
        `;

        const messages = [{ role: "system", content: systemMessage }, { role: "user", content: prompt }] as any;

        const response = await cohere.chat({
            model: 'command-r-plus-08-2024',
            messages,

        });

        let responseText = "";
        if (response.message.content && response.message.content[0].type === "text") {
            // console.log(response.message.content[0].text);
            responseText = response.message.content[0].text;
        }

        const parsedResponse = JSON.parse(responseText);

        return parsedResponse;
    } catch (error: any) {
        console.error(`Error occurred: ${error.message}`);
        throw error;
    }
}


export async function getItemSuggestionGemini(data: { items: any[], weapon_preferences: any[]}): Promise<any> {

    const apiKey: string | undefined = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined in the environment variables.");
    }
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    try {

        let prompt = `
            ## User Message
            I have the following items: 
        `;
        for (const item of data.items) {
            const cur = ` a ${item.name} in ${item.wear} that costs $${item.price} with image ${item.image},`
            prompt += cur;
        }
        prompt += "suggest at least 4 items that fit with my loadout with the same colours and a similar price."

        prompt += "I want suggestions for the following item types only: "
        for (const item of data.weapon_preferences) {
            prompt += ' '+item;
        }

        console.log(prompt)

        const systemMessage = `
            ## Task and Context
            You are a specialist in Valve's game CS2 and you will suggest items for the user that have very similar colours to the items provided.
            DO NOT provide an item that the user inputted. Do NOT provide the same item type (if they provided a glove, DO NOT provide a glove back)
            Provide as many items as needed to complete their loadout with the main guns if they input any. That is, provide AT LEAST 3 items.
            Only provide the item types requested by the user, do not provide any other item types.
            Give items in the same price range as the ones inputted, DO NOT provide an item that is much more expensive unless it is a knife or glove.
            DO NOT include the wear in the item name, do not suggest stattrak items.
            For knives and gloves, remember the names have a star in front, like "★ Karambit | Fade" and "★ Moto Gloves | Spearmint"
            Do not include doppler phases in the name or any other specific details, like souvenir or stattrak just the name of the item.

            ## Style Guide
            Respond in following the exact json specification below for each item suggested, and put all the items into an array that you will return
            {
                id: (a string starting from 0, unique for each one)
                name: (the market hash name of the item, ie. USPS | Prinstream)
                wear_name: (the wear_name of the item, ie. Factory New)
                description: (why you think this is a good fit)
            }
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: systemMessage+prompt,
        });

        let responseText = "";
        if (response.text) {
            console.log(response.text);
            responseText = response.text;
        }

        const parsedResponse = JSON.parse(responseText.replace(/```json\s*/, "").replace(/```$/, ""));

        return parsedResponse;
    } catch (error: any) {
        console.error(`Error occurred: ${error.message}`);
        throw error;
    }
}


export async function getCraftSuggestionCohere(item: any): Promise<any> {

    const apiKey: string | undefined = process.env.COHERE_API_KEY;
    if (!apiKey) {
        throw new Error("COHERE_API_KEY is not defined in the environment variables.");
    }
    const cohere = new CohereClientV2({ token: apiKey });
    
    try {

        let prompt = `
            ## User Message
            I have the following item: a ${item.name} in ${item.wear} that costs $${item.price} with image ${item.image}.
            Suggest at least 5 different stickers that would fit well with this item in a 4x craft.
        `;

        console.log(prompt)

        const systemMessage = `
            ## Task and Context
            You are a specialist in Valve's game CS2 and you will suggest sticker crafts for the user that have very similar colours to the item provided and fit well.          

            ## Style Guide
            Respond in following the exact json specification below for each sticker suggested, and put all the stickers into an array that you will return. Do not respond with any other text.
            {
                id: (a string starting from 0, unique for each one)
                name: (the market hash name of the sticker, ie. Sticker | drop (Holo) | Antwerp 2022)
                description: (why you think this is a good fit)
            }
        `;

        const messages = [{ role: "system", content: systemMessage }, { role: "user", content: prompt }] as any;

        const response = await cohere.chat({
            model: 'command-r-plus-08-2024',
            messages: messages,

        });

        let responseText = "";
        if (response.message.content && response.message.content[0].type === "text") {
            // console.log(response.message.content[0].text);
            responseText = response.message.content[0].text;
        }

        const parsedResponse = JSON.parse(responseText.replace(/```json\s*/, "").replace(/```$/, ""));

        return parsedResponse;
    } catch (error: any) {
        console.error(`Error occurred: ${error.message}`);
        throw error;
    }
}


export async function getCraftSuggestionGemini(item: any): Promise<any> {

    const apiKey: string | undefined = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined in the environment variables.");
    }
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    try {

        let prompt = `
            ## User Message
            I have the following item: a ${item.name} in ${item.wear} that costs $${item.price} with image ${item.image}.
            Suggest at least 5 different stickers that would fit well with this item in a 4x craft.
        `;

        console.log(prompt)

        const systemMessage = `
            ## Task and Context
            You are a specialist in Valve's game CS2 and you will suggest sticker crafts for the user that have very similar colours to the item provided and fit well.          

            ## Style Guide
            Respond in following the exact json specification below for each sticker suggested, and put all the stickers into an array that you will return. Do not respond with any other text.
            {
                id: (a string starting from 0, unique for each one)
                name: (the market hash name of the sticker, ie. Sticker | drop (Holo) | Antwerp 2022)
                description: (why you think this is a good fit)
            }
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: systemMessage+prompt,
        });

        let responseText = "";
        if (response.text) {
            console.log(response.text);
            responseText = response.text;
        }

        const parsedResponse = JSON.parse(responseText.replace(/```json\s*/, "").replace(/```$/, ""));

        return parsedResponse;
    } catch (error: any) {
        console.error(`Error occurred: ${error.message}`);
        throw error;
    }
}
