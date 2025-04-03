import fs from 'fs'
import path from 'path'

export async function deleteInventoryData(steamId: string) {

    const rootFolder = process.cwd();
    const filePath = path.join(rootFolder, `temp/full_inventory_data-${steamId}.json`);
    const data = fs.readFileSync(filePath, 'utf-8');

    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err: any) => {
        if (err) {
            console.error('Error deleting file:', err);
            return { status: false }
        } else {
            console.log('File deleted successfully.');
            return { success: true }
        }
        });
        console.log('File does not exist');
        return { status: false }
    }
}
