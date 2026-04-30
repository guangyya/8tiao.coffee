const STORAGE_KEY = "eight-tiao-coffee-state";
const SESSION_KEY = "eight-tiao-owner-session";
const ADMIN_USER = "owner";
const ADMIN_PASS = "8tiao2026";

const imageOptions = [
  "./assets/coffee-ethiopia.png",
  "./assets/coffee-guatemala.png",
  "./assets/coffee-ice.png",
  "./assets/coffee-citrus.png",
];

const els = {
  todayStatus: document.querySelector("#todayStatus"),
  todaySpecial: document.querySelector("#todaySpecial"),
  coffeeGrid: document.querySelector("#coffeeGrid"),
  calendarGrid: document.querySelector("#calendarGrid"),
  noticeList: document.querySelector("#noticeList"),
  reserveForm: document.querySelector("#reserveForm"),
  guestId: document.querySelector("#guestId"),
  reserveCups: document.querySelector("#reserveCups"),
  reserveFeedback: document.querySelector("#reserveFeedback"),
  adminEntry: document.querySelector("#adminEntry"),
  adminDialog: document.querySelector("#adminDialog"),
  loginPane: document.querySelector("#loginPane"),
  adminPane: document.querySelector("#adminPane"),
  adminUser: document.querySelector("#adminUser"),
  adminPass: document.querySelector("#adminPass"),
  loginButton: document.querySelector("#loginButton"),
  loginFeedback: document.querySelector("#loginFeedback"),
  logoutButton: document.querySelector("#logoutButton"),
  exportData: document.querySelector("#exportData"),
  resetData: document.querySelector("#resetData"),
  clearReservations: document.querySelector("#clearReservations"),
  reservationList: document.querySelector("#reservationList"),
  saveStatus: document.querySelector("#saveStatus"),
  addCoffee: document.querySelector("#addCoffee"),
  addNotice: document.querySelector("#addNotice"),
  addCalendarDay: document.querySelector("#addCalendarDay"),
  coffeeEditor: document.querySelector("#coffeeEditor"),
  noticeEditor: document.querySelector("#noticeEditor"),
  calendarEditor: document.querySelector("#calendarEditor"),
  coffeeEditorTemplate: document.querySelector("#coffeeEditorTemplate"),
  noticeEditorTemplate: document.querySelector("#noticeEditorTemplate"),
  calendarEditorTemplate: document.querySelector("#calendarEditorTemplate"),
};

const statusInputs = {
  open: document.querySelector("#editOpen"),
  ownerPresent: document.querySelector("#editOwnerPresent"),
  hours: document.querySelector("#editHours"),
  ownerNote: document.querySelector("#editOwnerNote"),
  specialName: document.querySelector("#editSpecialName"),
  specialPrice: document.querySelector("#editSpecialPrice"),
  specialRemaining: document.querySelector("#editSpecialRemaining"),
  specialTotal: document.querySelector("#editSpecialTotal"),
  specialDesc: document.querySelector("#editSpecialDesc"),
};

let state = loadState();

function defaultState() {
  return {
    shop: {
      open: true,
      hours: "12:00 - 19:00",
      ownerPresent: true,
      ownerNote: "今天主理人在吧台，适合聊豆子和冲煮参数。",
      special: {
        name: "青柠盐气泡冷萃",
        description: "冷萃、青柠皮、海盐气泡水，杯感清亮，做完即止。",
        price: 36,
        remaining: 8,
        total: 16,
      },
    },
    coffees: [
      {
        id: createId(),
        name: "埃塞俄比亚 西达摩 夏花",
        origin: "Ethiopia Sidama",
        process: "水洗",
        notes: "白桃 / 茉莉 / 柠檬糖",
        price: 42,
        available: true,
        image: "./assets/coffee-ethiopia.png",
      },
      {
        id: createId(),
        name: "危地马拉 阿卡特南果",
        origin: "Guatemala Acatenango",
        process: "蜜处理",
        notes: "可可 / 红苹果 / 榛果",
        price: 40,
        available: true,
        image: "./assets/coffee-guatemala.png",
      },
      {
        id: createId(),
        name: "冰手冲 季风拼配",
        origin: "Yunnan + Kenya",
        process: "拼配",
        notes: "乌梅 / 冰茶 / 黑加仑",
        price: 38,
        available: true,
        image: "./assets/coffee-ice.png",
      },
      {
        id: createId(),
        name: "夏季八调 特调杯",
        origin: "Limited",
        process: "冷萃特调",
        notes: "柑橘 / 气泡 / 微咸",
        price: 36,
        available: true,
        image: "./assets/coffee-citrus.png",
      },
    ],
    notices: [
      {
        id: createId(),
        title: "本周只开四天",
        date: todayISO(),
        body: "豆单会在每天开门前更新。天气太热时，冰手冲优先出杯。",
      },
      {
        id: createId(),
        title: "试营业预约规则",
        date: addDaysISO(new Date(), -1),
        body: "特调不需要登录，留下 ID 和杯数即可。到店报 ID 取杯。",
      },
    ],
    calendar: buildDefaultCalendar(),
    reservations: [],
  };
}

function buildDefaultCalendar() {
  const events = [
    "埃塞水洗杯测",
    "只做手冲",
    "冰冲日",
    "主理人吧台",
    "新豆上架",
    "黄昏特调",
    "休整和烘豆",
  ];
  return Array.from({ length: 14 }, (_, index) => {
    const date = addDays(new Date(), index);
    const weekday = date.getDay();
    return {
      id: createId(),
      date: toISODate(date),
      open: weekday !== 2,
      owner: [0, 3, 5, 6].includes(weekday) || index === 0,
      hours: weekday === 2 ? "店休" : "12:00 - 19:00",
      event: weekday === 2 ? "设备维护" : events[index % events.length],
    };
  });
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return defaultState();
  }

  try {
    return normalizeState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

function normalizeState(saved) {
  const fresh = defaultState();
  return {
    ...fresh,
    ...saved,
    shop: {
      ...fresh.shop,
      ...saved.shop,
      special: {
        ...fresh.shop.special,
        ...(saved.shop?.special || {}),
      },
    },
    coffees: Array.isArray(saved.coffees) ? saved.coffees : fresh.coffees,
    notices: Array.isArray(saved.notices) ? saved.notices : fresh.notices,
    calendar: Array.isArray(saved.calendar) ? saved.calendar : fresh.calendar,
    reservations: Array.isArray(saved.reservations) ? saved.reservations : [],
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
  const total = Math.max(Number(special.total) || 0, Number(special.remaining) || 0);
  const percentage = total ? Math.round((Number(special.remaining) / total) * 100) : 0;

  els.todaySpecial.innerHTML = `
    <div>
      <span class="section-kicker">Special</span>
      <h2>${escapeHTML(special.name || "今日暂无特调")}</h2>
    </div>
    <p class="meta-line">${escapeHTML(special.description || "主理人还没有发布今日特调。")}</p>
    <div class="special-count">
      <strong>${Number(special.remaining) || 0}</strong>
      <span>杯可预约 / ¥${Number(special.price) || 0} / ${percentage}% left</span>
    </div>
  `;
}

function renderCoffeeGrid() {
  const coffees = state.coffees.filter((coffee) => coffee.available);
  if (!coffees.length) {
    els.coffeeGrid.innerHTML = `<p class="empty-state">今天还没有发布咖啡品类。</p>`;
    return;
  }

  els.coffeeGrid.innerHTML = coffees
    .map(
      (coffee) => `
        <article class="coffee-card">
          <div class="coffee-image">
            <img src="${safeImage(coffee.image)}" alt="${escapeHTML(coffee.name)}" loading="lazy" />
            <span class="availability-badge">正在供应</span>
          </div>
          <div class="coffee-body">
            <div class="coffee-title-row">
              <h3>${escapeHTML(coffee.name)}</h3>
              <span class="price">¥${Number(coffee.price) || 0}</span>
            </div>
            <p>${escapeHTML(coffee.notes)}</p>
            <div class="tag-row">
              <span class="tag">${escapeHTML(coffee.origin)}</span>
              <span class="tag">${escapeHTML(coffee.process)}</span>
            </div>
          </div>
        </article>
      `,
    )
    .join("");
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

function renderAdmin() {
  renderStatusEditor();
  renderCoffeeEditor();
  renderReservationList();
  renderNoticeEditor();
  renderCalendarEditor();
  renderIcons();
}

function renderStatusEditor() {
  statusInputs.open.checked = Boolean(state.shop.open);
  statusInputs.ownerPresent.checked = Boolean(state.shop.ownerPresent);
  statusInputs.hours.value = state.shop.hours || "";
  statusInputs.ownerNote.value = state.shop.ownerNote || "";
  statusInputs.specialName.value = state.shop.special.name || "";
  statusInputs.specialPrice.value = state.shop.special.price || 0;
  statusInputs.specialRemaining.value = state.shop.special.remaining || 0;
  statusInputs.specialTotal.value = state.shop.special.total || 0;
  statusInputs.specialDesc.value = state.shop.special.description || "";
}

function renderCoffeeEditor() {
  els.coffeeEditor.innerHTML = "";
  state.coffees.forEach((coffee) => {
    const node = els.coffeeEditorTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".editor-card-title strong").textContent = coffee.name || "未命名咖啡";
    setEditorValue(node, "name", coffee.name);
    setEditorValue(node, "price", coffee.price);
    setEditorValue(node, "origin", coffee.origin);
    setEditorValue(node, "process", coffee.process);
    setEditorValue(node, "notes", coffee.notes);
    setEditorValue(node, "image", safeImage(coffee.image));
    setEditorValue(node, "available", coffee.available);

    node.querySelector(".save-row").addEventListener("click", () => {
      Object.assign(coffee, {
        name: getEditorValue(node, "name"),
        price: Number(getEditorValue(node, "price")) || 0,
        origin: getEditorValue(node, "origin"),
        process: getEditorValue(node, "process"),
        notes: getEditorValue(node, "notes"),
        image: safeImage(getEditorValue(node, "image")),
        available: Boolean(getEditorValue(node, "available")),
      });
      persistAndRefresh("咖啡品类已保存");
    });

    node.querySelector(".delete-row").addEventListener("click", () => {
      state.coffees = state.coffees.filter((item) => item.id !== coffee.id);
      persistAndRefresh("咖啡品类已删除");
    });

    els.coffeeEditor.append(node);
  });
}

function renderReservationList() {
  if (!state.reservations.length) {
    els.reservationList.innerHTML = `<p class="empty-state">还没有预约记录。</p>`;
    return;
  }

  els.reservationList.innerHTML = state.reservations
    .slice()
    .reverse()
    .map(
      (item) => `
        <article class="editor-card">
          <div class="editor-card-title">
            <strong>${escapeHTML(item.guestId)}</strong>
            <span class="tag">${Number(item.cups) || 1} 杯</span>
          </div>
          <p class="meta-line">${escapeHTML(item.specialName)} · ${formatNoticeDate(item.date)} ${escapeHTML(item.time)}</p>
        </article>
      `,
    )
    .join("");
}

function renderNoticeEditor() {
  els.noticeEditor.innerHTML = "";
  state.notices.forEach((notice) => {
    const node = els.noticeEditorTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".editor-card-title strong").textContent = notice.title || "未命名公告";
    setEditorValue(node, "title", notice.title);
    setEditorValue(node, "date", notice.date);
    setEditorValue(node, "body", notice.body);

    node.querySelector(".save-row").addEventListener("click", () => {
      Object.assign(notice, {
        title: getEditorValue(node, "title"),
        date: getEditorValue(node, "date") || todayISO(),
        body: getEditorValue(node, "body"),
      });
      persistAndRefresh("公告已保存");
    });

    node.querySelector(".delete-row").addEventListener("click", () => {
      state.notices = state.notices.filter((item) => item.id !== notice.id);
      persistAndRefresh("公告已删除");
    });

    els.noticeEditor.append(node);
  });
}

function renderCalendarEditor() {
  els.calendarEditor.innerHTML = "";
  state.calendar
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((day) => {
      const node = els.calendarEditorTemplate.content.firstElementChild.cloneNode(true);
      node.querySelector(".editor-card-title strong").textContent = `${formatNoticeDate(day.date)} ${day.open ? "营业" : "店休"}`;
      setEditorValue(node, "date", day.date);
      setEditorValue(node, "hours", day.hours);
      setEditorValue(node, "event", day.event);
      setEditorValue(node, "open", day.open);
      setEditorValue(node, "owner", day.owner);

      node.querySelector(".save-row").addEventListener("click", () => {
        Object.assign(day, {
          date: getEditorValue(node, "date") || todayISO(),
          hours: getEditorValue(node, "hours"),
          event: getEditorValue(node, "event"),
          open: Boolean(getEditorValue(node, "open")),
          owner: Boolean(getEditorValue(node, "owner")),
        });
        persistAndRefresh("日历已保存");
      });

      node.querySelector(".delete-row").addEventListener("click", () => {
        state.calendar = state.calendar.filter((item) => item.id !== day.id);
        persistAndRefresh("日期已删除");
      });

      els.calendarEditor.append(node);
    });
}

function setEditorValue(node, field, value) {
  const input = node.querySelector(`[data-field="${field}"]`);
  if (!input) return;
  if (input.type === "checkbox") {
    input.checked = Boolean(value);
  } else {
    input.value = value ?? "";
  }
}

function getEditorValue(node, field) {
  const input = node.querySelector(`[data-field="${field}"]`);
  if (!input) return "";
  return input.type === "checkbox" ? input.checked : input.value.trim();
}

function persistAndRefresh(message) {
  saveState();
  renderAll();
  renderAdmin();
  showToast(message);
}

function openAdminDialog() {
  const authed = sessionStorage.getItem(SESSION_KEY) === "true";
  els.loginPane.hidden = authed;
  els.adminPane.hidden = !authed;
  els.loginFeedback.textContent = "";
  if (authed) renderAdmin();

  if (typeof els.adminDialog.showModal === "function") {
    els.adminDialog.showModal();
    document.body.classList.add("dialog-open");
  }
}

function handleLogin() {
  const user = els.adminUser.value.trim();
  const pass = els.adminPass.value;
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    sessionStorage.setItem(SESSION_KEY, "true");
    els.loginPane.hidden = true;
    els.adminPane.hidden = false;
    els.loginFeedback.textContent = "";
    renderAdmin();
    showToast("已进入主理人控制台");
    return;
  }

  els.loginFeedback.textContent = "账号或密码不正确。";
}

function handleReserve(event) {
  event.preventDefault();
  const guestId = els.guestId.value.trim();
  const cups = Math.max(1, Number(els.reserveCups.value) || 1);
  const remaining = Number(state.shop.special.remaining) || 0;

  if (!guestId) {
    els.reserveFeedback.textContent = "请留下一个 ID。";
    return;
  }

  if (!state.shop.open) {
    els.reserveFeedback.textContent = "今天店休，暂不接受特调预约。";
    return;
  }

  if (remaining < cups) {
    els.reserveFeedback.textContent = `今天只剩 ${remaining} 杯，无法预约 ${cups} 杯。`;
    return;
  }

  state.shop.special.remaining = remaining - cups;
  state.reservations.push({
    id: createId(),
    guestId,
    cups,
    specialName: state.shop.special.name,
    date: todayISO(),
    time: new Date().toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  });

  saveState();
  renderAll();
  if (!els.adminPane.hidden) renderAdmin();
  els.reserveFeedback.textContent = `已预约 ${cups} 杯，取杯时报 ID：${guestId}`;
  els.reserveForm.reset();
  els.reserveCups.value = 1;
}

function bindEvents() {
  els.adminEntry.addEventListener("click", openAdminDialog);
  els.adminDialog.addEventListener("close", () => document.body.classList.remove("dialog-open"));
  els.loginButton.addEventListener("click", handleLogin);
  els.adminPass.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleLogin();
    }
  });

  els.logoutButton.addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    els.loginPane.hidden = false;
    els.adminPane.hidden = true;
  });

  els.saveStatus.addEventListener("click", () => {
    state.shop.open = statusInputs.open.checked;
    state.shop.ownerPresent = statusInputs.ownerPresent.checked;
    state.shop.hours = statusInputs.hours.value.trim();
    state.shop.ownerNote = statusInputs.ownerNote.value.trim();
    state.shop.special.name = statusInputs.specialName.value.trim();
    state.shop.special.price = Number(statusInputs.specialPrice.value) || 0;
    state.shop.special.remaining = Math.max(0, Number(statusInputs.specialRemaining.value) || 0);
    state.shop.special.total = Math.max(0, Number(statusInputs.specialTotal.value) || 0);
    state.shop.special.description = statusInputs.specialDesc.value.trim();
    persistAndRefresh("营业信息已保存");
  });

  els.addCoffee.addEventListener("click", () => {
    state.coffees.push({
      id: createId(),
      name: "新手冲",
      origin: "Origin",
      process: "处理法",
      notes: "风味描述",
      price: 38,
      available: true,
      image: imageOptions[0],
    });
    persistAndRefresh("已新增咖啡品类");
  });

  els.addNotice.addEventListener("click", () => {
    state.notices.push({
      id: createId(),
      title: "新公告",
      date: todayISO(),
      body: "在这里填写公告内容。",
    });
    persistAndRefresh("已新增公告");
  });

  els.addCalendarDay.addEventListener("click", () => {
    const nextDate = state.calendar.length
      ? addDaysISO(parseISODate(state.calendar[state.calendar.length - 1].date), 1)
      : todayISO();
    state.calendar.push({
      id: createId(),
      date: nextDate,
      open: true,
      owner: false,
      hours: "12:00 - 19:00",
      event: "新增安排",
    });
    persistAndRefresh("已新增日历日期");
  });

  els.clearReservations.addEventListener("click", () => {
    if (!state.reservations.length) return;
    if (!confirm("确认清空全部预约记录？")) return;
    state.reservations = [];
    persistAndRefresh("预约记录已清空");
  });

  els.exportData.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `8tiao-coffee-${todayISO()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });

  els.resetData.addEventListener("click", () => {
    if (!confirm("确认恢复为初始演示数据？")) return;
    state = defaultState();
    saveState();
    persistAndRefresh("已恢复初始数据");
  });

  els.reserveForm.addEventListener("submit", handleReserve);
}

function renderIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function showToast(message) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), 2200);
}

function safeImage(src) {
  return imageOptions.includes(src) ? src : imageOptions[0];
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

bindEvents();
saveState();
renderAll();
