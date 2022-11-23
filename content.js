(() => {
    document.addEventListener(
        'keydown',
        (e) => {
            if ((e.ctrlKey || e.metaKey) && e.code === 'Backslash') {
                try {
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
                                case 'Python3':
                                    copyToClipboard(
                                        createPyUnittest(acquireIO())
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
    let io = [];

    let sections = $('#proble_description section');
    if (!sections.length) {
        sections = $('#accordion-area-problem-sentence section');
    }

    if (!sections.length) {
        throw new Error('問題文が見つかりません');
    }

    for (let i = 0; i < sections.length; i++) {
        let section = $(sections[i]);

        let h3 = section.find('h3');
        let pre = section.find('pre');

        if (h3.length > 0 && pre.length > 0 && $(h3[0]).is(':visible')) {
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
        $stringIo = fopen("data://text/plain,$input", 'r');
        $this->expectOutputString($expected);
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

function createPyUnittest(io) {
    let text = `import sys
import task
import unittest
from io import StringIO

class TestClass(unittest.TestCase):
    def assertIO(self, input, output):
        stdout, stdin = sys.stdout, sys.stdin
        sys.stdout, sys.stdin = StringIO(), StringIO(input)
        task.solver()
        sys.stdout.seek(0)
        out = sys.stdout.read()[:-1]
        sys.stdout, sys.stdin = stdout, stdin
        self.assertEqual(out, output)
`;
    for (let i = 0; i < io.length; i++) {
        text += `
    def test_${io[i].name}(self):
        input = """${io[i].input.trim()}"""
        output = """${io[i].output.trim()}"""
        self.assertIO(input, output)
`;
    }

    text += `
if __name__ == "__main__":
    unittest.main()
`;

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
