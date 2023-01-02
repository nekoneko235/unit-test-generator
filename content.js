(() => {
    document.addEventListener(
        'keydown',
        (e) => {
            if ((e.ctrlKey || e.metaKey) && e.code === 'Backslash') {
                try {
                    // 以下言語が追加されることを想定し、拡張性を持たせておく
                    chrome.storage.sync.get(
                        {
                            language: 'PHP',
                        },
                        (result) => {
                            switch (result.language) {
                                case 'PHP':
                                    copyToClipboard(
                                        createPHPUnittest(acquireIO())
                                    );
                                    break;
                                default:
                                    throw new Error(
                                        '定義されていない言語です[result.language=' +
                                            result.language +
                                            ']'
                                    );
                            }
                        }
                    );
                } catch (error) {
                    console.error(error);
                }
            }
        },
        {
            once: false,
            passive: true,
            capture: false,
        }
    );
})();

function acquireIO() {
    let name = null;
    let input = null;
    let output = null;
    let sections = null;
    let io = [];

    if (document.getElementById('proble_description') != null) {
        // Atcoder過去問
        sections = document
            .getElementById('proble_description')
            .querySelectorAll('section');
    } else {
        // 受験=>問題文
        // 受験履歴=>再提出=>問題文
        sections = document
            .getElementById('accordion-area-problem-sentence')
            .querySelectorAll('section');
    }

    if (!sections.length) {
        throw new Error('問題文が見つかりません');
    }

    for (let i = 0; i < sections.length; i++) {
        let section = sections[i];

        let h3 = section.querySelectorAll('h3');
        let pre = section.querySelectorAll('pre');

        if (h3.length > 0 && pre.length > 0 && h3[0].offsetParent) {
            let header = h3[0].firstChild.textContent.trim();
            let example = pre[0].textContent;

            if (
                header.indexOf('入力例') === 0 ||
                header.indexOf('Sample Input') === 0
            ) {
                name = header.replace(/\s+/g, '_');
                input = example;
            } else if (
                header.indexOf('出力例') === 0 ||
                header.indexOf('Sample Output') === 0
            ) {
                output = example;
            }
        }

        if (name != null && input != null && output != null) {
            io.push({
                name: name,
                input: input,
                output: output,
            });
            name = input = output = null;
        }
    }

    if (!io.length) {
        throw new Error('入出力が見つかりません');
    }

    return io;
}

function createPHPUnittest(io) {
    let text = `<?php
use PHPUnit\\Framework\\TestCase;

class TaskTest extends TestCase
{
    /**
     * @dataProvider ioProvider
     */
    public function testSampleIO(string $input, string $expected): void
    {
        $stringIo = fopen('php://memory', 'r+');
        fwrite($stringIo, $input);
        rewind($stringIo);
        $this->expectOutputRegex("/^(\\s+)?\\Q" . $expected . "\\E(\\s+)?$/");
        // "Compilation failed"の場合は、OutputRegexの代わりにOutputStringを実行する
        // その場合、行頭または末尾にホワイトスペースがあるとテストにパスしないが
        // ジャッジサーバーではACになるので気にしないでおっけー
        // $this->expectOutputString($expected);
        solver($stringIo);
    }

    public function ioProvider(): array
    {
        return [`;

    for (let i = 0; i < io.length; i++) {
        text += `
            '${io[i].name}' => [
                <<<EOF
${io[i].input.trim()}
EOF,
                <<<EOF
${io[i].output.trim()}
EOF
            ],`;
    }

    text += `
        ];
    }
}`;

    return text;
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        console.log('コピーしました');
    } catch (error) {
        console.error((error && error.message) || 'コピーに失敗しました');
    }
}
