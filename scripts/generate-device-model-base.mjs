// 机型基础映射表生成脚本。
// 数据来源：device-detector-js 内置的移动设备规则库（Apache-2.0），
// 通过展开规则正则得到候选型号代码，再用解析器回验，输出「型号代码 → 营销名」静态映射。
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const detectorPackagePath = require.resolve("device-detector-js/package.json");
const detectorRoot = path.dirname(detectorPackagePath);
const mobilesFilePath = path.join(detectorRoot, "dist/fixtures/regexes/device/mobiles.json");
const outputFilePath = path.join(projectRoot, "src/constants/deviceModelBase.generated.ts");

/** 只保留国内小程序场景可能出现的品牌，控制产物体积。 */
const TARGET_BRANDS = new Set(
  [
    "Huawei",
    "Honor",
    "HONOR",
    "Xiaomi",
    "Redmi",
    "POCO",
    "Oppo",
    "OPPO",
    "Realme",
    "OnePlus",
    "Vivo",
    "iQOO",
    "Samsung",
    "Apple",
    "Meizu",
    "ZTE",
    "Nubia",
    "Lenovo",
    "Motorola",
    "Nokia",
    "Sony",
    "Google",
    "Asus",
    "Black Shark",
    "TCL",
    "Hisense",
    "Coolpad",
    "Gionee",
    "Smartisan",
    "Nothing",
    "Infinix",
    "Tecno",
    "Itel",
  ].map((brand) => brand.toLowerCase()),
);

/** 品牌别名，用于校验解析结果是否与规则所属品牌一致。 */
const BRAND_ALIASES = new Map([
  ["honor", ["huawei"]],
  ["huawei", ["honor"]],
  ["redmi", ["xiaomi"]],
  ["poco", ["xiaomi"]],
  ["xiaomi", ["redmi", "poco"]],
  ["iqoo", ["vivo"]],
  ["vivo", ["iqoo"]],
  ["realme", ["oppo"]],
  ["oneplus", ["oppo"]],
  ["oppo", ["realme", "oneplus"]],
]);

const MAX_VARIANTS_PER_RULE = 200;

const normalizeBrand = (brand) => String(brand ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const isBrandCompatible = (ruleBrand, parsedBrand) => {
  const left = normalizeBrand(ruleBrand);
  const right = normalizeBrand(parsedBrand);
  if (!left || !right) return true;
  if (left === right || left.includes(right) || right.includes(left)) return true;
  return (BRAND_ALIASES.get(left) ?? []).includes(right);
};

/** 展开字符类，负向字符类直接返回空串占位。 */
const expandCharacterClass = (classContent) => {
  if (classContent.startsWith("^")) return [""];
  const chars = [];
  for (let index = 0; index < classContent.length; index += 1) {
    const char = classContent[index];
    const nextChar = classContent[index + 1];
    const rangeEnd = classContent[index + 2];
    if (nextChar === "-" && rangeEnd) {
      const startCode = char.charCodeAt(0);
      const endCode = rangeEnd.charCodeAt(0);
      for (let code = startCode; code <= endCode && chars.length < 40; code += 1) {
        chars.push(String.fromCharCode(code));
      }
      index += 2;
      continue;
    }
    chars.push(char);
  }
  return chars.length > 0 ? chars : [""];
};

/** 合并两组片段，超过上限时截断，避免正则展开爆炸。 */
const combineVariants = (leftList, rightList) => {
  const result = [];
  for (const left of leftList) {
    for (const right of rightList) {
      result.push(left + right);
      if (result.length >= MAX_VARIANTS_PER_RULE) return result;
    }
  }
  return result;
};

/**
 * 将设备规则正则展开为字面量候选。
 * 仅支持本数据集实际出现的语法：字面量、字符类、分组、可选量词。
 */
const expandRuleRegex = (pattern) => {
  let cursor = 0;

  const applyQuantifier = (variants) => {
    const quantifier = pattern[cursor];
    if (quantifier === "?") {
      cursor += 1;
      return ["", ...variants];
    }
    if (quantifier === "*" || quantifier === "+") {
      // 无限重复无法穷举，按零次处理，仅保留其余片段。
      cursor += 1;
      return [""];
    }
    if (quantifier === "{") {
      const end = pattern.indexOf("}", cursor);
      if (end === -1) {
        cursor += 1;
        return [""];
      }
      const spec = pattern.slice(cursor + 1, end);
      cursor = end + 1;
      const minCount = Number.parseInt(spec.split(",")[0], 10);
      if (!Number.isFinite(minCount) || minCount <= 0 || minCount > 4) return [""];
      let repeated = [""];
      for (let count = 0; count < minCount; count += 1) repeated = combineVariants(repeated, variants);
      return repeated;
    }
    return variants;
  };

  const parseAtom = () => {
    const char = pattern[cursor];
    if (char === "(") {
      cursor += 1;
      // 环视分组不产生型号字符，直接整体跳过。
      const isLookaround = /^(\?[!=]|\?<[!=])/.test(pattern.slice(cursor));
      if (isLookaround) {
        let depth = 1;
        while (cursor < pattern.length && depth > 0) {
          if (pattern[cursor] === "(") depth += 1;
          if (pattern[cursor] === ")") depth -= 1;
          cursor += 1;
        }
        return [""];
      }
      if (pattern.startsWith("?:", cursor)) {
        cursor += 2;
      } else if (pattern.startsWith("?<", cursor)) {
        // 命名分组跳过组名。
        const nameEnd = pattern.indexOf(">", cursor);
        cursor = nameEnd === -1 ? cursor + 2 : nameEnd + 1;
      }
      const groupVariants = parseAlternatives(true);
      cursor += 1;
      return groupVariants;
    }
    if (char === "[") {
      const end = pattern.indexOf("]", cursor);
      if (end === -1) {
        cursor += 1;
        return [""];
      }
      const classContent = pattern.slice(cursor + 1, end);
      cursor = end + 1;
      return expandCharacterClass(classContent);
    }
    if (char === "\\") {
      const escaped = pattern[cursor + 1] ?? "";
      cursor += 2;
      return [escaped];
    }
    if (char === "^" || char === "$") {
      cursor += 1;
      return [""];
    }
    cursor += 1;
    return [char];
  };

  const parseAlternatives = (insideGroup) => {
    const branches = [];
    let sequence = [""];
    while (cursor < pattern.length) {
      const char = pattern[cursor];
      if (char === ")" && insideGroup) break;
      if (char === "|" && insideGroup) {
        branches.push(sequence);
        sequence = [""];
        cursor += 1;
        continue;
      }
      const atomVariants = applyQuantifier(parseAtom());
      sequence = combineVariants(sequence, atomVariants);
    }
    branches.push(sequence);
    return branches.flat();
  };

  return parseAlternatives(false).filter((variant) => /^[A-Za-z0-9][A-Za-z0-9._-]{2,23}$/.test(variant));
};

/** 汇总规则库中的候选型号代码。 */
const collectCandidates = (mobiles) => {
  const candidates = new Map();
  for (const [brand, config] of Object.entries(mobiles)) {
    if (!TARGET_BRANDS.has(brand.toLowerCase())) continue;
    for (const rule of config.models ?? []) {
      if (!rule.model) continue;
      for (const code of expandRuleRegex(String(rule.regex ?? ""))) {
        if (!/\d/.test(code)) continue;
        const key = code.toUpperCase();
        if (!candidates.has(key)) candidates.set(key, brand);
      }
    }
  }
  return candidates;
};

const main = () => {
  const detectorPackage = require(detectorPackagePath);
  const mobiles = JSON.parse(fs.readFileSync(mobilesFilePath, "utf8"));
  const DeviceDetector = require("device-detector-js").default ?? require("device-detector-js");
  const detector = new DeviceDetector();

  const candidates = collectCandidates(mobiles);
  const entries = new Map();

  for (const [code, ruleBrand] of candidates) {
    // 构造仅含型号代码的 UA，让解析器按真实规则库回验映射关系。
    const userAgent = `Mozilla/5.0 (Linux; Android 12; ${code} Build/SP1A.210812.003; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/99.0 Mobile Safari/537.36`;
    const device = detector.parse(userAgent).device;
    // 规则变量替换的值可能带首尾空白，统一压缩空白后再落表。
    const modelName = String(device?.model ?? "")
      .replace(/\s+/g, " ")
      .trim();
    if (!modelName || modelName.toUpperCase() === code) continue;
    if (!/[A-Za-z]/.test(modelName)) continue;
    if (!isBrandCompatible(ruleBrand, device?.brand)) continue;
    entries.set(code, modelName);
  }

  const sortedEntries = [...entries.entries()].sort(([left], [right]) => left.localeCompare(right));
  const lines = sortedEntries.map(([code, modelName]) => `  ${JSON.stringify(code)}: ${JSON.stringify(modelName)},`);

  const fileContent = `// 机型基础映射表（自动生成，请勿手动修改）。
// 生成命令：pnpm gen:device-model
// 数据来源：device-detector-js@${detectorPackage.version} 设备规则库（Apache-2.0）。
// 说明：键为归一化后的型号代码（大写），值为营销名；未收录的新机型请在 deviceModelNames.ts 中补充。
export const DEVICE_MODEL_BASE_MAP: Record<string, string> = {
${lines.join("\n")}
};
`;

  fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
  fs.writeFileSync(outputFilePath, fileContent, "utf8");
  console.log(`已生成 ${path.relative(projectRoot, outputFilePath)}：${sortedEntries.length} 条型号映射`);
};

main();
