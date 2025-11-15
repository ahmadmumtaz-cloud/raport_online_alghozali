export const parseJsonFile = <T>(file: File): Promise<T> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                if (event.target?.result) {
                    const json = JSON.parse(event.target.result as string);
                    resolve(json as T);
                } else {
                    reject(new Error("File could not be read."));
                }
            } catch (error) {
                reject(new Error("Invalid JSON file."));
            }
        };
        reader.onerror = () => {
            reject(new Error("Error reading the file."));
        };
        reader.readAsText(file);
    });
};
