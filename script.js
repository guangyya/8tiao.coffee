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
  "./assets/coffee-ginger-sparkling-americano.png",
  "./assets/coffee-iced-americano.png",
  "./assets/coffee-iced-latte.png",
  "./assets/coffee-elto-honey.png",
  "./assets/coffee-elto-washed.png",
  "./assets/coffee-elto-natural.png",
  "./assets/coffee-geisha-elto-blend.png",
];

const els = {
  todayStatus: document.querySelector("#todayStatus"),
  todaySpecial: document.querySelector("#todaySpecial"),
  coffeeGrid: document.querySelector("#coffeeGrid"),
  calendarGrid: document.querySelector("#calendarGrid"),
  noticeList: document.querySelector("#noticeList"),
};

async function loadSiteData() {
  try {
    const response = await fetch("./data/site.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    renderDataError(error);
    return null;
  }
}

function renderAll(state) {
  if (!state) return;
  renderStatus(state);
  renderSpecial(state);
  renderCoffeeGrid(state);
  renderCalendar(state);
  renderNotices(state);
  renderIcons();
}

function renderDataError(error) {
  const message = escapeHTML(error?.message || "unknown error");
  els.todayStatus.innerHTML = `
    <div>
      <span class="section-kicker">Data</span>
      <h2>菜单数据暂时无法读取</h2>
    </div>
    <p class="meta-line">请刷新页面或稍后再试。${message}</p>
  `;
}

function renderStatus(state) {
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

function renderSpecial(state) {
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

function renderCoffeeGrid(state) {
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

function renderCalendar(state) {
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

function renderNotices(state) {
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

loadSiteData().then(renderAll);
