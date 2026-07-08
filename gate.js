(() => {
  const PASSWORD = [49, 52, 56, 56, 48, 48].map((code) => String.fromCharCode(code)).join("");
  const UNLOCK_AT = new Date("2026-07-08T14:15:00+07:00").getTime();
  const STORAGE_KEY = "nsk-zero-gate-unlocked-v2";
  const root = document.documentElement;

  function timeOpen() {
    return Date.now() >= UNLOCK_AT;
  }

  function alreadyUnlocked() {
    return localStorage.getItem(STORAGE_KEY) === "1" || timeOpen();
  }

  function markUnlocked() {
    localStorage.setItem(STORAGE_KEY, "1");
  }

  if (alreadyUnlocked()) {
    if (timeOpen()) markUnlocked();
    root.classList.remove("gate-pending", "gate-locked");
    root.classList.add("gate-open");
    return;
  }

  root.classList.add("gate-locked");

  const gate = document.createElement("section");
  gate.className = "zero-gate";
  gate.setAttribute("role", "dialog");
  gate.setAttribute("aria-modal", "true");
  gate.setAttribute("aria-labelledby", "zeroGateTitle");
  gate.innerHTML = `
    <div class="zero-gate__card">
      <span class="zero-gate__label">Закрытый запуск</span>
      <h1 class="zero-gate__title" id="zeroGateTitle">Откроется в 14:15</h1>
      <p class="zero-gate__copy">До назначенного времени сайт держит городскую тайну. Можно дождаться обратного отсчета или ввести код доступа.</p>
      <div class="zero-gate__countdown" aria-label="Обратный отсчет">
        <div class="zero-gate__tile"><strong data-gate-hours>00</strong><span>часов</span></div>
        <div class="zero-gate__tile"><strong data-gate-minutes>00</strong><span>минут</span></div>
        <div class="zero-gate__tile"><strong data-gate-seconds>00</strong><span>секунд</span></div>
      </div>
      <form class="zero-gate__form" data-gate-form>
        <input class="zero-gate__input" data-gate-input inputmode="numeric" autocomplete="off" placeholder="Пароль" aria-label="Пароль открытия">
        <button class="zero-gate__button" type="submit">Открыть</button>
      </form>
      <p class="zero-gate__status" data-gate-status>Кодовая дверь слушает.</p>
      <p class="zero-gate__fine">После 14:15 по Новосибирску сайт открывается сам и больше не закрывается.</p>
    </div>
  `;

  document.body.appendChild(gate);

  const hours = gate.querySelector("[data-gate-hours]");
  const minutes = gate.querySelector("[data-gate-minutes]");
  const seconds = gate.querySelector("[data-gate-seconds]");
  const form = gate.querySelector("[data-gate-form]");
  const input = gate.querySelector("[data-gate-input]");
  const status = gate.querySelector("[data-gate-status]");

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function spawnPop(x, y, variant = "") {
    const pop = document.createElement("span");
    pop.className = `zero-gate__pop ${variant ? `is-${variant}` : ""}`;
    pop.style.left = `${x}px`;
    pop.style.top = `${y}px`;
    document.body.appendChild(pop);
    window.setTimeout(() => pop.remove(), 650);
  }

  function spawnConfetti(originX = window.innerWidth / 2, originY = window.innerHeight / 2) {
    const colors = ["#fff7e8", "#e51e2a", "#0b4bff", "#85ffcf"];
    for (let i = 0; i < 34; i += 1) {
      const piece = document.createElement("span");
      piece.className = "zero-gate__confetti";
      piece.style.left = `${originX}px`;
      piece.style.top = `${originY}px`;
      piece.style.setProperty("--confetti", colors[i % colors.length]);
      piece.style.setProperty("--x", `${Math.round((Math.random() - .5) * 520)}px`);
      piece.style.setProperty("--y", `${Math.round(Math.random() * 260 + 80)}px`);
      piece.style.setProperty("--rotate", `${Math.round(Math.random() * 360)}deg`);
      document.body.appendChild(piece);
      window.setTimeout(() => piece.remove(), 950);
    }
  }

  function openGate(reason = "time") {
    markUnlocked();
    root.classList.remove("gate-pending", "gate-locked");
    root.classList.add("gate-open");
    status.textContent = reason === "password" ? "Код принят. Замок раскрывается." : "14:15 наступило. Замок открыт.";
    gate.classList.remove("is-wrong");
    gate.classList.add("is-good");
    spawnConfetti();
    window.setTimeout(() => {
      gate.classList.add("is-leaving");
      window.setTimeout(() => gate.remove(), 820);
    }, reason === "password" ? 780 : 420);
  }

  function updateCountdown() {
    const remaining = Math.max(0, UNLOCK_AT - Date.now());
    if (remaining <= 0) {
      openGate("time");
      return;
    }

    const totalSeconds = Math.ceil(remaining / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    hours.textContent = pad(h);
    minutes.textContent = pad(m);
    seconds.textContent = pad(s);
  }

  function wrongPassword() {
    status.textContent = "Не тот код. Дверь мигнула красным.";
    gate.classList.remove("is-good");
    gate.classList.add("is-wrong");
    input.value = "";
    input.focus();
    const rect = input.getBoundingClientRect();
    spawnPop(rect.left + rect.width / 2, rect.top + rect.height / 2, "bad");
    window.setTimeout(() => gate.classList.remove("is-wrong"), 520);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const rect = input.getBoundingClientRect();
    if (input.value.trim() === PASSWORD) {
      spawnPop(rect.left + rect.width / 2, rect.top + rect.height / 2, "good");
      openGate("password");
    } else {
      wrongPassword();
    }
  });

  input.addEventListener("input", () => {
    input.classList.remove("is-typing");
    window.requestAnimationFrame(() => input.classList.add("is-typing"));
    status.textContent = input.value ? "Проверяю кодовый рисунок." : "Кодовая дверь слушает.";
  });

  input.addEventListener("animationend", () => input.classList.remove("is-typing"));

  gate.addEventListener("pointerdown", (event) => {
    spawnPop(event.clientX, event.clientY);
  });

  updateCountdown();
  const timer = window.setInterval(() => {
    if (!document.body.contains(gate)) {
      window.clearInterval(timer);
      return;
    }
    updateCountdown();
  }, 250);

  window.setTimeout(() => input.focus(), 120);
})();
