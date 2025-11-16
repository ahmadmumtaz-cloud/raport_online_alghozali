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

/**
 * Helper function to wait for a global variable to become available on the window object.
 * This is useful for CDN-loaded libraries that might not be ready immediately.
 * @param name The name of the global variable to wait for.
 * @param timeout The maximum time to wait in milliseconds.
 * @returns A promise that resolves when the variable is found, or rejects on timeout.
 */
const waitForGlobal = (name: string, timeout = 5000): Promise<void> => {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const interval = 100;
        const maxAttempts = timeout / interval;

        const check = () => {
            if ((window as any)[name]) {
                resolve();
            } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(check, interval);
            } else {
                reject(new Error(`Failed to load library: Global variable "${name}" not found after ${timeout}ms.`));
            }
        };
        check();
    });
};


export const exportToWord = async (contentOrElementId: string, fileName:string, headerText: string, isHtmlString = false) => {
    try {
        await waitForGlobal('htmlDocx');
    } catch (error) {
        console.error(error);
        alert('Gagal mengekspor ke Word. Pustaka ekspor tidak berhasil dimuat. Silakan coba muat ulang halaman atau periksa koneksi internet Anda.');
        return;
    }

    let content = '';
    if (isHtmlString) {
        content = contentOrElementId;
    } else {
        const element = document.getElementById(contentOrElementId);
        if (!element) {
            console.error('Element not found!');
            alert('Elemen untuk diekspor tidak ditemukan.');
            return;
        }
        content = element.innerHTML;
    }


    try {
        const fileBuffer = await window.htmlDocx.asBlob(content, {
             orientation: 'portrait',
             margins: { top: 720, right: 720, bottom: 720, left: 720 }, // 1 inch margins
        });

        window.saveAs(fileBuffer, `${fileName}.docx`);
    } catch (error) {
        console.error('Error exporting to Word:', error);
        alert(`Terjadi kesalahan saat mengekspor ke Word: ${error instanceof Error ? error.message : 'Unknown error'}`);
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