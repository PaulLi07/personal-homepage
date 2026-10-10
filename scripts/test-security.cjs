/* 仅用内存中的随机测试内容验证加密；不设置真实口令、不改密文文件、不请求网络。 */
"use strict";
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const { encryptContent, decryptContent, validatePayload, validatePlaintext, registration, parseRegistration } = require("./relationship.cjs");

async function webDecrypt(payload, password) {
  // 独立使用WebCrypto，验证浏览器实现与Node加密格式互通，不调用生产解密函数。
  const passwordBytes = new TextEncoder().encode(password);
  let clear;
  try {
    const material = await crypto.webcrypto.subtle.importKey("raw", passwordBytes, "PBKDF2", false, ["deriveKey"]);
    const key = await crypto.webcrypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256",
      salt: Buffer.from(payload.salt, "base64"), iterations: payload.iterations }, material,
    { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    clear = new Uint8Array(await crypto.webcrypto.subtle.decrypt({ name: "AES-GCM",
      iv: Buffer.from(payload.iv, "base64"), additionalData: new TextEncoder().encode("personal-homepage:relationship:v1"),
      tagLength: 128 }, key, Buffer.from(payload.ciphertext, "base64")));
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(clear));
  } finally {
    passwordBytes.fill(0);
    if (clear) clear.fill(0);
  }
}

function changed(payload, field) {
  const value = Buffer.from(payload[field], "base64");
  value[0] ^= 1;
  return { ...payload, [field]: value.toString("base64") };
}

async function main() {
  const file = path.join(__dirname, "../modules/life/relationship/encrypted.js");
  const original = await fs.readFile(file);
  const fixture = { title: "Temporary encryption test", body: crypto.randomBytes(64).toString("hex") + "\nUnicode: café, λ." };
  let password = crypto.randomBytes(32).toString("base64");
  let checks = 0;
  async function test(label, callback) {
    await callback();
    checks += 1;
    console.log("通过：" + label);
  }
  try {
    const encrypted = await encryptContent(fixture, password);
    await test("真实加密与解密往返", async () => {
      assert.deepEqual(await decryptContent(encrypted, password), fixture);
      assert.equal(encrypted.version, 1);
      assert.equal(encrypted.iterations, 600000);
      assert.equal(Buffer.from(encrypted.salt, "base64").length, 16);
      assert.equal(Buffer.from(encrypted.iv, "base64").length, 12);
    });
    await test("独立WebCrypto互通", async () => {
      assert.deepEqual(await webDecrypt(encrypted, password), fixture);
    });
    await test("相同内容与口令使用独立随机盐和IV", async () => {
      const repeated = await encryptContent(fixture, password);
      for (const field of ["salt", "iv", "ciphertext"]) assert.notEqual(repeated[field], encrypted[field]);
      assert.deepEqual(await decryptContent(repeated, password), fixture);
    });
    await test("错误口令拒绝", async () => {
      const wrong = crypto.randomBytes(32).toString("base64");
      await assert.rejects(decryptContent(encrypted, wrong));
      await assert.rejects(webDecrypt(encrypted, wrong));
    });
    await test("密文、认证标签、盐、IV及派生参数篡改拒绝", async () => {
      for (const field of ["ciphertext", "salt", "iv"]) {
        await assert.rejects(decryptContent(changed(encrypted, field), password));
      }
      const tag = Buffer.from(encrypted.ciphertext, "base64");
      tag[tag.length - 1] ^= 1;
      await assert.rejects(decryptContent({ ...encrypted, ciphertext: tag.toString("base64") }, password));
      await assert.rejects(decryptContent({ ...encrypted, iterations: encrypted.iterations + 1 }, password));
    });
    await test("密文版本、字段、迭代上限与Base64边界验证", () => {
      const invalid = [null, [], { ...encrypted, version: 2 }, { ...encrypted, iterations: 1 },
        { ...encrypted, iterations: 2000001 }, { ...encrypted, iterations: 600000.5 },
        { ...encrypted, extra: "not allowed" }, { ...encrypted, salt: "AA==" },
        { ...encrypted, iv: "AA==" }, { ...encrypted, ciphertext: "AA==" },
        { ...encrypted, ciphertext: "not base64!" }];
      for (const value of invalid) assert.throws(() => validatePayload(value));
      const noncanonical = Buffer.alloc(16).toString("base64").slice(0, -3) + "B==";
      assert.throws(() => validatePayload({ ...encrypted, salt: noncanonical }));
      validatePayload(encrypted);
    });
    await test("明文schema、大小与短口令拒绝", async () => {
      for (const value of [null, { title: "", body: "" }, { title: "Valid", body: 1 },
        { ...fixture, extra: true }, { ...fixture, title: "x".repeat(301) },
        { ...fixture, body: "x".repeat(1024 * 1024) }]) assert.throws(() => validatePlaintext(value));
      await assert.rejects(encryptContent(fixture, "short"));
    });
    await test("纯JSON注册解析与注入拒绝", () => {
      assert.deepEqual(parseRegistration(registration(encrypted)), encrypted);
      assert.equal(parseRegistration(registration(null)), null);
      const marker = "__homepageSecurityFixture" + crypto.randomBytes(8).toString("hex");
      const attempts = [
        "window.Homepage.registerEncryptedRelationship((globalThis[" + JSON.stringify(marker) + "] = true, null));",
        "window.Homepage.registerEncryptedRelationship(null); globalThis[" + JSON.stringify(marker) + "] = true;",
        "window.Homepage.registerEncryptedRelationship({version: 1});",
        "window.Homepage.registerEncryptedRelationship(\"not an encrypted object\");"
      ];
      for (const source of attempts) assert.throws(() => parseRegistration(source));
      assert.equal(Object.hasOwn(globalThis, marker), false);
    });
    await test("正式密文文件保持不变", async () => {
      assert.deepEqual(await fs.readFile(file), original);
    });
    console.log("加密算法回归通过，共 " + checks + " 项；浏览器视图、生命周期及发布权限另行实测。");
  } finally {
    password = "";
    fixture.body = "";
  }
}

if (require.main === module) main().catch(error => {
  console.error("加密算法回归失败：" + error.message);
  process.exitCode = 1;
});
module.exports = { main };
