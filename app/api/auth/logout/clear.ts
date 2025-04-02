import fs from 'fs';

export async function deleteInventoryData() {

    const filePath = 'public/full_inventory_data.json';

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
