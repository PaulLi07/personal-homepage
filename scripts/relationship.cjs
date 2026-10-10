/* 本地生成Relationship密文。交互口令不输出、不持久化、不进入命令行参数。 */
"use strict";
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const readline = require("node:readline");
const { spawnSync } = require("node:child_process");
const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "modules/life/relationship/encrypted.js");
const ITERATIONS = 600000;
const MAX_ITERATIONS = 2000000;
const MAX_BYTES = 1024 * 1024;
const AAD = Buffer.from("personal-homepage:relationship:v1", "utf8");

function validatePlaintext(item) {
  if (!item || typeof item !== "object" || Array.isArray(item) || Object.keys(item).length !== 2 ||
      typeof item.title !== "string" || typeof item.body !== "string" || !item.title.trim() || item.title.length > 300) {
    throw new Error("私密JSON必须且只能包含字符串title与body，title不可为空且最长300字符。");
  }
  const serialized = JSON.stringify(item);
  if (Buffer.byteLength(serialized, "utf8") > MAX_BYTES) throw new Error("私密正文超过1MiB上限。");
  return serialized;
}

function bytes(value, max) {
  if (typeof value !== "string" || !value.length || value.length > Math.ceil(max / 3) * 4 ||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    throw new Error("密文格式无效。");
  }
  const decoded = Buffer.from(value, "base64");
  if (decoded.length > max || decoded.toString("base64") !== value) throw new Error("密文格式无效。");
  return decoded;
}

function validatePayload(payload) {
  const keys = ["version", "iterations", "salt", "iv", "ciphertext"];
  if (!payload || typeof payload !== "object" || Array.isArray(payload) ||
      Object.keys(payload).length !== keys.length || keys.some(key => !Object.hasOwn(payload, key)) ||
      payload.version !== 1 || !Number.isInteger(payload.iterations) ||
      payload.iterations < ITERATIONS || payload.iterations > MAX_ITERATIONS) throw new Error("密文格式无效。");
  const salt = bytes(payload.salt, 16);
  const iv = bytes(payload.iv, 12);
  const ciphertext = bytes(payload.ciphertext, MAX_BYTES + 16);
  if (salt.length !== 16 || iv.length !== 12 || ciphertext.length < 17) throw new Error("密文格式无效。");
  return { salt, iv, ciphertext };
}

function derive(password, salt, iterations) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, 32, "sha256", (error, key) => error ? reject(error) : resolve(key));
  });
}

async function encryptContent(item, password) {
  if (typeof password !== "string" || Array.from(password).length < 12 || password.length > 1024) {
    throw new Error("口令至少12个字符，最长1024字符；建议使用独立的长随机口令。");
  }
  const plaintext = Buffer.from(validatePlaintext(item), "utf8");
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = await derive(password, salt, ITERATIONS);
  try {
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
    cipher.setAAD(AAD);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);
    return { version: 1, iterations: ITERATIONS, salt: salt.toString("base64"), iv: iv.toString("base64"),
      ciphertext: ciphertext.toString("base64") };
  } finally {
    key.fill(0);
    plaintext.fill(0);
  }
}

async function decryptContent(payload, password) {
  const { salt, iv, ciphertext } = validatePayload(payload);
  const key = await derive(password, salt, payload.iterations);
  let clear;
  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
    decipher.setAAD(AAD);
    decipher.setAuthTag(ciphertext.subarray(-16));
    clear = Buffer.concat([decipher.update(ciphertext.subarray(0, -16)), decipher.final()]);
    const item = JSON.parse(clear.toString("utf8"));
    validatePlaintext(item);
    return item;
  } finally {
    key.fill(0);
    if (clear) clear.fill(0);
  }
}

function inside(folder, file) {
  const relative = path.relative(folder, file);
  return !relative.startsWith(".." + path.sep) && relative !== ".." && !path.isAbsolute(relative);
}

async function validateInputPath(input, root = ROOT) {
  const resolvedRoot = await fs.realpath(root);
  const resolved = await fs.realpath(path.resolve(input));
  if (inside(resolvedRoot, resolved)) {
    const privateFolder = path.join(resolvedRoot, ".private");
    if (!inside(privateFolder, resolved)) throw new Error("明文输入不能位于公开项目目录；请移到项目外或被忽略的.private目录。");
    const relative = path.relative(resolvedRoot, resolved);
    const tracked = spawnSync("git", ["ls-files", "--error-unmatch", "--", relative], { cwd: resolvedRoot, stdio: "ignore" });
    const ignored = spawnSync("git", ["check-ignore", "-q", "--", relative], { cwd: resolvedRoot, stdio: "ignore" });
    if (tracked.status === 0 || ignored.status !== 0) throw new Error(".private输入必须未被Git跟踪且已被忽略；请改用项目外文件。");
  }
  return resolved;
}

function hiddenPassword(prompt) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error("请在本地交互终端运行；不从参数、环境变量或管道读取口令。");
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    const wasRaw = Boolean(input.isRaw);
    let value = "";
    readline.emitKeypressEvents(input);
    process.stdout.write(prompt);
    input.setRawMode(true);
    input.resume();
    function finish(error) {
      input.removeListener("keypress", keypress);
      input.setRawMode(wasRaw);
      input.pause();
      process.stdout.write("\n");
      const result = value;
      value = "";
      if (error) reject(error); else resolve(result);
    }
    function keypress(character, key = {}) {
      if (key.ctrl && (key.name === "c" || key.name === "d")) return finish(new Error("已取消，未生成新密文。"));
      if (key.name === "return" || key.name === "enter") return finish();
      if (key.name === "backspace") { value = Array.from(value).slice(0, -1).join(""); return; }
      if (!key.ctrl && !key.meta && character && !/[\u0000-\u001f\u007f]/.test(character)) {
        if (value.length + character.length <= 1024) value += character;
      }
    }
    input.on("keypress", keypress);
  });
}

function registration(payload) {
  return "/* 本地生成的密文；不要将口令或明文写入公开源码。 */\nwindow.Homepage.registerEncryptedRelationship(" + JSON.stringify(payload, null, 2) + ");\n";
}

function parseRegistration(source) {
  const match = source.match(/^\s*(?:\/\*[\s\S]*?\*\/\s*)?window\.Homepage\.registerEncryptedRelationship\(([\s\S]*)\);\s*$/);
  if (!match) throw new Error("密文注册文件格式无效。");
  const payload = JSON.parse(match[1]);
  if (payload !== null) validatePayload(payload);
  return payload;
}

async function main(argv = process.argv.slice(2)) {
  if (argv.length === 1 && argv[0] === "--help") {
    console.log("用法：node scripts/relationship.cjs --input /项目外/private.json\n检查：node scripts/relationship.cjs --check\n输入JSON仅含英文title和body；交互输入并确认至少12字符的口令。公开仓库只保存密文。");
    return;
  }
  if (argv.length === 1 && argv[0] === "--check") {
    const payload = parseRegistration(await fs.readFile(OUTPUT, "utf8"));
    console.log(payload === null ? "Relationship尚未配置私密内容；空注册格式正确。" : "Relationship密文格式检查通过；未验证口令。" );
    return;
  }
  if (argv.length !== 2 || argv[0] !== "--input" || !argv[1]) throw new Error("请使用--input指定项目外或.private中的JSON；用--help查看说明。");
  const input = await validateInputPath(argv[1]);
  if ((await fs.stat(input)).size > MAX_BYTES) throw new Error("输入文件超过1MiB上限。");
  let item;
  try { item = JSON.parse(await fs.readFile(input, "utf8")); }
  catch { throw new Error("私密输入不是有效JSON或无法读取，未生成密文。"); }
  validatePlaintext(item);
  console.log("请使用至少12字符的独立长随机口令。输入隐藏；口令不会写入文件或命令历史。");
  let password = "";
  let confirmation = "";
  try {
    password = await hiddenPassword("口令：");
    if (Array.from(password).length < 12) throw new Error("口令至少需要12个字符，未写入密文。");
    confirmation = await hiddenPassword("再次输入口令：");
    const first = Buffer.from(password, "utf8");
    const second = Buffer.from(confirmation, "utf8");
    const same = first.length === second.length && crypto.timingSafeEqual(first, second);
    first.fill(0); second.fill(0);
    if (!same) throw new Error("两次口令不一致，未写入密文。");
    const payload = await encryptContent(item, password);
    await fs.writeFile(OUTPUT, registration(payload), "utf8");
    console.log("已更新Relationship密文。请装配、检查并测试后发布；不要上传明文输入文件。");
  } finally {
    password = "";
    confirmation = "";
    item = null;
  }
}

module.exports = { encryptContent, decryptContent, validatePayload, validatePlaintext, validateInputPath,
  registration, parseRegistration, main, ITERATIONS };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
