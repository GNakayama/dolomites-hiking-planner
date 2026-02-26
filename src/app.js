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
  // Static Alta Via 1 data - Complete route with all 15 rifugios
  // Based on: https://www.hikingwithlee.com/alta-via-1-complete-guide/
  // ---------------------------------------------------------------------------
  const ALTA_VIA_STAGES = [
    {
      id: 1,
      from: "Lago di Braies",
      to: "Rifugio Biella",
      hut: "Rifugio Biella",
      distanceKm: 9,
      ascentM: 800,
    },
    {
      id: 2,
      from: "Rifugio Biella",
      to: "Rifugio Pederù",
      hut: "Rifugio Pederù",
      distanceKm: 12,
      ascentM: 400,
    },
    {
      id: 3,
      from: "Rifugio Pederù",
      to: "Rifugio Fanes",
      hut: "Rifugio Fanes",
      distanceKm: 8,
      ascentM: 450,
    },
    {
      id: 4,
      from: "Rifugio Fanes",
      to: "Rifugio Lagazuoi",
      hut: "Rifugio Lagazuoi",
      distanceKm: 10,
      ascentM: 900,
    },
    {
      id: 5,
      from: "Rifugio Lagazuoi",
      to: "Rifugio Averau",
      hut: "Rifugio Averau",
      distanceKm: 6,
      ascentM: 300,
    },
    {
      id: 6,
      from: "Rifugio Averau",
      to: "Rifugio Nuvolau",
      hut: "Rifugio Nuvolau",
      distanceKm: 3,
      ascentM: 150,
    },
    {
      id: 7,
      from: "Rifugio Nuvolau",
      to: "Rifugio Città di Fiume",
      hut: "Rifugio Città di Fiume",
      distanceKm: 13,
      ascentM: 600,
    },
    {
      id: 8,
      from: "Rifugio Città di Fiume",
      to: "Rifugio Coldai",
      hut: "Rifugio Coldai",
      distanceKm: 11,
      ascentM: 700,
    },
    {
      id: 9,
      from: "Rifugio Coldai",
      to: "Rifugio Tissi",
      hut: "Rifugio Tissi",
      distanceKm: 14,
      ascentM: 800,
    },
    {
      id: 10,
      from: "Rifugio Tissi",
      to: "Rifugio Vazzoler",
      hut: "Rifugio Vazzoler",
      distanceKm: 10,
      ascentM: 500,
    },
    {
      id: 11,
      from: "Rifugio Vazzoler",
      to: "Rifugio Carestiato",
      hut: "Rifugio Carestiato",
      distanceKm: 12,
      ascentM: 600,
    },
    {
      id: 12,
      from: "Rifugio Carestiato",
      to: "Rifugio Palmieri",
      hut: "Rifugio Palmieri",
      distanceKm: 8,
      ascentM: 350,
    },
    {
      id: 13,
      from: "Rifugio Palmieri",
      to: "Rifugio Sommariva al Pramperet",
      hut: "Rifugio Sommariva al Pramperet",
      distanceKm: 9,
      ascentM: 400,
    },
    {
      id: 14,
      from: "Rifugio Sommariva al Pramperet",
      to: "Rifugio 7 Alpini",
      hut: "Rifugio 7 Alpini",
      distanceKm: 7,
      ascentM: 300,
    },
    {
      id: 15,
      from: "Rifugio 7 Alpini",
      to: "La Pissa (Belluno)",
      hut: "End in valley",
      distanceKm: 11,
      ascentM: 200,
    },
  ];

  const MIN_DAYS = 5;
  const MAX_DAYS = 12;

  // Simple in-memory state for the wizard.
  const state = {
    currentStep: 1,
    startDate: "",
    numDays: "",
    itinerary: [],
    allCombinations: [], // All possible hut combinations for selected days
    selectedCombinationIndex: null, // Index of selected combination
    carouselIndex: 0, // Current visible combination in carousel
    // Optional configuration
    maxDistancePerDay: "", // Max km per day
    maxAltitudePerDay: "", // Max ascent meters per day
    excludedHuts: [], // Array of hut names to exclude
    errors: {
      startDate: "",
      numDays: "",
      maxDistance: "",
      maxAltitude: "",
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
    container.appendChild(createFooter());

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

  function createFooter() {
    const footer = document.createElement("footer");
    footer.className = "app-footer";

    const footerContent = document.createElement("div");
    footerContent.className = "app-footer-content";

    const copyright = document.createElement("div");
    copyright.className = "app-footer-copyright";
    copyright.textContent = "© 2024 Dolomites Alta Via 1 Planner";

    const socialLinks = document.createElement("div");
    socialLinks.className = "app-footer-links";

    // Contact information links
    const links = [
      {
        label: "GitHub",
        url: "https://github.com/gnakayama",
        icon: "🔗",
      },
      {
        label: "LinkedIn",
        url: "https://linkedin.com/in/guilherme-nakayama",
        icon: "💼",
      },
      {
        label: "Email",
        url: "mailto:guilherme.nakayama.s@gmail.com",
        icon: "✉️",
      },
      {
        label: "Instagram",
        url: "https://instagram.com/guilhermenakayama",
        icon: "📷",
      },
    ];

    links.forEach((link) => {
      const anchor = document.createElement("a");
      anchor.href = link.url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.className = "app-footer-link";
      anchor.setAttribute("aria-label", link.label);

      const icon = document.createElement("span");
      icon.className = "app-footer-icon";
      icon.textContent = link.icon;

      const label = document.createElement("span");
      label.className = "app-footer-label";
      label.textContent = link.label;

      anchor.appendChild(icon);
      anchor.appendChild(label);
      socialLinks.appendChild(anchor);
    });

    footerContent.appendChild(copyright);
    footerContent.appendChild(socialLinks);
    footer.appendChild(footerContent);

    return footer;
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
    } else if (state.currentStep === 3) {
      wrapper.appendChild(createStepConfiguration());
    } else if (state.currentStep === 4) {
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
      "Optional filters",
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
    helper.textContent = `Choose ${MIN_DAYS}–${MAX_DAYS} days to complete Alta Via 1 from Lago di Braies to Belluno. We'll show you all possible hut combinations.`;

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

      // Move to step 3 (filters) - routes will be generated there
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
    label.textContent = `Step 4 · Choose your ${state.numDays}-day route to Belluno`;

    const helper = document.createElement("div");
    helper.className = "field-helper";
    const totalCombos = generateAllCombinations(parseInt(state.numDays, 10)).length;
    const showingText = state.allCombinations.length < totalCombos 
      ? `Showing the first ${state.allCombinations.length} of ${totalCombos} possible routes. `
      : "";
    helper.textContent =
      `${showingText}All ways to complete Alta Via 1 from Lago di Braies to Belluno in ${state.numDays} days. Use arrows to browse and click to select.`;

    root.appendChild(label);
    root.appendChild(helper);

    if (!state.allCombinations || state.allCombinations.length === 0) {
      const empty = document.createElement("div");
      empty.className = "field-helper";
      empty.textContent =
        "Set a start date and number of days first to see hut combinations.";
      root.appendChild(empty);
    } else {
      // Carousel container
      const carouselContainer = document.createElement("div");
      carouselContainer.className = "carousel-container";

      // Carousel wrapper
      const carouselWrapper = document.createElement("div");
      carouselWrapper.className = "carousel-wrapper";

      // Left arrow
      const leftArrow = document.createElement("button");
      leftArrow.className = "carousel-arrow carousel-arrow-left";
      leftArrow.innerHTML = "←";
      leftArrow.setAttribute("aria-label", "Previous option");
      leftArrow.disabled = state.carouselIndex === 0;
      leftArrow.addEventListener("click", () => {
        if (state.carouselIndex > 0) {
          state.carouselIndex -= 1;
          renderAppShell();
        }
      });

      // Carousel viewport (container with overflow hidden)
      const carouselViewport = document.createElement("div");
      carouselViewport.className = "carousel-viewport";

      // Carousel content (sliding container)
      const carouselContent = document.createElement("div");
      carouselContent.className = "carousel-content";
      carouselContent.style.width = `${state.allCombinations.length * 100}%`;
      carouselContent.style.transform = `translateX(-${(state.carouselIndex * 100) / state.allCombinations.length}%)`;

      // Create preview for each combination
      state.allCombinations.forEach((combination, index) => {
        const comboPreview = createCombinationPreview(
          combination,
          index,
          state.startDate
        );
        comboPreview.style.width = `${100 / state.allCombinations.length}%`;
        comboPreview.style.flexShrink = "0";
        comboPreview.addEventListener("click", () => {
          state.selectedCombinationIndex = index;
          state.itinerary = buildItineraryFromCombination(
            state.startDate,
            combination
          );
          renderAppShell();
        });
        carouselContent.appendChild(comboPreview);
      });

      carouselViewport.appendChild(carouselContent);

      // Right arrow
      const rightArrow = document.createElement("button");
      rightArrow.className = "carousel-arrow carousel-arrow-right";
      rightArrow.innerHTML = "→";
      rightArrow.setAttribute("aria-label", "Next option");
      rightArrow.disabled =
        state.carouselIndex >= state.allCombinations.length - 1;
      rightArrow.addEventListener("click", () => {
        if (state.carouselIndex < state.allCombinations.length - 1) {
          state.carouselIndex += 1;
          renderAppShell();
        }
      });

      carouselWrapper.appendChild(leftArrow);
      carouselWrapper.appendChild(carouselViewport);
      carouselWrapper.appendChild(rightArrow);
      carouselContainer.appendChild(carouselWrapper);

      // Carousel indicators
      const indicators = document.createElement("div");
      indicators.className = "carousel-indicators";
      state.allCombinations.forEach((_, index) => {
        const indicator = document.createElement("button");
        indicator.className = `carousel-indicator ${
          state.carouselIndex === index ? "carousel-indicator-active" : ""
        }`;
        indicator.setAttribute("aria-label", `Go to option ${index + 1}`);
        indicator.addEventListener("click", () => {
          state.carouselIndex = index;
          renderAppShell();
        });
        indicators.appendChild(indicator);
      });

      // Option counter
      const counter = document.createElement("div");
      counter.className = "carousel-counter";
      counter.textContent = `Option ${state.carouselIndex + 1} of ${state.allCombinations.length}`;

      root.appendChild(carouselContainer);
      root.appendChild(indicators);
      root.appendChild(counter);

      if (state.selectedCombinationIndex !== null) {
        const selectedNote = document.createElement("div");
        selectedNote.className = "field-helper";
        selectedNote.innerHTML = `<span class="accent-text">✓ Option ${state.selectedCombinationIndex + 1} selected</span> · See the detailed itinerary in the right panel.`;
        root.appendChild(selectedNote);
      }
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

    const next = document.createElement("button");
    next.className = "btn btn-primary";
    next.type = "button";
    next.innerHTML = '<span>Configure filters (optional)</span><span>→</span>';
    next.addEventListener("click", () => {
      state.currentStep = 4;
      renderAppShell();
    });

    buttons.appendChild(back);
    if (state.selectedCombinationIndex !== null) {
      buttons.appendChild(next);
    }
    root.appendChild(buttons);

    return root;
  }

  function createStepConfiguration() {
    const root = document.createElement("div");
    root.className = "stack-sm";

    const label = document.createElement("div");
    label.className = "field-label";
    label.textContent = "Step 3 · Optional filters & preferences";

    const helper = document.createElement("div");
    helper.className = "field-helper";
    helper.textContent =
      "Set constraints to filter route options. Leave empty to see all options.";

    root.appendChild(label);
    root.appendChild(helper);

    // Max distance per day
    const distanceGroup = document.createElement("div");
    distanceGroup.className = "stack-sm";
    distanceGroup.style.marginTop = "0.75rem";

    const distanceLabel = document.createElement("label");
    distanceLabel.className = "field-label";
    distanceLabel.textContent = "Maximum distance per day (km)";
    distanceLabel.setAttribute("for", "max-distance");

    const distanceInput = document.createElement("input");
    distanceInput.id = "max-distance";
    distanceInput.type = "number";
    distanceInput.min = "0";
    distanceInput.step = "1";
    distanceInput.placeholder = "e.g., 20 (leave empty for no limit)";
    distanceInput.className = "input";
    distanceInput.value = state.maxDistancePerDay;
    distanceInput.addEventListener("input", (e) => {
      state.maxDistancePerDay = e.target.value;
      // Routes will be generated when clicking "Generate routes" button
    });

    distanceGroup.appendChild(distanceLabel);
    distanceGroup.appendChild(distanceInput);

    if (state.errors.maxDistance) {
      const error = document.createElement("div");
      error.className = "error-text";
      error.textContent = state.errors.maxDistance;
      distanceGroup.appendChild(error);
    }

    // Max altitude/ascent per day
    const altitudeGroup = document.createElement("div");
    altitudeGroup.className = "stack-sm";
    altitudeGroup.style.marginTop = "0.75rem";

    const altitudeLabel = document.createElement("label");
    altitudeLabel.className = "field-label";
    altitudeLabel.textContent = "Maximum ascent per day (meters)";
    altitudeLabel.setAttribute("for", "max-altitude");

    const altitudeInput = document.createElement("input");
    altitudeInput.id = "max-altitude";
    altitudeInput.type = "number";
    altitudeInput.min = "0";
    altitudeInput.step = "50";
    altitudeInput.placeholder = "e.g., 1000 (leave empty for no limit)";
    altitudeInput.className = "input";
    altitudeInput.value = state.maxAltitudePerDay;
    altitudeInput.addEventListener("input", (e) => {
      state.maxAltitudePerDay = e.target.value;
      // Don't regenerate routes here - wait for user to click "Generate routes"
    });

    altitudeGroup.appendChild(altitudeLabel);
    altitudeGroup.appendChild(altitudeInput);

    if (state.errors.maxAltitude) {
      const error = document.createElement("div");
      error.className = "error-text";
      error.textContent = state.errors.maxAltitude;
      altitudeGroup.appendChild(error);
    }

    // Excluded huts
    const hutsGroup = document.createElement("div");
    hutsGroup.className = "stack-sm";
    hutsGroup.style.marginTop = "0.75rem";

    const hutsLabel = document.createElement("label");
    hutsLabel.className = "field-label";
    hutsLabel.textContent = "Exclude huts from routes";

    const hutsHelper = document.createElement("div");
    hutsHelper.className = "field-helper";
    hutsHelper.textContent = "Select huts you want to avoid. Routes using these huts will be filtered out.";

    const hutsCheckboxes = document.createElement("div");
    hutsCheckboxes.className = "huts-checkboxes";

    // Get all unique hut names from stages
    const allHuts = ALTA_VIA_STAGES.map((stage) => stage.hut).filter(
      (hut) => hut !== "End in valley"
    );
    const uniqueHuts = [...new Set(allHuts)];

    uniqueHuts.forEach((hut) => {
      const checkboxContainer = document.createElement("label");
      checkboxContainer.className = "checkbox-container";
      checkboxContainer.style.display = "flex";
      checkboxContainer.style.alignItems = "center";
      checkboxContainer.style.gap = "0.5rem";
      checkboxContainer.style.marginBottom = "0.5rem";
      checkboxContainer.style.cursor = "pointer";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = hut;
      checkbox.checked = state.excludedHuts.includes(hut);
        checkbox.addEventListener("change", (e) => {
          if (e.target.checked) {
            if (!state.excludedHuts.includes(hut)) {
              state.excludedHuts.push(hut);
            }
          } else {
            state.excludedHuts = state.excludedHuts.filter((h) => h !== hut);
          }
          // Don't regenerate routes here - wait for user to click "Generate routes"
        });

      const checkboxLabel = document.createElement("span");
      checkboxLabel.textContent = hut;
      checkboxLabel.style.fontSize = "0.8rem";
      checkboxLabel.style.color = "var(--text-soft)";

      checkboxContainer.appendChild(checkbox);
      checkboxContainer.appendChild(checkboxLabel);
      hutsCheckboxes.appendChild(checkboxContainer);
    });

    hutsGroup.appendChild(hutsLabel);
    hutsGroup.appendChild(hutsHelper);
    hutsGroup.appendChild(hutsCheckboxes);

    root.appendChild(distanceGroup);
    root.appendChild(altitudeGroup);
    root.appendChild(hutsGroup);

    // Buttons
    const buttons = document.createElement("div");
    buttons.className = "button-row";

    const back = document.createElement("button");
    back.className = "btn";
    back.type = "button";
    back.innerHTML = '<span>←</span><span>Back</span>';
    back.addEventListener("click", () => {
      state.currentStep = 2;
      renderAppShell();
    });

    const next = document.createElement("button");
    next.className = "btn btn-primary";
    next.type = "button";
    next.innerHTML = '<span>Generate routes</span><span>→</span>';
    next.addEventListener("click", () => {
      // Generate routes with filters applied
      const parsed = parseInt(state.numDays, 10);
      if (Number.isNaN(parsed)) {
        return;
      }

      // Generate all possible hut combinations for the selected number of days
      // Apply filters and limit to first 10
      const allCombos = generateAllCombinations(parsed);
      let filtered = allCombos;

      // Apply filters
      if (state.maxDistancePerDay) {
        const maxDist = parseFloat(state.maxDistancePerDay);
        if (!Number.isNaN(maxDist) && maxDist > 0) {
          filtered = filtered.filter((combo) =>
            combo.every((day) => day.totalDistanceKm <= maxDist)
          );
        }
      }

      if (state.maxAltitudePerDay) {
        const maxAlt = parseFloat(state.maxAltitudePerDay);
        if (!Number.isNaN(maxAlt) && maxAlt > 0) {
          filtered = filtered.filter((combo) =>
            combo.every((day) => day.totalAscentM <= maxAlt)
          );
        }
      }

      if (state.excludedHuts.length > 0) {
        filtered = filtered.filter((combo) =>
          combo.every((day) => !state.excludedHuts.includes(day.hut))
        );
      }

      state.allCombinations = filtered.slice(0, 10);
      state.selectedCombinationIndex = null;
      state.carouselIndex = 0; // Reset carousel to first option
      state.itinerary = [];
      state.currentStep = 4; // Move to route selection
      renderAppShell();
    });

    buttons.appendChild(back);
    buttons.appendChild(next);
    root.appendChild(buttons);

    return root;
  }

  /**
   * Applies filters and regenerates combinations
   */
  function applyFiltersAndRegenerate() {
    const numDays = parseInt(state.numDays, 10);
    if (Number.isNaN(numDays)) return;

    // Generate all combinations
    let allCombos = generateAllCombinations(numDays);

    // Filter by max distance
    if (state.maxDistancePerDay) {
      const maxDist = parseFloat(state.maxDistancePerDay);
      if (!Number.isNaN(maxDist) && maxDist > 0) {
        allCombos = allCombos.filter((combo) =>
          combo.every((day) => day.totalDistanceKm <= maxDist)
        );
      }
    }

    // Filter by max altitude/ascent
    if (state.maxAltitudePerDay) {
      const maxAlt = parseFloat(state.maxAltitudePerDay);
      if (!Number.isNaN(maxAlt) && maxAlt > 0) {
        allCombos = allCombos.filter((combo) =>
          combo.every((day) => day.totalAscentM <= maxAlt)
        );
      }
    }

    // Filter by excluded huts
    if (state.excludedHuts.length > 0) {
      allCombos = allCombos.filter((combo) =>
        combo.every((day) => !state.excludedHuts.includes(day.hut))
      );
    }

    // Limit to first 10 and update
    state.allCombinations = allCombos.slice(0, 10);
    state.carouselIndex = Math.min(
      state.carouselIndex,
      state.allCombinations.length - 1
    );
    
    // If selected combination is no longer valid, clear selection
    if (
      state.selectedCombinationIndex !== null &&
      state.selectedCombinationIndex >= state.allCombinations.length
    ) {
      state.selectedCombinationIndex = null;
      state.itinerary = [];
    }

    renderAppShell();
  }

  /**
   * Creates a preview of a combination using the same format as the itinerary summary.
   */
  function createCombinationPreview(combination, index, startDate) {
    const preview = document.createElement("div");
    preview.className = `combination-preview ${
      state.selectedCombinationIndex === index ? "combination-preview-selected" : ""
    }`;

    // Build temporary itinerary for preview
    const tempItinerary = buildItineraryFromCombination(startDate, combination);

    // Summary stats
    const totalDistance = combination.reduce(
      (sum, day) => sum + day.totalDistanceKm,
      0
    );
    const totalAscent = combination.reduce(
      (sum, day) => sum + day.totalAscentM,
      0
    );

    const previewHeader = document.createElement("div");
    previewHeader.className = "combination-preview-header";

    const previewTitle = document.createElement("div");
    previewTitle.className = "combination-preview-title";
    previewTitle.textContent = `Option ${index + 1}`;

    const previewStats = document.createElement("div");
    previewStats.className = "combination-preview-stats";

    const distanceChip = document.createElement("span");
    distanceChip.className = "summary-chip";
    distanceChip.textContent = `${totalDistance.toFixed(1)} km`;

    const ascentChip = document.createElement("span");
    ascentChip.className = "summary-chip";
    ascentChip.textContent = `${totalAscent} m up`;

    previewStats.appendChild(distanceChip);
    previewStats.appendChild(ascentChip);

    previewHeader.appendChild(previewTitle);
    previewHeader.appendChild(previewStats);

    // Day-by-day list (same format as itinerary summary)
    const daysList = document.createElement("div");
    daysList.className = "itinerary-list";

    tempItinerary.forEach((day) => {
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

      // Show combined stages if multiple stages in one day
      if (day.allStages && day.allStages.length > 1) {
        const stagesList = day.allStages
          .map((s, idx) => (idx === 0 ? s.from : s.to))
          .join(" → ");
        route.textContent = stagesList;
      } else {
        route.textContent = `${day.stage.from} → ${day.stage.to}`;
      }

      const hut = document.createElement("div");
      hut.className = "itinerary-day-meta";
      if (day.allStages && day.allStages.length > 1) {
        hut.textContent = `Combines ${day.allStages.length} stages · Book: ${day.stage.hut === "End in valley" ? "Finish in valley" : day.stage.hut}`;
      } else {
        hut.textContent =
          day.stage.hut === "End in valley"
            ? "Finish in the valley (no hut booking needed)."
            : `Book: ${day.stage.hut}`;
      }

      item.appendChild(header);
      item.appendChild(route);
      item.appendChild(hut);

      daysList.appendChild(item);
    });

    preview.appendChild(previewHeader);
    preview.appendChild(daysList);

    return preview;
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
      if (state.currentStep === 3 && state.allCombinations.length > 0) {
        line.innerHTML =
          '<span class="muted-text">Select a route option</span> ' +
          "Click on one of the combinations in Step 3 to see the detailed itinerary here.";
      } else {
        line.innerHTML =
          '<span class="muted-text">No itinerary yet.</span> ' +
          "Choose a start date and number of days in the wizard to see all possible hut combinations.";
      }

      const hint = document.createElement("div");
      hint.className = "field-helper";
      if (state.currentStep === 3 && state.allCombinations.length > 0) {
        hint.textContent =
          "Each option shows different ways to combine stages, with varying daily distances and hut stops.";
      } else {
        hint.textContent =
          "Once you select a combination, you will see one card per day here, with the hut you should book and the distance you will hike.";
      }

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
      
      // Show combined stages if multiple stages in one day
      if (day.allStages && day.allStages.length > 1) {
        const stagesList = day.allStages
          .map((s, idx) => (idx === 0 ? s.from : s.to))
          .join(" → ");
        route.textContent = stagesList;
      } else {
        route.textContent = `${day.stage.from} → ${day.stage.to}`;
      }

      const hut = document.createElement("div");
      hut.className = "itinerary-day-meta";
      if (day.allStages && day.allStages.length > 1) {
        hut.textContent = `Combines ${day.allStages.length} stages · Book: ${day.stage.hut === "End in valley" ? "Finish in valley" : day.stage.hut}`;
      } else {
        hut.textContent =
          day.stage.hut === "End in valley"
            ? "Finish in the valley (no hut booking needed)."
            : `Book: ${day.stage.hut}`;
      }

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

  /**
   * Generates all possible ways to complete Alta Via 1 in numDays.
   * Always goes from start (Lago di Braies) to finish (Belluno).
   * Returns an array of combinations, where each combination is an array of days.
   */
  function generateAllCombinations(numDays) {
    const totalStages = ALTA_VIA_STAGES.length;
    const combinations = [];

    // We need to partition totalStages into numDays groups
    // This is equivalent to finding all ways to place (numDays - 1) breaks
    // between the stages
    function findPartitions(stagesLeft, daysLeft, currentPartition) {
      if (daysLeft === 1) {
        // Last day: take all remaining stages
        const dayStages = ALTA_VIA_STAGES.slice(
          totalStages - stagesLeft,
          totalStages
        );
        const day = createDayFromStages(dayStages);
        const newPartition = [...currentPartition, day];
        combinations.push(newPartition);
        return;
      }

      // For each possible number of stages for the current day
      // (at least 1, at most stagesLeft - daysLeft + 1)
      const minStages = 1;
      const maxStages = stagesLeft - daysLeft + 1;

      for (let stagesToday = minStages; stagesToday <= maxStages; stagesToday += 1) {
        const dayStages = ALTA_VIA_STAGES.slice(
          totalStages - stagesLeft,
          totalStages - stagesLeft + stagesToday
        );
        const day = createDayFromStages(dayStages);
        findPartitions(
          stagesLeft - stagesToday,
          daysLeft - 1,
          [...currentPartition, day]
        );
      }
    }

    findPartitions(totalStages, numDays, []);
    return combinations;
  }

  /**
   * Creates a day object from an array of consecutive stages.
   */
  function createDayFromStages(stages) {
    if (stages.length === 0) return null;

    const totalDistanceKm = stages.reduce(
      (sum, stage) => sum + stage.distanceKm,
      0
    );
    const totalAscentM = stages.reduce(
      (sum, stage) => sum + stage.ascentM,
      0
    );

    const firstStage = stages[0];
    const lastStage = stages[stages.length - 1];

    return {
      stages: stages,
      from: firstStage.from,
      to: lastStage.to,
      hut: lastStage.hut,
      totalDistanceKm: totalDistanceKm,
      totalAscentM: totalAscentM,
    };
  }

  /**
   * Builds an itinerary from a selected combination and start date.
   */
  function buildItineraryFromCombination(startDate, combination) {
    const itinerary = [];
    const base = startDate ? new Date(startDate) : new Date();

    combination.forEach((day, index) => {
      const date = new Date(base);
      date.setDate(base.getDate() + index);

      // For display, we'll use the first stage as the representative
      // but show the combined distance and ascent
      const representativeStage = {
        ...day.stages[0],
        distanceKm: day.totalDistanceKm,
        ascentM: day.totalAscentM,
        to: day.to,
        hut: day.hut,
      };

      itinerary.push({
        dayIndex: index + 1,
        date: date.toISOString().slice(0, 10),
        stage: representativeStage,
        allStages: day.stages, // Keep all stages for detailed view
      });
    });

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

