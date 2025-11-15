// Since we are in a module, globals from CDN scripts must be accessed via the `window` object.
// We declare them on the global Window interface for TypeScript to recognize them.
declare global {
    interface Window {
        saveAs: (blob: Blob, fileName: string) => void;
        htmlDocx: {
            asBlob: (content: string, options?: any) => Promise<Blob>;
        };
        XLSX: any;
    }
}


export const exportToWord = async (elementId: string, fileName: string, headerText: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error('Element not found!');
        return;
    }

    try {
        const content = element.innerHTML;
        const fileBuffer = await window.htmlDocx.asBlob(content, {
             orientation: 'portrait',
             margins: { top: 720, right: 720, bottom: 720, left: 720 }, // 1 inch margins
        });

        window.saveAs(fileBuffer, `${fileName}.docx`);
    } catch (error) {
        console.error('Error exporting to Word:', error);
    }
};

export const exportToExcel = (elementId: string, fileName: string) => {
    const table = document.getElementById(elementId);
    if (!table) {
        console.error('Table element not found!');
        return;
    }
    
    try {
        const wb = window.XLSX.utils.table_to_book(table, { sheet: "Raport" });
        window.XLSX.writeFile(wb, fileName);
    } catch (error) {
        console.error('Error exporting to Excel:', error);
    }
};