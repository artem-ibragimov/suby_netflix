export function saveToFile(data: string, fileName: string) {
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.setAttribute('style', 'display: none');

    const json = JSON.stringify(data, null, 4);
    const blob = new Blob([json], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
}
