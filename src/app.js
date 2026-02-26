// Dolomites Alta Via 1 – Hiking Planner (Static v1)
// -------------------------------------------------
// This first version is intentionally simple:
// - Pure JavaScript, no build tooling
// - No backend or network calls
// - Clear, readable structure so we can grow the planner over time
//
// High-level layout:
// - App root builds a two-column layout:
//   - Left: route overview + (future) stage planner
//   - Right: trip snapshot + (future) constraints/summary
//
// As features grow, we can split this file into small modules inside `src/`
// (e.g. `state.js`, `components/RouteOverview.js`, `data/alta-via-1.js`, etc.).

(() => {
  /**
   * Mounts the static app shell into the `#app-root` element.
   * In v1 there is no dynamic state yet – just a clean structure to build on.
   */
  function renderAppShell() {
    const root = document.getElementById("app-root");
    if (!root) return;

    root.innerHTML = "";

    const container = document.createElement("div");
    container.className = "app-container";

    container.appendChild(createHeader());
    container.appendChild(createMain());

    root.appendChild(container);
  }

  function createHeader() {
    const header = document.createElement("header");
    header.className = "app-header";

    const titleRow = document.createElement("div");
    titleRow.className = "app-header-title";

    const title = document.createElement("div");
    title.textContent = "Dolomites Alta Via 1";

    const betaBadge = document.createElement("span");
    betaBadge.className = "badge badge-accent";
    betaBadge.textContent = "Static v1";

    titleRow.appendChild(title);
    titleRow.appendChild(betaBadge);

    const subtitle = document.createElement("p");
    subtitle.className = "app-header-subtitle";
    subtitle.textContent =
      "Plan a clean, realistic itinerary along the Alta Via 1. " +
      "This first version is static: perfect to iterate on structure, stages, and constraints before wiring in live data.";

    header.appendChild(titleRow);
    header.appendChild(subtitle);

    return header;
  }

  function createMain() {
    const main = document.createElement("main");
    main.className = "app-main";

    const leftColumn = document.createElement("section");
    leftColumn.className = "stack";

    const rightColumn = document.createElement("section");
    rightColumn.className = "stack";

    leftColumn.appendChild(createRouteOverviewPanel());
    // Future: leftColumn.appendChild(createStagePlannerPanel());

    rightColumn.appendChild(createTripSnapshotPanel());
    // Future: rightColumn.appendChild(createConstraintsPanel());

    main.appendChild(leftColumn);
    main.appendChild(rightColumn);

    return main;
  }

  function createRouteOverviewPanel() {
    const panel = createPanelShell("Alta Via 1 overview");

    const body = panel.body;
    const stack = document.createElement("div");
    stack.className = "stack-sm";

    const line = document.createElement("div");
    line.innerHTML =
      '<span class="accent-text">27 major stages</span> · Lago di Braies → Belluno';

    const meta = document.createElement("div");
    meta.className = "muted-text";
    meta.textContent =
      "Classic north–south traverse through the Dolomites. We will break this into practical day segments with huts, distance, and elevation.";

    const pillRow = document.createElement("div");
    pillRow.className = "field-group";

    const seasonPill = createPill("Ideal season", "late June – mid September");
    const difficultyPill = createPill("Typical difficulty", "T2–T3 alpine");

    pillRow.appendChild(seasonPill);
    pillRow.appendChild(difficultyPill);

    stack.appendChild(line);
    stack.appendChild(meta);
    stack.appendChild(pillRow);

    body.appendChild(stack);
    return panel.root;
  }

  function createTripSnapshotPanel() {
    const panel = createPanelShell("Trip snapshot");

    const body = panel.body;
    body.classList.add("panel-body-empty");

    const empty = document.createElement("div");
    empty.className = "stack-sm";

    const line = document.createElement("div");
    line.innerHTML =
      '<span class="muted-text">No itinerary yet.</span> ' +
      "In the next step we will add stages, total distance, elevation gain, and hut overnights here.";

    const hint = document.createElement("div");
    hint.className = "field-helper";
    hint.textContent =
      "The snapshot will stay in sync with your day-by-day plan, so you always see the big picture at a glance.";

    const warning = document.createElement("span");
    warning.className = "pill pill-danger";
    warning.innerHTML =
      '<span class="pill-dot"></span><span>Static prototype – no saving yet</span>';

    empty.appendChild(line);
    empty.appendChild(hint);
    empty.appendChild(warning);

    body.appendChild(empty);
    return panel.root;
  }

  /**
   * Utility: create a panel shell with a header and body container.
   * Returns both the root element and a reference to the body node.
   */
  function createPanelShell(title) {
    const root = document.createElement("section");
    root.className = "panel";

    const header = document.createElement("div");
    header.className = "panel-header";

    const titleEl = document.createElement("div");
    titleEl.className = "panel-title";
    titleEl.textContent = title;

    const stub = document.createElement("span");
    stub.className = "field-helper";
    stub.textContent = "static shell";

    header.appendChild(titleEl);
    header.appendChild(stub);

    const body = document.createElement("div");
    body.className = "panel-body";

    root.appendChild(header);
    root.appendChild(body);

    return { root, body };
  }

  function createPill(label, value) {
    const pill = document.createElement("div");
    pill.className = "pill";

    const dot = document.createElement("span");
    dot.className = "pill-dot";

    const text = document.createElement("span");
    text.innerHTML =
      `<span class="small-caps">${label}</span>` +
      `<span class="muted-text"> · ${value}</span>`;

    pill.appendChild(dot);
    pill.appendChild(text);

    return pill;
  }

  // Boot the app once the DOM is ready.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderAppShell);
  } else {
    renderAppShell();
  }
})();

