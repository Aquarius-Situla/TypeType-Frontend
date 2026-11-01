const XOR_CODE = 23442827791579n;
const MAX_AID = 1n << 51n;
const BASE = 58n;
const TABLE = "FcwAPNKTMug3GV5Lj7EJnHpWsx4tb8haYeviqBz6rkCy12mUSDQX9RdoZf";
const AV_PARAM_PATTERN = /^av(\d{1,16})((?:\?p=\d+)?)$/i;

export function bilibiliBvidFromAvid(aid: string): string | null {
  if (!/^\d{1,16}$/.test(aid)) return null;
  const value = BigInt(aid);
  if (value <= 0n || value >= MAX_AID) return null;
  const chars = ["B", "V", "1", "0", "0", "0", "0", "0", "0", "0", "0", "0"];
  let index = chars.length - 1;
  let remaining = (MAX_AID | value) ^ XOR_CODE;
  while (remaining > 0n) {
    chars[index] = TABLE[Number(remaining % BASE)];
    remaining /= BASE;
    index -= 1;
  }
  [chars[3], chars[9]] = [chars[9], chars[3]];
  [chars[4], chars[7]] = [chars[7], chars[4]];
  return chars.join("");
}

export function withBilibiliBvid(value: string): string {
  const match = value.match(AV_PARAM_PATTERN);
  const bvid = match ? bilibiliBvidFromAvid(match[1]) : null;
  return bvid ? `${bvid}${match?.[2] ?? ""}` : value;
}
