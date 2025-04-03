import { promises as fs } from 'fs';
import path from 'path';

export async function readInventory() {
  const filePath = path.join(process.cwd(), './public/full_inventory_data.json'); // Adjust path if needed
  try {
    await fs.access(filePath);
    console.log("File exists!");
    const fileContents = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContents);
  } catch {
    console.log("File does not exist.");
    return [];
  }      
}