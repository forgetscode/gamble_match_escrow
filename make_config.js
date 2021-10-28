const app_root = require('app-root-path').path;
const fs = require('fs');
const path = require('path');
const { exec } = require("child_process");
const gitconfig = require("./gitconfig.json");
const promise_then_catch = require("promise-then-catch/lib");
function flatten(lists) {
    return lists.reduce((a, b) => a.concat(b), []);
}

const getDirectories = srcpath => fs.statSync(srcpath).isDirectory() ? fs.readdirSync(srcpath)
    .map(file => path.join(srcpath, file))
    .filter(path => fs.statSync(path).isDirectory()) : srcpath;

const getDirectoriesRecursive = srcpath => [srcpath, ...flatten(getDirectories(srcpath).map(getDirectoriesRecursive))];

const getFilesInDirectory = (directories, pred) => directories
    .flatMap(dir => fs.readdirSync(dir).map(fn => `${dir}/${fn}`))
    .filter(pred);

const idl_root = `${app_root}/target/idl/`;
if (!fs.existsSync(idl_root)) {
    throw new Error("no idl built!");
}
let files = getFilesInDirectory(getDirectoriesRecursive(idl_root), path => path.endsWith(".json"));
if (files.length === 0) {
    throw new Error("couldn't get mint_idl.json!");
}
const idl = JSON.parse(fs.readFileSync(files[0], { encoding: "utf-8" }));
const programId = idl.programId;
files = getFilesInDirectory(getDirectoriesRecursive(app_root), path => path.endsWith("mint_idl.json"));
if (files.length === 0) {
    throw new Error("couldn't get mint_idl.json!");
}
const mintKey = JSON.parse(fs.readFileSync(files[0], { encoding: "utf-8" })).mint;
const to_write = JSON.stringify({ mintKey, programId, idl }, null, 4);
const config_git_root = `${app_root}/config_git`;
const doExec = (cmd, status, look_for) => exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.log(`${error.message}`);
        // return;
    }
    if (stderr) {
        console.log(`${stderr}`);
        // return;
    }
    console.log(`${stdout}`);
    if (!stdout || stdout.includes(look_for) || (Array.isArray(look_for) && look_for.some(x => stdout.includes(x)))) {
        status.go = true;
        status.msg = stdout;
    }
});

const await_status = async status => {
    while (status.go === false) {
        await new Promise(r => setTimeout(r, 100));
    }
    status.go = false;
}

const git_update = async () => {
    const status = {
        go: false,
        msg: ""
    };
    const gitconfig = require("./gitconfig.json");
    if (fs.existsSync(config_git_root)) {
        fs.rmSync(config_git_root, { recursive: true, force: true });
        // process.chdir(config_git_root);
        // doExec("git pull https://github.com/bigbizze/solana-gamble-game-config.git", status, "up to date");
    } else {
    }
    doExec("git clone https://github.com/bigbizze/solana-gamble-game-config.git config_git", status, "Cloning into");
    await await_status(status);
    process.chdir(config_git_root);
    fs.writeFileSync(`${config_git_root}/solana-gamble-game-config.json`, to_write, { encoding: "utf8" });
    doExec(`git add solana-gamble-game-config.json`, status);
    await await_status(status);
    doExec(`git commit -m "automatic update"`, status, ["automatic update", "working tree clean"]);
    await await_status(status);
    if (!status.msg.includes("working tree clean")) {
        const cmd = `git push https://${gitconfig.username}:${gitconfig.token}@github.com/bigbizze/solana-gamble-game-config.git`;
        doExec(cmd, status);
        await await_status(status);
    }
    fs.rmSync(config_git_root, { recursive: true, force: true });
}

git_update().catch(e => console.error(e));


