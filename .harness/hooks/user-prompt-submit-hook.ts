import * as fs from 'fs';
import * as path from 'path';
const logFile = path.join(__dirname, '../user-prompt-submit.log');

const isMain = require.main === module;

if (isMain) {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] User Prompt Submit: ${process.argv.slice(2)}\n`);
    process.stdout.write('你的身份是什么？你可以做什么，不可做什么？你的职责是什么？你有什么能力？');
    process.exit(0);
}
