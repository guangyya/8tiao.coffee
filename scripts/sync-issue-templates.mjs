import fs from "node:fs";

const data = JSON.parse(fs.readFileSync("data/site.json", "utf8"));
const dir = ".github/ISSUE_TEMPLATE";

fs.mkdirSync(dir, { recursive: true });
write("config.yml", "blank_issues_enabled: false\n");
write("menu-update.yml", menuTemplate(data));
write("business-status-update.yml", businessStatusTemplate(data));
write("special-update.yml", specialTemplate(data));
write("notice-update.yml", noticeTemplate(data));
write("calendar-update.yml", calendarTemplate(data));

function menuTemplate(site) {
  return issueForm({
    name: "更新菜单",
    description: "只提交菜单品类变更",
    title: "[菜单] ",
    intro: "编辑下面的当前菜单数据。每个品类用 `---` 分隔；只改菜单，不需要填写公告、日历或营业状态。",
    fields: [
      textarea({
        id: "menu_changes",
        label: "菜单内容",
        description: "保留要继续供应的品类；修改字段即可。要下架时把状态改成“下架”；要删除可把操作改成“删除”。",
        value: site.coffees.map(formatCoffee).join("\n\n---\n\n"),
        required: true,
      }),
      textarea({
        id: "notes",
        label: "备注",
        description: "图片、排序或无法按格式表达的内容写这里。",
      }),
    ],
  });
}

function businessStatusTemplate(site) {
  return issueForm({
    name: "更新营业状态",
    description: "只提交今天是否营业、营业时间和主理人状态",
    title: "[营业] ",
    intro: "只更新营业状态，不需要关心菜单、公告或日历。",
    fields: [
      textarea({
        id: "business_status",
        label: "营业状态",
        value: [
          `今天营业：${site.shop.open ? "是" : "否"}`,
          `营业时间：${site.shop.hours}`,
          `主理人在店：${site.shop.ownerPresent ? "是" : "否"}`,
          `备注：${site.shop.ownerNote || ""}`,
        ].join("\n"),
        required: true,
      }),
    ],
  });
}

function specialTemplate(site) {
  const special = site.shop.special || {};
  return issueForm({
    name: "更新今日特饮",
    description: "只提交今日特饮展示内容",
    title: "[特饮] ",
    intro: "只更新首页的今日特饮卡片，不影响完整菜单列表。",
    fields: [
      textarea({
        id: "special",
        label: "今日特饮",
        value: [
          `名称：${special.name || ""}`,
          `价格：${special.price ?? ""}`,
          `说明：${special.description || ""}`,
          `状态：${special.availability || ""}`,
        ].join("\n"),
        required: true,
      }),
    ],
  });
}

function noticeTemplate(site) {
  const current = site.notices
    .map((notice) => [
      `标题：${notice.title}`,
      `日期：${notice.date}`,
      `正文：${notice.body}`,
    ].join("\n"))
    .join("\n\n---\n\n");

  return issueForm({
    name: "发布或修改公告",
    description: "只提交主理人公告",
    title: "[公告] ",
    intro: "只更新公告。修改已有公告时保持标题和日期一致；新增公告时填写新的标题、日期和正文。",
    fields: [
      textarea({
        id: "notice",
        label: "公告内容",
        description: "下面是当前公告，可直接修改其中一条，也可以替换为新公告。",
        value: current,
        required: true,
      }),
    ],
  });
}

function calendarTemplate(site) {
  return issueForm({
    name: "更新上线日历",
    description: "只提交营业日历变更",
    title: "[日历] ",
    intro: "只更新上线日历。每行一个日期，格式保持为 `YYYY-MM-DD：时间，主理人在店，安排`；店休可以写 `YYYY-MM-DD：店休，设备维护`。",
    fields: [
      textarea({
        id: "calendar",
        label: "上线日历",
        value: site.calendar.map(formatCalendarDay).join("\n"),
        required: true,
      }),
    ],
  });
}

function issueForm({ name, description, title, intro, fields }) {
  return [
    `name: ${name}`,
    `description: ${description}`,
    `title: "${title}"`,
    "body:",
    "  - type: markdown",
    "    attributes:",
    block("      value", intro),
    ...fields.flatMap((field) => field),
    "",
  ].join("\n");
}

function textarea({ id, label, description = "", value = "", required = false }) {
  const lines = [
    "  - type: textarea",
    `    id: ${id}`,
    "    attributes:",
    `      label: ${label}`,
  ];

  if (description) lines.push(block("      description", description));
  if (value) lines.push(block("      value", value));
  lines.push("    validations:");
  lines.push(`      required: ${required ? "true" : "false"}`);
  return lines;
}

function block(key, value) {
  return [`${key}: |`, ...String(value).split("\n").map((line) => `        ${line}`)].join("\n");
}

function formatCoffee(coffee) {
  return [
    "操作：修改",
    `原名称：${coffee.name}`,
    `分类：${categoryLabel(coffee.category)}`,
    `名称：${coffee.name}`,
    `英文名：${coffee.englishName || ""}`,
    `价格：${coffee.price ?? ""}`,
    `描述：${coffee.description || ""}`,
    `咖啡豆：${coffee.bean || ""}`,
    `产地：${coffee.origin || ""}`,
    `烘焙：${coffee.process || ""}`,
    `风味：${coffee.notes || ""}`,
    `状态：${coffee.available ? "正在供应" : "下架"}`,
    `图片：${coffee.image || ""}`,
  ].join("\n");
}

function formatCalendarDay(day) {
  if (!day.open) return `${day.date}：店休，${day.event || "休整"}`;
  return `${day.date}：${day.hours || "12:00 - 19:00"}，${day.owner ? "主理人在店" : "主理人不在店"}，${day.event || "营业"}`;
}

function categoryLabel(category) {
  if (category === "specials") return "特饮";
  if (category === "coffee") return "咖啡";
  return "手冲";
}

function write(name, content) {
  fs.writeFileSync(`${dir}/${name}`, content);
}
