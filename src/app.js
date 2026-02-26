// Dolomites Alta Via 1 – Hiking Planner (Static v1)
// -------------------------------------------------
// This first version is intentionally simple:
// - Pure JavaScript, no build tooling
// - No backend or network calls
// - Clear, readable structure so we can grow the planner over time
//
// High-level layout:
// - App root builds a two-column layout:
//   - Left: route overview + wizard controls
//   - Right: itinerary summary (per day huts + distance)
//
// As features grow, we can split this file into small modules inside `src/`
// (e.g. `state.js`, `components/RouteOverview.js`, `data/alta-via-1.js`, etc.).

(() => {
  // ---------------------------------------------------------------------------
  // Static Alta Via 1 data (shortened prototype version)
  // ---------------------------------------------------------------------------
  const ALTA_VIA_STAGES = [
    {
      id: 1,
      from: "Lago di Braies",
      to: "Rifugio Biella",
      hut: "Rifugio Biella",
      distanceKm: 12,
      ascentM: 900,
    },
    {
      id: 2,
      from: "Rifugio Biella",
      to: "Rifugio Fanes",
      hut: "Rifugio Fanes",
      distanceKm: 14,
      ascentM: 650,
    },
    {
      id: 3,
      from: "Rifugio Fanes",
      to: "Rifugio Lagazuoi",
      hut: "Rifugio Lagazuoi",
      distanceKm: 10,
      ascentM: 900,
    },
    {
      id: 4,
      from: "Rifugio Lagazuoi",
      to: "Rifugio Nuvolau",
      hut: "Rifugio Nuvolau",
      distanceKm: 9,
      ascentM: 450,
    },
    {
      id: 5,
      from: "Rifugio Nuvolau",
      to: "Rifugio Città di Fiume",
      hut: "Rifugio Città di Fiume",
      distanceKm: 13,
      ascentM: 600,
    },
    {
      id: 6,
      from: "Rifugio Città di Fiume",
      to: "Rifugio Tissi",
      hut: "Rifugio Tissi",
      distanceKm: 15,
      ascentM: 800,
    },
    {
      id: 7,
      from: "Rifugio Tissi",
      to: "Rifugio Carestiato",
      hut: "Rifugio Carestiato",
      distanceKm: 11,
      ascentM: 550,
    },
    {
      id: 8,
      from: "Rifugio Carestiato",
      to: "La Stanga (Belluno side)",
      hut: "End in valley",
      distanceKm: 16,
      ascentM: 300,
    },
  ];

  const MIN_DAYS = 3;
  const MAX_DAYS = ALTA_VIA_STAGES.length;

  // Simple in-memory state for the wizard.
  const state = {
    currentStep: 1,
    startDate: "",
    numDays: "",
    itinerary: [],
    errors: {
      startDate: "",
      numDays: "",
    },
  };

  /**
   * Mounts the static app shell into the `#app-root` element.
   * We re-render the whole shell when state changes; the app is small enough
   * that this keeps the code straightforward and very easy to follow.
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
    leftColumn.appendChild(createWizardPanel());

    rightColumn.appendChild(createItinerarySummaryPanel());

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

  // ---------------------------------------------------------------------------
  // Wizard: choose start date → number of days → see huts & distances
  // ---------------------------------------------------------------------------

  function createWizardPanel() {
    const panel = createPanelShell("Plan your traverse");

    const body = panel.body;
    const wrapper = document.createElement("div");
    wrapper.className = "stack-sm";

    wrapper.appendChild(createWizardStepsHeader());

    if (state.currentStep === 1) {
      wrapper.appendChild(createStepStartDate());
    } else if (state.currentStep === 2) {
      wrapper.appendChild(createStepNumDays());
    } else {
      wrapper.appendChild(createStepReview());
    }

    body.appendChild(wrapper);
    return panel.root;
  }

  function createWizardStepsHeader() {
    const steps = document.createElement("div");
    steps.className = "wizard-steps";

    const labels = [
      "Start date",
      "Number of days",
      "Huts & distances",
    ];

    labels.forEach((label, index) => {
      const stepIndex = index + 1;
      const step = document.createElement("div");
      step.className = "wizard-step";

      if (stepIndex === state.currentStep) {
        step.classList.add("wizard-step-active");
      } else if (stepIndex < state.currentStep) {
        step.classList.add("wizard-step-done");
      }

      const badge = document.createElement("span");
      badge.className = "wizard-step-badge";
      badge.textContent = stepIndex;

      const text = document.createElement("span");
      text.textContent = label;

      step.appendChild(badge);
      step.appendChild(text);
      steps.appendChild(step);
    });

    return steps;
  }

  function createStepStartDate() {
    const root = document.createElement("div");
    root.className = "stack-sm";

    const label = document.createElement("div");
    label.className = "field-label";
    label.textContent = "Step 1 · When do you want to start hiking?";

    const helper = document.createElement("div");
    helper.className = "field-helper";
    helper.textContent =
      "Pick your first day on the trail. We will automatically compute each hiking day from here.";

    const group = document.createElement("div");
    group.className = "field-group";

    const input = document.createElement("input");
    input.type = "date";
    input.className = "input";
    if (state.startDate) {
      input.value = state.startDate;
    }
    input.addEventListener("input", (event) => {
      state.startDate = event.target.value;
      state.errors.startDate = "";
    });

    group.appendChild(input);

    root.appendChild(label);
    root.appendChild(helper);
    root.appendChild(group);

    if (state.errors.startDate) {
      const error = document.createElement("div");
      error.className = "error-text";
      error.textContent = state.errors.startDate;
      root.appendChild(error);
    }

    const buttons = document.createElement("div");
    buttons.className = "button-row";

    const next = document.createElement("button");
    next.className = "btn btn-primary";
    next.type = "button";
    next.innerHTML = '<span>Next</span><span>→</span>';
    next.addEventListener("click", () => {
      if (!state.startDate) {
        state.errors.startDate = "Please choose a start date to continue.";
        renderAppShell();
        return;
      }
      state.currentStep = 2;
      renderAppShell();
    });

    buttons.appendChild(next);
    root.appendChild(buttons);

    return root;
  }

  function createStepNumDays() {
    const root = document.createElement("div");
    root.className = "stack-sm";

    const label = document.createElement("div");
    label.className = "field-label";
    label.textContent = "Step 2 · How many hiking days do you have?";

    const helper = document.createElement("div");
    helper.className = "field-helper";
    helper.textContent = `For this prototype, we support ${MIN_DAYS}–${MAX_DAYS} days along the core Alta Via 1 stages.`;

    const group = document.createElement("div");
    group.className = "field-group";

    const input = document.createElement("input");
    input.type = "number";
    input.min = String(MIN_DAYS);
    input.max = String(MAX_DAYS);
    input.step = "1";
    input.placeholder = `${MIN_DAYS}–${MAX_DAYS}`;
    input.className = "input";
    if (state.numDays) {
      input.value = state.numDays;
    }
    input.addEventListener("input", (event) => {
      state.numDays = event.target.value;
      state.errors.numDays = "";
    });

    group.appendChild(input);

    root.appendChild(label);
    root.appendChild(helper);
    root.appendChild(group);

    if (state.errors.numDays) {
      const error = document.createElement("div");
      error.className = "error-text";
      error.textContent = state.errors.numDays;
      root.appendChild(error);
    }

    const buttons = document.createElement("div");
    buttons.className = "button-row";

    const back = document.createElement("button");
    back.className = "btn";
    back.type = "button";
    back.innerHTML = '<span>←</span><span>Back</span>';
    back.addEventListener("click", () => {
      state.currentStep = 1;
      renderAppShell();
    });

    const next = document.createElement("button");
    next.className = "btn btn-primary";
    next.type = "button";
    next.innerHTML = '<span>See huts & distances</span><span>→</span>';
    next.addEventListener("click", () => {
      const parsed = parseInt(state.numDays, 10);
      if (Number.isNaN(parsed)) {
        state.errors.numDays = "Enter a valid number of hiking days.";
        renderAppShell();
        return;
      }
      if (parsed < MIN_DAYS || parsed > MAX_DAYS) {
        state.errors.numDays = `For now we support between ${MIN_DAYS} and ${MAX_DAYS} days.`;
        renderAppShell();
        return;
      }

      state.itinerary = buildItinerary(state.startDate, parsed);
      state.currentStep = 3;
      renderAppShell();
    });

    buttons.appendChild(back);
    buttons.appendChild(next);
    root.appendChild(buttons);

    return root;
  }

  function createStepReview() {
    const root = document.createElement("div");
    root.className = "stack-sm";

    const label = document.createElement("div");
    label.className = "field-label";
    label.textContent = "Step 3 · These are the huts you should aim for";

    const helper = document.createElement("div");
    helper.className = "field-helper";
    helper.textContent =
      "Based on your days, we assign one classic Alta Via 1 stage to each hiking day. Distances are approximate but realistic.";

    root.appendChild(label);
    root.appendChild(helper);

    if (!state.itinerary.length) {
      const empty = document.createElement("div");
      empty.className = "field-helper";
      empty.textContent =
        "Set a start date and number of days first to see your suggested huts.";
      root.appendChild(empty);
    } else {
      const note = document.createElement("div");
      note.className = "field-helper";
      note.textContent =
        "You can refine this later with rest days, variants, and your own hut choices.";
      root.appendChild(note);
    }

    const buttons = document.createElement("div");
    buttons.className = "button-row";

    const back = document.createElement("button");
    back.className = "btn";
    back.type = "button";
    back.innerHTML = '<span>←</span><span>Adjust days</span>';
    back.addEventListener("click", () => {
      state.currentStep = 2;
      renderAppShell();
    });

    buttons.appendChild(back);
    root.appendChild(buttons);

    return root;
  }

  // ---------------------------------------------------------------------------
  // Right column: itinerary summary – huts & per-day distance
  // ---------------------------------------------------------------------------

  function createItinerarySummaryPanel() {
    const panel = createPanelShell("Trip snapshot");

    const body = panel.body;
    body.classList.add("panel-body-empty");

    if (!state.itinerary.length) {
      const empty = document.createElement("div");
      empty.className = "stack-sm";

      const line = document.createElement("div");
      line.innerHTML =
        '<span class="muted-text">No itinerary yet.</span> ' +
        "Choose a start date and number of days in the wizard to see huts and daily distances.";

      const hint = document.createElement("div");
      hint.className = "field-helper";
      hint.textContent =
        "Once generated, you will see one card per day here, with the hut you should book and the distance you will hike.";

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

    const stack = document.createElement("div");
    stack.className = "stack-sm";

    const heading = document.createElement("div");
    heading.className = "field-label";
    heading.textContent = "Your Alta Via 1 snapshot";

    const dates = document.createElement("div");
    dates.className = "field-helper";

    const firstDay = state.itinerary[0];
    const lastDay = state.itinerary[state.itinerary.length - 1];
    dates.textContent = `${formatShortDate(firstDay.date)} → ${formatShortDate(
      lastDay.date
    )} · ${state.itinerary.length} hiking days`;

    const summaryRow = document.createElement("div");
    summaryRow.className = "summary-row";

    const totalDistance = state.itinerary.reduce(
      (sum, day) => sum + day.stage.distanceKm,
      0
    );
    const totalAscent = state.itinerary.reduce(
      (sum, day) => sum + day.stage.ascentM,
      0
    );

    const distanceChip = document.createElement("div");
    distanceChip.className = "summary-chip";
    distanceChip.textContent = `${totalDistance.toFixed(1)} km total`;

    const ascentChip = document.createElement("div");
    ascentChip.className = "summary-chip";
    ascentChip.textContent = `${totalAscent} m ascent (approx.)`;

    summaryRow.appendChild(distanceChip);
    summaryRow.appendChild(ascentChip);

    const list = document.createElement("div");
    list.className = "itinerary-list";

    state.itinerary.forEach((day) => {
      const item = document.createElement("div");
      item.className = "itinerary-day";

      const header = document.createElement("div");
      header.className = "itinerary-day-header";

      const title = document.createElement("div");
      title.className = "itinerary-day-title";
      title.textContent = `Day ${day.dayIndex} · ${formatShortDate(day.date)}`;

      const meta = document.createElement("div");
      meta.className = "itinerary-day-meta";
      meta.textContent = `${day.stage.distanceKm} km · ${day.stage.ascentM} m up`;

      header.appendChild(title);
      header.appendChild(meta);

      const route = document.createElement("div");
      route.className = "itinerary-day-meta";
      route.textContent = `${day.stage.from} → ${day.stage.to}`;

      const hut = document.createElement("div");
      hut.className = "itinerary-day-meta";
      hut.textContent =
        day.stage.hut === "End in valley"
          ? "Finish in the valley (no hut booking needed)."
          : `Book: ${day.stage.hut}`;

      item.appendChild(header);
      item.appendChild(route);
      item.appendChild(hut);

      list.appendChild(item);
    });

    stack.appendChild(heading);
    stack.appendChild(dates);
    stack.appendChild(summaryRow);
    stack.appendChild(list);

    body.appendChild(stack);
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

    header.appendChild(titleEl);

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

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function buildItinerary(startDate, numDays) {
    const itinerary = [];
    const base = startDate ? new Date(startDate) : new Date();

    for (let i = 0; i < numDays; i += 1) {
      const stage = ALTA_VIA_STAGES[i];
      if (!stage) break;

      const date = new Date(base);
      date.setDate(base.getDate() + i);

      itinerary.push({
        dayIndex: i + 1,
        date: date.toISOString().slice(0, 10),
        stage,
      });
    }

    return itinerary;
  }

  function formatShortDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  // Boot the app once the DOM is ready.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderAppShell);
  } else {
    renderAppShell();
  }
})();

