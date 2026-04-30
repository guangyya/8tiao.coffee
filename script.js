const menuGroups = [
  { id: "specials", title: "特饮", label: "SPECIALS" },
  { id: "coffee", title: "咖啡", label: "COFFEE" },
  { id: "handBrew", title: "手冲", label: "HAND BREW" },
];

const imageOptions = [
  "./assets/coffee-ethiopia.png",
  "./assets/coffee-guatemala.png",
  "./assets/coffee-ice.png",
  "./assets/coffee-citrus.png",
];

const state = {
  shop: {
    open: true,
    hours: "12:00 - 19:00",
    ownerPresent: true,
    ownerNote: "可以等一下，新鲜烘焙会认真对待每一杯。",
    special: {
      name: "干姜气泡美式",
      description: "干姜的温暖辛香，搭配气泡的清爽活力，夏天醒脑的一杯。",
      price: 26,
      availability: "今日供应",
    },
  },
  coffees: [
    {
      category: "specials",
      name: "干姜气泡美式",
      englishName: "GINGER SPARKLING AMERICANO",
      description: "干姜的温暖辛香，搭配气泡的清爽活力，夏天醒脑的一杯。",
      bean: "肯尼亚 中深烘 SOE",
      origin: "Kenya",
      process: "特饮",
      notes: "干姜 / 气泡 / 清爽",
      price: 26,
      available: true,
      image: "./assets/coffee-citrus.png",
    },
    {
      category: "coffee",
      name: "冰美式",
      englishName: "ICED AMERICANO",
      description: "简单一点，也挺好。",
      bean: "肯尼亚 中深烘 SOE",
      origin: "Kenya",
      process: "中深烘",
      notes: "黑醋栗 / 黑糖 / 蓝莓 / 巧克力",
      price: 22,
      available: true,
      image: "./assets/coffee-ice.png",
    },
    {
      category: "coffee",
      name: "冰拿铁",
      englishName: "ICED LATTE",
      description: "有点甜，也有点放松。",
      bean: "肯尼亚 中深烘 SOE",
      origin: "Kenya",
      process: "中深烘",
      notes: "奶糖 / 黑糖 / 巧克力",
      price: 26,
      available: true,
      image: "./assets/coffee-guatemala.png",
    },
    {
      category: "handBrew",
      name: "elto 混合蜜处理",
      englishName: "",
      description: "浅烘焙",
      bean: "",
      origin: "埃塞俄比亚 elto",
      process: "浅烘焙",
      notes: "金银花 / 红毛丹 / 蜂蜜 / 草莓",
      price: 38,
      available: true,
      image: "./assets/coffee-ethiopia.png",
    },
    {
      category: "handBrew",
      name: "elto 水洗",
      englishName: "",
      description: "浅烘焙",
      bean: "",
      origin: "埃塞俄比亚 elto",
      process: "浅烘焙",
      notes: "甜橙 / 柠檬 / 血橙",
      price: 38,
      available: true,
      image: "./assets/coffee-ethiopia.png",
    },
    {
      category: "handBrew",
      name: "elto 日晒",
      englishName: "",
      description: "浅烘焙",
      bean: "",
      origin: "埃塞俄比亚 elto",
      process: "浅烘焙",
      notes: "紫罗兰 / 树莓 / 草莓 / 红提",
      price: 40,
      available: true,
      image: "./assets/coffee-citrus.png",
    },
    {
      category: "handBrew",
      name: "列级瑰夏 elto 拼配",
      englishName: "",
      description: "浅烘焙",
      bean: "",
      origin: "埃塞俄比亚 elto",
      process: "浅烘焙",
      notes: "金银花 / 蜜柚 / 水果糖",
      price: 38,
      available: true,
      image: "./assets/coffee-guatemala.png",
    },
  ],
  notices: [
    {
      title: "今天也不用太用力",
      date: todayISO(),
      body: "夏季八调菜单已更新：特饮、冰咖啡和 elto 手冲都在供应。",
    },
    {
      title: "更新方式调整",
      date: addDaysISO(new Date(), -1),
      body: "网站不再接受预约，也不设站内后台。营业状态、菜单和日历更新请通过 GitHub Issue 提交。",
    },
  ],
  calendar: buildDefaultCalendar(),
};

const els = {
  todayStatus: document.querySelector("#todayStatus"),
  todaySpecial: document.querySelector("#todaySpecial"),
  coffeeGrid: document.querySelector("#coffeeGrid"),
  calendarGrid: document.querySelector("#calendarGrid"),
  noticeList: document.querySelector("#noticeList"),
};

function buildDefaultCalendar() {
  const events = [
    "埃塞水洗杯测",
    "只做手冲",
    "冰冲日",
    "主理人吧台",
    "新豆上架",
    "黄昏特饮",
    "休整和烘豆",
  ];

  return Array.from({ length: 14 }, (_, index) => {
    const date = addDays(new Date(), index);
    const weekday = date.getDay();
    return {
      date: toISODate(date),
      open: weekday !== 2,
      owner: [0, 3, 5, 6].includes(weekday) || index === 0,
      hours: weekday === 2 ? "店休" : "12:00 - 19:00",
      event: weekday === 2 ? "设备维护" : events[index % events.length],
    };
  });
}

function renderAll() {
  renderStatus();
  renderSpecial();
  renderCoffeeGrid();
  renderCalendar();
  renderNotices();
  renderIcons();
}

function renderStatus() {
  const openText = state.shop.open ? "今天营业" : "今天店休";
  const ownerText = state.shop.ownerPresent ? "主理人在店" : "主理人今天不在店";
  const dotClass = state.shop.open ? "status-dot is-open" : "status-dot";

  els.todayStatus.innerHTML = `
    <div class="status-main">
      <span class="${dotClass}" aria-hidden="true"></span>
      <div>
        <span class="section-kicker">Today</span>
        <h2>${openText}</h2>
      </div>
    </div>
    <div>
      <p class="meta-line">${escapeHTML(state.shop.hours)}</p>
      <p class="meta-line">${ownerText}。${escapeHTML(state.shop.ownerNote)}</p>
    </div>
  `;
}

function renderSpecial() {
  const special = state.shop.special;

  els.todaySpecial.innerHTML = `
    <div>
      <span class="section-kicker">Special</span>
      <h2>${escapeHTML(special.name || "今日暂无特饮")}</h2>
    </div>
    <p class="meta-line">${escapeHTML(special.description || "主理人还没有发布今日特饮。")}</p>
    <div class="special-count">
      <strong>¥${Number(special.price) || 0}</strong>
      <span>${escapeHTML(special.availability || "按现场为准")}</span>
    </div>
  `;
}

function renderCoffeeGrid() {
  const coffees = state.coffees.filter((coffee) => coffee.available);
  if (!coffees.length) {
    els.coffeeGrid.innerHTML = `<p class="empty-state">今天还没有发布菜单品类。</p>`;
    return;
  }

  els.coffeeGrid.innerHTML = menuGroups
    .map((group) => {
      const groupItems = coffees.filter((coffee) => (coffee.category || "handBrew") === group.id);
      if (!groupItems.length) return "";

      return `
        <section class="menu-category menu-category-${group.id}">
          <div class="menu-category-heading">
            <h3>${group.title}</h3>
            <span>${group.label}</span>
          </div>
          <div class="menu-items">
            ${groupItems.map(renderMenuItem).join("")}
          </div>
        </section>
      `;
    })
    .join("");
}

function renderMenuItem(coffee) {
  const notes = splitTags(coffee.notes);
  return `
    <article class="coffee-card">
      <div class="coffee-image">
        <img src="${safeImage(coffee.image)}" alt="${escapeHTML(coffee.name)}" loading="lazy" />
        <span class="availability-badge">正在供应</span>
      </div>
      <div class="coffee-body">
        <div class="coffee-title-row">
          <div>
            <h3>${escapeHTML(coffee.name)}</h3>
            ${coffee.englishName ? `<small>${escapeHTML(coffee.englishName)}</small>` : ""}
          </div>
          <span class="price">¥${Number(coffee.price) || 0}</span>
        </div>
        ${coffee.description ? `<p>${escapeHTML(coffee.description)}</p>` : ""}
        ${
          notes.length
            ? `<p class="flavor-line"><strong>风味：</strong>${notes.map(escapeHTML).join(" | ")}</p>`
            : ""
        }
        <div class="tag-row">
          ${coffee.bean ? `<span class="tag"><i data-lucide="bean"></i>${escapeHTML(coffee.bean)}</span>` : ""}
          ${coffee.origin ? `<span class="tag"><i data-lucide="map-pin"></i>${escapeHTML(coffee.origin)}</span>` : ""}
          ${coffee.process ? `<span class="tag">${escapeHTML(coffee.process)}</span>` : ""}
        </div>
      </div>
    </article>
  `;
}

function renderCalendar() {
  const today = todayISO();
  els.calendarGrid.innerHTML = state.calendar
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((day) => {
      const date = parseISODate(day.date);
      const classes = ["day-card"];
      if (day.date === today) classes.push("is-today");
      if (!day.open) classes.push("is-closed");

      return `
        <article class="${classes.join(" ")}">
          <div class="day-number">
            <strong>${date.getMonth() + 1}.${date.getDate()}</strong>
            <span>${weekdayName(date)}</span>
          </div>
          <p>${day.open ? escapeHTML(day.hours) : "店休"}</p>
          <p>${escapeHTML(day.event || "暂无安排")}</p>
          ${
            day.owner
              ? `<span class="owner-chip"><i data-lucide="badge-check"></i> 主理人在</span>`
              : `<p>主理人不在店</p>`
          }
        </article>
      `;
    })
    .join("");
}

function renderNotices() {
  if (!state.notices.length) {
    els.noticeList.innerHTML = `<p class="empty-state">暂无公告。</p>`;
    return;
  }

  els.noticeList.innerHTML = state.notices
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(
      (notice) => `
        <article class="notice-item">
          <time datetime="${escapeHTML(notice.date)}">${formatNoticeDate(notice.date)}</time>
          <h3>${escapeHTML(notice.title)}</h3>
          <p>${escapeHTML(notice.body)}</p>
        </article>
      `,
    )
    .join("");
}

function renderIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function safeImage(src) {
  return imageOptions.includes(src) ? src : imageOptions[0];
}

function splitTags(value) {
  return String(value || "")
    .split(/[|/／、，,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function todayISO() {
  return toISODate(new Date());
}

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setHours(12, 0, 0, 0);
  next.setDate(next.getDate() + days);
  return next;
}

function addDaysISO(date, days) {
  return toISODate(addDays(date, days));
}

function parseISODate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function weekdayName(date) {
  return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()];
}

function formatNoticeDate(value) {
  const date = parseISODate(value || todayISO());
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

renderAll();
