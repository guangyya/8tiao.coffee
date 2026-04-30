import fs from "node:fs";

const DATA_FILE = "data/site.json";
const IMAGE_OPTIONS = new Set([
  "./assets/coffee-ethiopia.png",
  "./assets/coffee-guatemala.png",
  "./assets/coffee-ice.png",
  "./assets/coffee-citrus.png",
  "./assets/coffee-ginger-sparkling-americano.png",
  "./assets/coffee-iced-americano.png",
  "./assets/coffee-iced-latte.png",
  "./assets/coffee-elto-honey.png",
  "./assets/coffee-elto-washed.png",
  "./assets/coffee-elto-natural.png",
  "./assets/coffee-geisha-elto-blend.png",
]);

const event = readEvent();
const issue = event.issue || {};
const sections = parseSections(issue.body || "");
const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
const changes = [];

applyBusinessStatus(data, sections.get("营业状态"));
applySpecial(data, sections.get("今日特饮"));
applyMenuChanges(data, sections.get("菜单内容") || sections.get("菜单变更"));
applyCalendar(data, sections.get("上线日历"));
applyNotice(data, sections.get("公告内容"));

if (!changes.length) {
  fs.writeFileSync("issue-update-summary.md", [
    `Issue #${issue.number || ""} 没有产生可自动应用的数据变更。`,
    "",
    "请检查 Issue 内容是否使用了表单中的键值格式。",
  ].join("\n"));
  process.exit(0);
}

sortData(data);
fs.writeFileSync(DATA_FILE, `${JSON.stringify(data, null, 2)}\n`);
fs.writeFileSync("issue-update-summary.md", [
  `自动应用 Issue #${issue.number || ""} 的网站内容更新。`,
  "",
  ...changes.map((change) => `- ${change}`),
].join("\n"));

function readEvent() {
  if (process.env.GITHUB_EVENT_PATH && fs.existsSync(process.env.GITHUB_EVENT_PATH)) {
    return JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
  }

  return {
    issue: {
      number: process.env.ISSUE_NUMBER || "",
      title: process.env.ISSUE_TITLE || "",
      body: process.env.ISSUE_BODY || "",
    },
  };
}

function parseSections(body) {
  const result = new Map();
  let currentTitle = "";
  let currentLines = [];

  for (const line of String(body || "").split("\n")) {
    const heading = line.match(/^###\s+(.+?)\s*$/);
    if (heading) {
      if (currentTitle) {
        result.set(currentTitle, normalizeSection(currentLines.join("\n")));
      }
      currentTitle = heading[1].trim();
      currentLines = [];
      continue;
    }

    if (currentTitle) {
      currentLines.push(line);
    }
  }

  if (currentTitle) {
    result.set(currentTitle, normalizeSection(currentLines.join("\n")));
  }

  return result;
}

function normalizeSection(value) {
  const text = String(value || "").trim();
  return text === "_No response_" ? "" : text;
}

function applyBusinessStatus(site, text) {
  if (!text) return;
  const values = keyValues(text);
  const shop = site.shop;

  if (values.has("今天营业")) {
    shop.open = parseBoolean(values.get("今天营业"));
    changes.push(`营业状态更新为：${shop.open ? "营业" : "店休"}`);
  }

  if (values.has("营业时间")) {
    shop.hours = values.get("营业时间");
    changes.push(`营业时间更新为：${shop.hours}`);
  }

  if (values.has("主理人在店")) {
    shop.ownerPresent = parseBoolean(values.get("主理人在店"));
    changes.push(`主理人在店更新为：${shop.ownerPresent ? "是" : "否"}`);
  }

  const note = firstValue(values, ["备注", "主理人备注", "说明"]);
  if (note) {
    shop.ownerNote = note;
    changes.push("主理人备注已更新");
  }
}

function applySpecial(site, text) {
  if (!text) return;
  const values = keyValues(text);
  const special = site.shop.special;

  setString(values, special, "名称", "name", "今日特饮名称已更新");
  setNumber(values, special, "价格", "price", "今日特饮价格已更新");

  const description = firstValue(values, ["说明", "描述"]);
  if (description) {
    special.description = description;
    changes.push("今日特饮说明已更新");
  }

  const availability = firstValue(values, ["状态", "供应状态"]);
  if (availability) {
    special.availability = availability;
    changes.push("今日特饮供应状态已更新");
  }
}

function applyMenuChanges(site, text) {
  if (!text) return;
  const blocks = splitBlocks(text);

  for (const block of blocks) {
    const values = keyValues(block);
    const name = firstValue(values, ["名称", "品类", "菜单名称"]);
    if (!name) continue;

    const originalName = firstValue(values, ["原名称", "旧名称"]) || name;
    const action = firstValue(values, ["操作", "动作"]) || "";
    const existingIndex = site.coffees.findIndex((coffee) => coffee.name === originalName);

    if (containsAny(action, ["删除", "移除"])) {
      if (existingIndex >= 0) {
        site.coffees.splice(existingIndex, 1);
        changes.push(`菜单品类已删除：${originalName}`);
      }
      continue;
    }

    const coffee = existingIndex >= 0 ? site.coffees[existingIndex] : defaultCoffee();
    coffee.name = name;
    applyCoffeeFields(coffee, values);

    const status = firstValue(values, ["状态", "供应状态"]);
    if (status) {
      coffee.available = !containsAny(status, ["下架", "售罄", "暂停", "否", "不供应"]);
    }

    if (existingIndex < 0) {
      site.coffees.push(coffee);
      changes.push(`菜单品类已新增：${coffee.name}`);
    } else {
      changes.push(`菜单品类已更新：${coffee.name}`);
    }
  }
}

function applyCoffeeFields(coffee, values) {
  const category = firstValue(values, ["分类", "类别"]);
  if (category) coffee.category = normalizeCategory(category);

  setString(values, coffee, "英文名", "englishName");
  setString(values, coffee, "描述", "description");
  setString(values, coffee, "说明", "description");
  setString(values, coffee, "咖啡豆", "bean");
  setString(values, coffee, "产地", "origin");
  setString(values, coffee, "烘焙", "process");
  setString(values, coffee, "处理", "process");
  setString(values, coffee, "处理法", "process");
  setString(values, coffee, "风味", "notes");
  setNumber(values, coffee, "价格", "price");

  const image = firstValue(values, ["图片", "图片路径"]);
  if (image && IMAGE_OPTIONS.has(image)) {
    coffee.image = image;
  }
}

function applyCalendar(site, text) {
  if (!text) return;
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);

  for (const line of lines) {
    const match = line.match(/^(\d{4}-\d{2}-\d{2})\s*[:：]\s*(.+)$/);
    if (!match) continue;

    const [, date, detail] = match;
    const parts = detail.split(/[，,]/).map((part) => part.trim()).filter(Boolean);
    const open = !containsAny(detail, ["店休", "休息", "不营业"]);
    const owner = containsAny(detail, ["主理人在店", "主理人在", "主理人吧台"]);
    const hours = open ? parts.find((part) => /\d{1,2}:\d{2}/.test(part)) || "12:00 - 19:00" : "店休";
    const event = parts.filter((part) => part !== hours && !part.includes("主理人")).join("，") || (open ? "营业" : "店休");
    const existing = site.calendar.find((day) => day.date === date);
    const value = { date, open, owner, hours, event };

    if (existing) {
      Object.assign(existing, value);
      changes.push(`日历已更新：${date}`);
    } else {
      site.calendar.push(value);
      changes.push(`日历已新增：${date}`);
    }
  }
}

function applyNotice(site, text) {
  if (!text) return;
  const blocks = splitBlocks(text);

  for (const block of blocks) {
    const values = keyValues(block);
    const title = firstValue(values, ["标题"]);
    const body = firstValue(values, ["正文", "内容"]);
    if (!title || !body) continue;

    const date = firstValue(values, ["日期"]) || todayISO();
    const existing = site.notices.find((notice) => notice.title === title && notice.date === date);
    if (existing) {
      existing.body = body;
      changes.push(`公告已更新：${title}`);
    } else {
      site.notices.unshift({ title, date, body });
      changes.push(`公告已新增：${title}`);
    }
  }
}

function splitBlocks(text) {
  const blocks = text.split(/\n\s*---+\s*\n/).map((block) => block.trim()).filter(Boolean);
  return blocks.length ? blocks : [text.trim()];
}

function keyValues(text) {
  const map = new Map();

  for (const line of text.split(/\n+/)) {
    const match = line.trim().match(/^([^:：]+)\s*[:：]\s*(.*)$/);
    if (!match) continue;
    map.set(match[1].trim(), match[2].trim());
  }

  return map;
}

function firstValue(values, keys) {
  for (const key of keys) {
    if (values.has(key) && values.get(key)) return values.get(key);
  }
  return "";
}

function setString(values, target, key, field, label = "") {
  if (!values.has(key)) return;
  target[field] = values.get(key);
  if (label) changes.push(label);
}

function setNumber(values, target, key, field, label = "") {
  if (!values.has(key)) return;
  const value = Number(values.get(key).replace(/[^\d.]/g, ""));
  if (Number.isFinite(value)) {
    target[field] = value;
    if (label) changes.push(label);
  }
}

function parseBoolean(value) {
  return !containsAny(value, ["否", "不", "休", "false", "no", "0"]);
}

function containsAny(value, words) {
  const text = String(value || "").toLowerCase();
  return words.some((word) => text.includes(String(word).toLowerCase()));
}

function normalizeCategory(value) {
  if (containsAny(value, ["特饮", "special"])) return "specials";
  if (containsAny(value, ["咖啡", "coffee"])) return "coffee";
  return "handBrew";
}

function defaultCoffee() {
  return {
    category: "handBrew",
    name: "",
    englishName: "",
    description: "",
    bean: "",
    origin: "",
    process: "",
    notes: "",
    price: 0,
    available: true,
    image: "./assets/coffee-ethiopia.png",
  };
}

function sortData(site) {
  site.calendar.sort((a, b) => a.date.localeCompare(b.date));
  site.notices.sort((a, b) => b.date.localeCompare(a.date));
}

function todayISO() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
