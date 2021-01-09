export class DnD {
    _ref: HTMLElement | null;
    constructor(selector: string) {
        this._ref = document.querySelector(selector);
        if (!this._ref) {
            throw new Error(`Element with selector ${selector} not found`);
        }

        this._ref.addEventListener('dragover', (event) => {
            if (!event.dataTransfer) { return; }
            event.stopPropagation();
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
        });
    }

    onFileDropped(callback: (v: string) => void) {
        this._ref?.addEventListener('drop', (event) => {
            if (!event.dataTransfer) { return; }
            event.stopPropagation();
            event.preventDefault();
            const fileList = event.dataTransfer.files;

            const reader = new FileReader();

            reader.addEventListener('loadend', (event) => {
                try {
                    const content = JSON.parse(event.target?.result as string);
                    callback(content);
                } catch (e) {
                    alert("Incorrect file: " + e.message);
                }
            });

            reader.readAsText(fileList[0]);
        });
    }
}
