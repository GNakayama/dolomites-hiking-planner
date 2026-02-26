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
// Refactored to use ES modules for better maintainability and testability.

import { ALTA_VIA_STAGES, MIN_DAYS, MAX_DAYS } from './data/alta-via-1.js';
import { getHutBookingInfo } from './data/hut-booking-links.js';
import { getHutDetails } from './data/hut-details.js';
import { generateAllCombinations } from './utils/route-generator.js';
import { applyFilters } from './utils/filters.js';
import { formatShortDate, buildItineraryFromCombination } from './utils/date-helpers.js';

(() => {
  // ---------------------------------------------------------------------------
  // Data and utilities are now imported from separate modules
  // See: data/alta-via-1.js, utils/route-generator.js, utils/filters.js, utils/date-helpers.js
  // ---------------------------------------------------------------------------

  // Simple in-memory state for the wizard.
  const state = {
    currentView: "wizard", // "wizard" or "plan"
    currentStep: 1,
    startDate: "",
    numDays: "",
    itinerary: [],
    allCombinations: [], // All possible hut combinations for selected days
    selectedCombinationIndex: null, // Index of selected combination
    carouselIndex: 0, // Current visible combination in carousel
    // Optional configuration
    minDistancePerDay: "", // Min km per day
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

    // Show either wizard view or hiking plan view
    if (state.currentView === "plan" && state.itinerary.length > 0) {
      container.appendChild(createHikingPlanView());
    } else {
      container.appendChild(createMain());
    }

    container.appendChild(createFooter());

    root.appendChild(container);
  }

  function createHeader() {
    const header = document.createElement("header");
    header.className = "app-header";

    // Warning banner
    const warningBanner = document.createElement("div");
    warningBanner.className = "warning-banner";
    warningBanner.innerHTML = `
      <span class="warning-icon">⚠️</span>
      <span class="warning-text">
        <strong>Prototype Version:</strong> This is an early prototype. Please verify all information independently. 
        Do not blindly trust the data - distances, hut information, and route details should be cross-checked with official sources.
      </span>
    `;

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

    header.appendChild(warningBanner);
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
      wrapper.appendChild(createStepHutExclusion());
    } else if (state.currentStep === 5) {
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
      "Distance & altitude",
      "Exclude huts",
      "Huts & distance",
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

      const badge = document.createElement("div");
      badge.className = "wizard-step-badge";
      badge.textContent = stepIndex;

      const text = document.createElement("div");
      text.className = "wizard-step-label";
      text.textContent = label;

      step.appendChild(badge);
      step.appendChild(text);

      // Add dashed line connector (except for last step)
      if (index < labels.length - 1) {
        const connector = document.createElement("div");
        connector.className = "wizard-step-connector";
        steps.appendChild(step);
        steps.appendChild(connector);
      } else {
        steps.appendChild(step);
      }
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
      state.currentStep = state.currentStep + 1;
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
      state.currentStep = state.currentStep - 1;
      renderAppShell();
    });

    const next = document.createElement("button");
    next.className = "btn btn-primary";
    next.type = "button";
    next.innerHTML = '<span>Next</span><span>→</span>';
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
      state.currentStep = state.currentStep + 1;
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
    label.textContent = `Step 5 · Choose your ${state.numDays}-day route to Belluno`;

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
    back.innerHTML = '<span>←</span><span>Back</span>';
    back.addEventListener("click", () => {
      state.currentStep = state.currentStep - 1;
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
    label.textContent = "Step 3 · Distance & altitude limits";

    const helper = document.createElement("div");
    helper.className = "field-helper";
    helper.textContent =
      "Set minimum and maximum distance, and maximum ascent per day. Leave empty to see all options.";

    root.appendChild(label);
    root.appendChild(helper);

    // Min distance per day
    const minDistanceGroup = document.createElement("div");
    minDistanceGroup.className = "stack-sm";
    minDistanceGroup.style.marginTop = "0.75rem";

    const minDistanceLabel = document.createElement("label");
    minDistanceLabel.className = "field-label";
    minDistanceLabel.textContent = "Minimum distance per day (km)";
    minDistanceLabel.setAttribute("for", "min-distance");

    const minDistanceInput = document.createElement("input");
    minDistanceInput.id = "min-distance";
    minDistanceInput.type = "number";
    minDistanceInput.min = "0";
    minDistanceInput.step = "1";
    minDistanceInput.placeholder = "e.g., 8 (leave empty for no minimum)";
    minDistanceInput.className = "input";
    minDistanceInput.value = state.minDistancePerDay;
    minDistanceInput.addEventListener("input", (e) => {
      state.minDistancePerDay = e.target.value;
    });

    minDistanceGroup.appendChild(minDistanceLabel);
    minDistanceGroup.appendChild(minDistanceInput);

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
    });

    altitudeGroup.appendChild(altitudeLabel);
    altitudeGroup.appendChild(altitudeInput);

    if (state.errors.maxAltitude) {
      const error = document.createElement("div");
      error.className = "error-text";
      error.textContent = state.errors.maxAltitude;
      altitudeGroup.appendChild(error);
    }

    root.appendChild(minDistanceGroup);
    root.appendChild(distanceGroup);
    root.appendChild(altitudeGroup);

    // Buttons
    const buttons = document.createElement("div");
    buttons.className = "button-row";

    const back = document.createElement("button");
    back.className = "btn";
    back.type = "button";
    back.innerHTML = '<span>←</span><span>Back</span>';
    back.addEventListener("click", () => {
      state.currentStep = state.currentStep - 1;
      renderAppShell();
    });

    const next = document.createElement("button");
    next.className = "btn btn-primary";
    next.type = "button";
    next.innerHTML = '<span>Next</span><span>→</span>';
    next.addEventListener("click", () => {
      state.currentStep = state.currentStep + 1;
      renderAppShell();
    });

    buttons.appendChild(back);
    buttons.appendChild(next);
    root.appendChild(buttons);

    return root;
  }

  function createStepHutExclusion() {
    const root = document.createElement("div");
    root.className = "stack-sm";

    const label = document.createElement("div");
    label.className = "field-label";
    label.textContent = "Step 4 · Exclude huts";

    // Show selected dates prominently
    let dateContext = "";
    if (state.startDate && state.numDays) {
      const startDate = new Date(state.startDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + parseInt(state.numDays, 10) - 1);
      dateContext = `Checking availability for: ${formatShortDate(state.startDate)} → ${formatShortDate(endDate.toISOString().slice(0, 10))}`;
    }

    const dateInfo = document.createElement("div");
    dateInfo.className = "hut-exclusion-dates";
    if (dateContext) {
      dateInfo.innerHTML = `<span class="accent-text">📅 ${dateContext}</span>`;
    } else {
      dateInfo.innerHTML = '<span class="muted-text">Select dates in Step 1 to see date context</span>';
    }

    const helper = document.createElement("div");
    helper.className = "field-helper";
    helper.innerHTML = `
      <p style="margin: 0 0 0.5rem 0;">Click "Check Availability" for each hut to verify bookings, then exclude any that are fully booked.</p>
      <p style="margin: 0; font-size: 0.85rem;" class="muted-text">💡 Tip: Open booking links in new tabs, check availability, then return here to exclude booked huts.</p>
    `;

    root.appendChild(label);
    root.appendChild(dateInfo);
    root.appendChild(helper);

    // Excluded huts
    const hutsGroup = document.createElement("div");
    hutsGroup.className = "stack-sm";
    hutsGroup.style.marginTop = "0.75rem";

    const hutsCheckboxes = document.createElement("div");
    hutsCheckboxes.className = "huts-checkboxes";

    // Get all unique hut names from stages
    const allHuts = ALTA_VIA_STAGES.map((stage) => stage.hut).filter(
      (hut) => hut !== "End in valley"
    );
    const uniqueHuts = [...new Set(allHuts)];

    uniqueHuts.forEach((hut) => {
      const isExcluded = state.excludedHuts.includes(hut);
      const bookingInfo = getHutBookingInfo(hut);
      
      // Create hut card container
      const hutCard = document.createElement("div");
      hutCard.className = `hut-exclusion-card ${isExcluded ? "hut-exclusion-card-excluded" : ""}`;

      // Checkbox and label container (hut title)
      const checkboxContainer = document.createElement("label");
      checkboxContainer.className = `hut-checkbox ${isExcluded ? "hut-checkbox-selected" : ""}`;
      checkboxContainer.setAttribute("for", `hut-${hut.replace(/\s+/g, "-")}`);

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `hut-${hut.replace(/\s+/g, "-")}`;
      checkbox.value = hut;
      checkbox.checked = isExcluded;
      checkbox.className = "hut-checkbox-input";
      checkbox.addEventListener("change", (e) => {
        if (e.target.checked) {
          if (!state.excludedHuts.includes(hut)) {
            state.excludedHuts.push(hut);
          }
        } else {
          state.excludedHuts = state.excludedHuts.filter((h) => h !== hut);
        }
        // Update visual state
        if (e.target.checked) {
          checkboxContainer.classList.add("hut-checkbox-selected");
          hutCard.classList.add("hut-exclusion-card-excluded");
        } else {
          checkboxContainer.classList.remove("hut-checkbox-selected");
          hutCard.classList.remove("hut-exclusion-card-excluded");
        }
      });

      const checkboxLabel = document.createElement("span");
      checkboxLabel.className = "hut-checkbox-label";
      checkboxLabel.textContent = hut;

      checkboxContainer.appendChild(checkbox);
      checkboxContainer.appendChild(checkboxLabel);

      // Add checkbox/title to card
      hutCard.appendChild(checkboxContainer);

      // Booking link button (below the title)
      const bookingButton = document.createElement("a");
      bookingButton.className = "hut-booking-link";
      bookingButton.target = "_blank";
      bookingButton.rel = "noopener noreferrer";
      bookingButton.href = bookingInfo?.bookingUrl || bookingInfo?.website || "#";
      
      if (!bookingInfo) {
        bookingButton.style.opacity = "0.5";
        bookingButton.style.pointerEvents = "none";
        bookingButton.title = "Booking link not available";
      }
      
      bookingButton.innerHTML = '<span>🔗</span><span>Check Availability</span>';
      bookingButton.addEventListener("click", (e) => {
        // Don't prevent default - let it open the link
        // But we could add analytics or tracking here in the future
      });

      // Add booking button below the title
      hutCard.appendChild(bookingButton);

      // Add note if available
      if (bookingInfo?.note) {
        const note = document.createElement("div");
        note.className = "hut-booking-note";
        note.textContent = bookingInfo.note;
        hutCard.appendChild(note);
      }

      hutsCheckboxes.appendChild(hutCard);
    });

    hutsGroup.appendChild(hutsCheckboxes);
    root.appendChild(hutsGroup);

    // Buttons
    const buttons = document.createElement("div");
    buttons.className = "button-row";

    const back = document.createElement("button");
    back.className = "btn";
    back.type = "button";
    back.innerHTML = '<span>←</span><span>Back</span>';
    back.addEventListener("click", () => {
      state.currentStep = state.currentStep - 1;
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
      const filtered = applyFilters(allCombos, {
        minDistancePerDay: state.minDistancePerDay,
        maxDistancePerDay: state.maxDistancePerDay,
        maxAltitudePerDay: state.maxAltitudePerDay,
        excludedHuts: state.excludedHuts,
      });

      state.allCombinations = filtered.slice(0, 10);
      state.selectedCombinationIndex = null;
      state.carouselIndex = 0; // Reset carousel to first option
      state.itinerary = [];
      state.currentStep = 5; // Move to route selection
      renderAppShell();
    });

    buttons.appendChild(back);
    buttons.appendChild(next);
    root.appendChild(buttons);

    return root;
  }

  /**
   * Applies filters and regenerates combinations
   * Uses imported applyFilters utility function
   */
  function applyFiltersAndRegenerate() {
    const numDays = parseInt(state.numDays, 10);
    if (Number.isNaN(numDays)) return;

    // Generate all combinations
    const allCombos = generateAllCombinations(numDays);

    // Apply filters using imported utility
    const filtered = applyFilters(allCombos, {
      minDistancePerDay: state.minDistancePerDay,
      maxDistancePerDay: state.maxDistancePerDay,
      maxAltitudePerDay: state.maxAltitudePerDay,
      excludedHuts: state.excludedHuts,
    });

    // Limit to first 10 and update
    state.allCombinations = filtered.slice(0, 10);
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

    // Add "Generate Hiking Plan" button
    const actionButton = document.createElement("button");
    actionButton.className = "btn btn-primary";
    actionButton.type = "button";
    actionButton.style.width = "100%";
    actionButton.style.marginTop = "1.5rem";
    actionButton.innerHTML = '<span>🎒 Generate Hiking Plan</span><span>→</span>';
    actionButton.addEventListener("click", () => {
      state.currentView = "plan";
      renderAppShell();
    });

    stack.appendChild(actionButton);
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
  // Hiking Plan View (Full Page)
  // ---------------------------------------------------------------------------

  function createHikingPlanView() {
    const main = document.createElement("main");
    main.className = "hiking-plan-view";

    const container = document.createElement("div");
    container.className = "hiking-plan-container";

    // Header with back button
    const header = document.createElement("div");
    header.className = "hiking-plan-header";

    const backButton = document.createElement("button");
    backButton.className = "btn";
    backButton.type = "button";
    backButton.innerHTML = '<span>←</span><span>Back to Planner</span>';
    backButton.addEventListener("click", () => {
      state.currentView = "wizard";
      renderAppShell();
    });

    const title = document.createElement("h1");
    title.className = "hiking-plan-title";
    title.textContent = "Your Alta Via 1 Hiking Plan";

    header.appendChild(backButton);
    header.appendChild(title);
    container.appendChild(header);

    // Plan summary
    const summary = createPlanSummary();
    container.appendChild(summary);

    // Tabs for different sections
    const tabsContainer = createPlanTabs();
    container.appendChild(tabsContainer);

    main.appendChild(container);
    return main;
  }

  function createPlanSummary() {
    const summary = document.createElement("div");
    summary.className = "plan-summary";

    const firstDay = state.itinerary[0];
    const lastDay = state.itinerary[state.itinerary.length - 1];

    const dates = document.createElement("div");
    dates.className = "plan-summary-dates";
    dates.textContent = `${formatShortDate(firstDay.date)} → ${formatShortDate(
      lastDay.date
    )} · ${state.itinerary.length} hiking days`;

    const stats = document.createElement("div");
    stats.className = "plan-summary-stats";

    const totalDistance = state.itinerary.reduce(
      (sum, day) => sum + day.stage.distanceKm,
      0
    );
    const totalAscent = state.itinerary.reduce(
      (sum, day) => sum + day.stage.ascentM,
      0
    );

    const distanceStat = document.createElement("div");
    distanceStat.className = "plan-stat";
    distanceStat.innerHTML = `<span class="plan-stat-value">${totalDistance.toFixed(1)}</span><span class="plan-stat-label">km total</span>`;

    const ascentStat = document.createElement("div");
    ascentStat.className = "plan-stat";
    ascentStat.innerHTML = `<span class="plan-stat-value">${totalAscent}</span><span class="plan-stat-label">m ascent</span>`;

    const daysStat = document.createElement("div");
    daysStat.className = "plan-stat";
    daysStat.innerHTML = `<span class="plan-stat-value">${state.itinerary.length}</span><span class="plan-stat-label">days</span>`;

    stats.appendChild(distanceStat);
    stats.appendChild(ascentStat);
    stats.appendChild(daysStat);

    summary.appendChild(dates);
    summary.appendChild(stats);

    return summary;
  }

  function createPlanTabs() {
    const tabsWrapper = document.createElement("div");
    tabsWrapper.className = "plan-tabs-wrapper";

    // Tab navigation
    const tabsNav = document.createElement("div");
    tabsNav.className = "plan-tabs-nav";

    const tabButtons = [
      { id: "overview", label: "Overview" },
      { id: "navigation", label: "Navigation" },
      { id: "huts", label: "Huts & Booking" },
      { id: "preparation", label: "Preparation" },
      { id: "tips", label: "Tips & Points of Interest" },
    ];

    let activeTab = "overview";

    tabButtons.forEach((tab) => {
      const button = document.createElement("button");
      button.className = `plan-tab-button ${activeTab === tab.id ? "active" : ""}`;
      button.textContent = tab.label;
      button.addEventListener("click", () => {
        activeTab = tab.id;
        renderPlanTabContent(tabsContent, activeTab);
        // Update active state
        tabsNav.querySelectorAll(".plan-tab-button").forEach((btn) => {
          btn.classList.remove("active");
        });
        button.classList.add("active");
      });
      tabsNav.appendChild(button);
    });

    // Tab content area
    const tabsContent = document.createElement("div");
    tabsContent.className = "plan-tabs-content";

    // Initial content
    renderPlanTabContent(tabsContent, activeTab);

    tabsWrapper.appendChild(tabsNav);
    tabsWrapper.appendChild(tabsContent);

    return tabsWrapper;
  }

  function renderPlanTabContent(container, tabId) {
    container.innerHTML = "";

    switch (tabId) {
      case "overview":
        container.appendChild(createOverviewTab());
        break;
      case "navigation":
        container.appendChild(createNavigationTab());
        break;
      case "huts":
        container.appendChild(createHutsTab());
        break;
      case "preparation":
        container.appendChild(createPreparationTab());
        break;
      case "tips":
        container.appendChild(createTipsTab());
        break;
    }
  }

  function createOverviewTab() {
    const content = document.createElement("div");
    content.className = "plan-tab-content";

    const heading = document.createElement("h2");
    heading.className = "plan-section-heading";
    heading.textContent = "Day-by-Day Itinerary";

    const itineraryList = document.createElement("div");
    itineraryList.className = "plan-itinerary-list";

    state.itinerary.forEach((day) => {
      const dayCard = document.createElement("div");
      dayCard.className = "plan-day-card";

      const dayHeader = document.createElement("div");
      dayHeader.className = "plan-day-header";

      const dayTitle = document.createElement("div");
      dayTitle.className = "plan-day-title";
      dayTitle.textContent = `Day ${day.dayIndex} · ${formatShortDate(day.date)}`;

      const dayMeta = document.createElement("div");
      dayMeta.className = "plan-day-meta";
      dayMeta.textContent = `${day.stage.distanceKm} km · ${day.stage.ascentM} m ascent`;

      dayHeader.appendChild(dayTitle);
      dayHeader.appendChild(dayMeta);

      const route = document.createElement("div");
      route.className = "plan-day-route";
      if (day.allStages && day.allStages.length > 1) {
        const stagesList = day.allStages
          .map((s, idx) => (idx === 0 ? s.from : s.to))
          .join(" → ");
        route.textContent = stagesList;
      } else {
        route.textContent = `${day.stage.from} → ${day.stage.to}`;
      }

      const hut = document.createElement("div");
      hut.className = "plan-day-hut";
      if (day.stage.hut === "End in valley") {
        hut.textContent = "Finish in the valley (no hut booking needed)";
      } else {
        hut.textContent = `Overnight: ${day.stage.hut}`;
      }

      dayCard.appendChild(dayHeader);
      dayCard.appendChild(route);
      dayCard.appendChild(hut);

      itineraryList.appendChild(dayCard);
    });

    content.appendChild(heading);
    content.appendChild(itineraryList);

    return content;
  }

  function createNavigationTab() {
    const content = document.createElement("div");
    content.className = "plan-tab-content";

    const heading = document.createElement("h2");
    heading.className = "plan-section-heading";
    heading.textContent = "Navigation & Maps";

    const placeholder = document.createElement("div");
    placeholder.className = "plan-placeholder";
    placeholder.innerHTML = `
      <p>🚧 Coming soon: Interactive map, GPX download, and elevation profiles</p>
      <p class="muted-text">This section will include:</p>
      <ul>
        <li>Interactive route map</li>
        <li>GPX file download</li>
        <li>Elevation profile charts</li>
        <li>Time estimates</li>
      </ul>
    `;

    content.appendChild(heading);
    content.appendChild(placeholder);

    return content;
  }

  function createHutsTab() {
    const content = document.createElement("div");
    content.className = "plan-tab-content";

    const heading = document.createElement("h2");
    heading.className = "plan-section-heading";
    heading.textContent = "Huts & Booking Information";

    const itineraryList = document.createElement("div");
    itineraryList.className = "plan-itinerary-list";

    state.itinerary.forEach((day) => {
      const dayCard = document.createElement("div");
      dayCard.className = "plan-day-card";

      // Day header
      const dayHeader = document.createElement("div");
      dayHeader.className = "plan-day-header";

      const dayTitle = document.createElement("div");
      dayTitle.className = "plan-day-title";
      dayTitle.textContent = `Day ${day.dayIndex} · ${formatShortDate(day.date)}`;

      const dayMeta = document.createElement("div");
      dayMeta.className = "plan-day-meta";
      dayMeta.textContent = `${day.stage.distanceKm} km · ${day.stage.ascentM} m ascent`;

      dayHeader.appendChild(dayTitle);
      dayHeader.appendChild(dayMeta);

      // Hut information
      if (day.stage.hut === "End in valley") {
        const finishNote = document.createElement("div");
        finishNote.className = "hut-info-section";
        finishNote.innerHTML = `
          <div class="hut-name">Finish in the valley</div>
          <div class="hut-note">No hut booking needed for this day.</div>
        `;
        dayCard.appendChild(dayHeader);
        dayCard.appendChild(finishNote);
      } else {
        const hutDetails = getHutDetails(day.stage.hut);
        
        // Hut name and basic info
        const hutNameSection = document.createElement("div");
        hutNameSection.className = "hut-info-section";
        
        const hutName = document.createElement("div");
        hutName.className = "hut-name";
        hutName.textContent = day.stage.hut;
        
        hutNameSection.appendChild(hutName);
        
        // Elevation and capacity (if available)
        if (hutDetails) {
          const hutBasicInfo = document.createElement("div");
          hutBasicInfo.className = "hut-basic-info";
          
          if (hutDetails.elevation) {
            const elevation = document.createElement("span");
            elevation.className = "hut-info-badge";
            elevation.textContent = `📍 ${hutDetails.elevation} m`;
            hutBasicInfo.appendChild(elevation);
          }
          
          if (hutDetails.capacity) {
            const capacity = document.createElement("span");
            capacity.className = "hut-info-badge";
            capacity.textContent = `👥 ${hutDetails.capacity} beds`;
            hutBasicInfo.appendChild(capacity);
          }
          
          if (hutBasicInfo.children.length > 0) {
            hutNameSection.appendChild(hutBasicInfo);
          }
        }
        
        dayCard.appendChild(dayHeader);
        dayCard.appendChild(hutNameSection);

        if (hutDetails) {
          // Check-in/Check-out times
          if (hutDetails.checkIn || hutDetails.checkOut) {
            const timesSection = document.createElement("div");
            timesSection.className = "hut-info-section";
            
            const timesTitle = document.createElement("div");
            timesTitle.className = "hut-section-title";
            timesTitle.textContent = "Arrival & Departure";
            
            const timesContent = document.createElement("div");
            timesContent.className = "hut-section-content";
            
            if (hutDetails.checkIn) {
              const checkIn = document.createElement("div");
              checkIn.className = "hut-time-item";
              checkIn.innerHTML = `<span class="hut-time-label">Check-in:</span> <span class="hut-time-value">${hutDetails.checkIn}</span>`;
              timesContent.appendChild(checkIn);
            }
            
            if (hutDetails.checkOut) {
              const checkOut = document.createElement("div");
              checkOut.className = "hut-time-item";
              checkOut.innerHTML = `<span class="hut-time-label">Check-out:</span> <span class="hut-time-value">${hutDetails.checkOut}</span>`;
              timesContent.appendChild(checkOut);
            }
            
            timesSection.appendChild(timesTitle);
            timesSection.appendChild(timesContent);
            dayCard.appendChild(timesSection);
          }

          // Facilities
          if (hutDetails.facilities) {
            const facilitiesSection = document.createElement("div");
            facilitiesSection.className = "hut-info-section";
            
            const facilitiesTitle = document.createElement("div");
            facilitiesTitle.className = "hut-section-title";
            facilitiesTitle.textContent = "Facilities";
            
            const facilitiesGrid = document.createElement("div");
            facilitiesGrid.className = "hut-facilities-grid";
            
            const facilityLabels = {
              showers: "🚿 Showers",
              wifi: "📶 WiFi",
              electricity: "⚡ Electricity",
              blankets: "🛏️ Blankets",
              towels: "🧺 Towels",
              restaurant: "🍽️ Restaurant",
              bar: "🍺 Bar",
            };
            
            Object.entries(facilityLabels).forEach(([key, label]) => {
              const hasFacility = hutDetails.facilities[key];
              const facilityItem = document.createElement("div");
              facilityItem.className = `hut-facility-item ${hasFacility ? "available" : "unavailable"}`;
              facilityItem.innerHTML = `
                <span class="hut-facility-icon">${hasFacility ? "✓" : "✗"}</span>
                <span class="hut-facility-label">${label}</span>
              `;
              facilitiesGrid.appendChild(facilityItem);
            });
            
            facilitiesSection.appendChild(facilitiesTitle);
            facilitiesSection.appendChild(facilitiesGrid);
            dayCard.appendChild(facilitiesSection);
          }

          // Meals
          if (hutDetails.meals) {
            const mealsSection = document.createElement("div");
            mealsSection.className = "hut-info-section";
            
            const mealsTitle = document.createElement("div");
            mealsTitle.className = "hut-section-title";
            mealsTitle.textContent = "Meals Available";
            
            const mealsList = document.createElement("div");
            mealsList.className = "hut-meals-list";
            
            const mealLabels = {
              breakfast: "☕ Breakfast",
              lunch: "🍽️ Lunch",
              dinner: "🍲 Dinner",
              packedLunch: "🥪 Packed Lunch",
            };
            
            Object.entries(mealLabels).forEach(([key, label]) => {
              if (hutDetails.meals[key]) {
                const mealItem = document.createElement("div");
                mealItem.className = "hut-meal-item";
                mealItem.textContent = label;
                mealsList.appendChild(mealItem);
              }
            });
            
            if (mealsList.children.length > 0) {
              mealsSection.appendChild(mealsTitle);
              mealsSection.appendChild(mealsList);
              dayCard.appendChild(mealsSection);
            }
          }

          // Contact information
          if (hutDetails.contact) {
            const contactSection = document.createElement("div");
            contactSection.className = "hut-info-section";
            
            const contactTitle = document.createElement("div");
            contactTitle.className = "hut-section-title";
            contactTitle.textContent = "Contact";
            
            const contactList = document.createElement("div");
            contactList.className = "hut-contact-list";
            
            if (hutDetails.contact.phone) {
              const phone = document.createElement("a");
              phone.className = "hut-contact-link";
              phone.href = `tel:${hutDetails.contact.phone}`;
              phone.textContent = `📞 ${hutDetails.contact.phone}`;
              contactList.appendChild(phone);
            }
            
            if (hutDetails.contact.email) {
              const email = document.createElement("a");
              email.className = "hut-contact-link";
              email.href = `mailto:${hutDetails.contact.email}`;
              email.textContent = `✉️ ${hutDetails.contact.email}`;
              contactList.appendChild(email);
            }
            
            if (hutDetails.contact.website) {
              const website = document.createElement("a");
              website.className = "hut-contact-link";
              website.href = hutDetails.contact.website;
              website.target = "_blank";
              website.rel = "noopener noreferrer";
              website.textContent = `🌐 Website`;
              contactList.appendChild(website);
            }
            
            if (contactList.children.length > 0) {
              contactSection.appendChild(contactTitle);
              contactSection.appendChild(contactList);
              dayCard.appendChild(contactSection);
            }
          }

          // Booking button
          if (hutDetails.bookingUrl) {
            const bookingSection = document.createElement("div");
            bookingSection.className = "hut-info-section";
            
            const bookingButton = document.createElement("a");
            bookingButton.className = "hut-booking-button";
            bookingButton.href = hutDetails.bookingUrl;
            bookingButton.target = "_blank";
            bookingButton.rel = "noopener noreferrer";
            bookingButton.innerHTML = '<span>🔗</span><span>Book Now</span>';
            
            bookingSection.appendChild(bookingButton);
            dayCard.appendChild(bookingSection);
          } else {
            // Show message if no online booking
            const bookingSection = document.createElement("div");
            bookingSection.className = "hut-info-section";
            
            const bookingNote = document.createElement("div");
            bookingNote.className = "hut-booking-note";
            bookingNote.textContent = "⚠️ No online booking available. Please contact by phone.";
            
            bookingSection.appendChild(bookingNote);
            dayCard.appendChild(bookingSection);
          }

          // Notes
          if (hutDetails.notes) {
            const notesSection = document.createElement("div");
            notesSection.className = "hut-info-section";
            
            const notes = document.createElement("div");
            notes.className = "hut-notes";
            notes.innerHTML = `<span class="hut-notes-icon">💡</span><span>${hutDetails.notes}</span>`;
            
            notesSection.appendChild(notes);
            dayCard.appendChild(notesSection);
          }
        } else {
          // No details available
          const noDetails = document.createElement("div");
          noDetails.className = "hut-info-section";
          noDetails.innerHTML = `
            <div class="hut-note muted-text">Detailed information not available for this hut.</div>
          `;
          dayCard.appendChild(noDetails);
        }
      }

      itineraryList.appendChild(dayCard);
    });

    content.appendChild(heading);
    content.appendChild(itineraryList);

    return content;
  }

  function createPreparationTab() {
    const content = document.createElement("div");
    content.className = "plan-tab-content";

    const heading = document.createElement("h2");
    heading.className = "plan-section-heading";
    heading.textContent = "Preparation & Supplies";

    const placeholder = document.createElement("div");
    placeholder.className = "plan-placeholder";
    placeholder.innerHTML = `
      <p>🚧 Coming soon: Packing lists and preparation guides</p>
      <p class="muted-text">This section will include:</p>
      <ul>
        <li>Dynamic packing list generator</li>
        <li>Food planning suggestions</li>
        <li>Weather-based recommendations</li>
        <li>Essential gear checklist</li>
      </ul>
    `;

    content.appendChild(heading);
    content.appendChild(placeholder);

    return content;
  }

  function createTipsTab() {
    const content = document.createElement("div");
    content.className = "plan-tab-content";

    const heading = document.createElement("h2");
    heading.className = "plan-section-heading";
    heading.textContent = "Tips & Points of Interest";

    const placeholder = document.createElement("div");
    placeholder.className = "plan-placeholder";
    placeholder.innerHTML = `
      <p>🚧 Coming soon: Scenic detours and hiking tips</p>
      <p class="muted-text">This section will include:</p>
      <ul>
        <li>Scenic viewpoints and detours</li>
        <li>Photography tips</li>
        <li>Historical context</li>
        <li>Local tips and recommendations</li>
      </ul>
    `;

    content.appendChild(heading);
    content.appendChild(placeholder);

    return content;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Utility functions are now imported from separate modules
  // - generateAllCombinations: utils/route-generator.js
  // - buildItineraryFromCombination: utils/date-helpers.js
  // - formatShortDate: utils/date-helpers.js
  // - applyFilters: utils/filters.js
  // ---------------------------------------------------------------------------

  // Boot the app once the DOM is ready.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderAppShell);
  } else {
    renderAppShell();
  }
})();

