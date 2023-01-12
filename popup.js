/*
 * プルダウンメニューで選択された言語を保存／表示されるようにする
 */
(() => {
    chrome.storage.sync.get(['language'], (result) => {
        const options = document.getElementById('language').options;

        Array.from(options).forEach((option) => {
            if (option.value === result.language) {
                option.selected = true;
            } else {
                option.selected = false;
            }
        });
    });
})();

function saveOptions() {
    const select = document.getElementById('language');
    chrome.storage.sync.set({
        language: select.value,
    });
}

document.getElementById('language').addEventListener('input', saveOptions);
