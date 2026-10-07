import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { compare } from "bcryptjs";
const alphabet =
  "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
function equal(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
function encode64(input: Buffer) {
  let output = "",
    i = 0;
  while (i < input.length) {
    let value = input[i++];
    output += alphabet[value & 63];
    if (i < input.length) value |= input[i] << 8;
    output += alphabet[(value >> 6) & 63];
    if (i++ >= input.length) break;
    if (i < input.length) value |= input[i] << 16;
    output += alphabet[(value >> 12) & 63];
    if (i++ >= input.length) break;
    output += alphabet[(value >> 18) & 63];
  }
  return output;
}
// Compatibility with WordPress phpass and WordPress 6.8's HMAC-prefixed bcrypt.
// Original identities/hashes remain private; no WordPress call or rehash is made.
export async function verifyLegacyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  if (Buffer.byteLength(password) > 4096) return false;
  try {
    if (hash.startsWith("$wp$2")) {
      const value = createHmac("sha384", "wp-sha384")
        .update(password)
        .digest("base64");
      return compare(value, hash.slice(3));
    }
    if (/^\$2[aby]\$/.test(hash)) return compare(password, hash);
    if (hash.startsWith("$P$") || hash.startsWith("$H$")) {
      const log = alphabet.indexOf(hash[3]);
      if (hash.length !== 34 || log < 7 || log > 20) return false;
      const input = Buffer.from(password);
      let result = createHash("md5")
        .update(hash.slice(4, 12))
        .update(input)
        .digest();
      for (let count = 1 << log; count > 0; count--)
        result = createHash("md5").update(result).update(input).digest();
      return equal(hash.slice(0, 12) + encode64(result), hash);
    }
    if (/^[a-f0-9]{32}$/i.test(hash))
      return equal(
        createHash("md5").update(password).digest("hex"),
        hash.toLowerCase(),
      );
  } catch {
    return false;
  }
  return false;
}
