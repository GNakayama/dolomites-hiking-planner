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
import { getStagePointsOfInterest } from './data/points-of-interest.js';
import { generatePackingList, getFoodPlanning, getWeatherRecommendations, getEssentialGear } from './data/preparation-data.js';
import { generateAllCombinations } from './utils/route-generator.js';
import { applyFilters } from './utils/filters.js';
import { formatShortDate, buildItineraryFromCombination } from './utils/date-helpers.js';
import { generateGPX, downloadGPX } from './utils/gpx-generator.js';

(() => {
  // ---------------------------------------------------------------------------
  // Data and utilities are now imported from separate modules
  // See: data/alta-via-1.js, utils/route-generator.js, utils/filters.js, utils/date-helpers.js
  // ---------------------------------------------------------------------------

  // State persistence key
  const STATE_STORAGE_KEY = "alta-via-1-planner-state";
  const DEV_MODE_KEY = "alta-via-1-dev-mode";

  /**
   * Loads state from localStorage
   */
  function loadStateFromStorage() {
    try {
      const saved = localStorage.getItem(STATE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Don't restore errors
        parsed.errors = {
          startDate: "",
          numDays: "",
          maxDistance: "",
          maxAltitude: "",
        };
        return parsed;
      }
    } catch (e) {
      console.warn("Failed to load state from localStorage:", e);
    }
    return null;
  }

  /**
   * Saves state to localStorage
   */
  function saveStateToStorage() {
    try {
      // Don't save large arrays (combinations, itinerary) to keep storage small
      const stateToSave = {
        currentView: state.currentView,
        currentStep: state.currentStep,
        startDate: state.startDate,
        numDays: state.numDays,
        minDistancePerDay: state.minDistancePerDay,
        maxDistancePerDay: state.maxDistancePerDay,
        maxAltitudePerDay: state.maxAltitudePerDay,
        includedHuts: state.includedHuts,
        hutAvailability: state.hutAvailability,
        selectedCombinationIndex: state.selectedCombinationIndex,
        carouselIndex: state.carouselIndex,
      };
      localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn("Failed to save state to localStorage:", e);
    }
  }

  /**
   * Dev mode: Auto-fills wizard with sample data for quick testing
   */
  function enableDevMode() {
    const today = new Date();
    const startDate = today.toISOString().slice(0, 10);
    
    state.startDate = startDate;
    state.numDays = "6";
    state.currentStep = 5; // Jump to route selection
    
    // Generate combinations
    const allCombos = generateAllCombinations(6);
    state.allCombinations = allCombos.slice(0, 10);
    
    // Select first combination and build itinerary
    if (state.allCombinations.length > 0) {
      state.selectedCombinationIndex = 0;
      state.carouselIndex = 0;
      state.itinerary = buildItineraryFromCombination(startDate, state.allCombinations[0]);
    }
    
    saveStateToStorage();
    renderAppShell();
  }

  /**
   * Checks if dev mode should be enabled (URL parameter or localStorage)
   */
  function checkDevMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const hasDevParam = urlParams.has("dev");
    const savedDevMode = localStorage.getItem(DEV_MODE_KEY) === "true";
    
    if (hasDevParam || savedDevMode) {
      if (hasDevParam) {
        localStorage.setItem(DEV_MODE_KEY, "true");
      }
      return true;
    }
    return false;
  }

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
    includedHuts: [], // Array of hut names to include (empty = include all)
    hutAvailability: {}, // Object: { "Rifugio X": ["2024-07-01", "2024-07-02", ...] }
    errors: {
      startDate: "",
      numDays: "",
      maxDistance: "",
      maxAltitude: "",
      includedHuts: "",
    },
  };

  // Load state from localStorage on init
  const savedState = loadStateFromStorage();
  if (savedState) {
    Object.assign(state, savedState);
    
    // Regenerate combinations and itinerary if we have the data
    if (state.startDate && state.numDays) {
      const numDays = parseInt(state.numDays, 10);
      if (!Number.isNaN(numDays)) {
        // Regenerate combinations
        const allCombos = generateAllCombinations(numDays);
        const filtered = applyFilters(allCombos, {
          minDistancePerDay: state.minDistancePerDay,
          maxDistancePerDay: state.maxDistancePerDay,
          maxAltitudePerDay: state.maxAltitudePerDay,
          includedHuts: state.includedHuts,
        });
        state.allCombinations = filtered.slice(0, 10);
        
        // Restore selected combination if valid
        if (
          state.selectedCombinationIndex !== null &&
          state.selectedCombinationIndex < state.allCombinations.length
        ) {
          state.itinerary = buildItineraryFromCombination(
            state.startDate,
            state.allCombinations[state.selectedCombinationIndex]
          );
        }
      }
    }
  }

  // Check for dev mode (after loading saved state)
  if (checkDevMode()) {
    enableDevMode();
  }

  /**
   * Mounts the static app shell into the `#app-root` element.
   * We re-render the whole shell when state changes; the app is small enough
   * that this keeps the code straightforward and very easy to follow.
   */
  function renderAppShell() {
    const root = document.getElementById("app-root");
    if (!root) return;

    // Clean up any existing modals before re-rendering
    const existingModals = document.querySelectorAll('.hut-availability-modal');
    existingModals.forEach(modal => {
      if (modal._cleanup) {
        modal._cleanup();
      }
      modal.remove();
    });

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
      "Select huts",
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
      saveStateToStorage();
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
      saveStateToStorage();
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
      saveStateToStorage();
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
      saveStateToStorage();
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
      saveStateToStorage();
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
          saveStateToStorage();
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
          saveStateToStorage();
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
          saveStateToStorage();
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
      saveStateToStorage();
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
      saveStateToStorage();
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
      saveStateToStorage();
      renderAppShell();
    });

    const next = document.createElement("button");
    next.className = "btn btn-primary";
    next.type = "button";
    next.innerHTML = '<span>Next</span><span>→</span>';
    next.addEventListener("click", () => {
      state.currentStep = state.currentStep + 1;
      saveStateToStorage();
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
    label.textContent = "Step 4 · Select huts to include";

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
      <p style="margin: 0 0 0.5rem 0;">Click "Check Availability" for each hut to verify bookings. You can:</p>
      <ul style="margin: 0.5rem 0; padding-left: 1.5rem; font-size: 0.85rem;">
        <li>Check the boxes for huts you want to include in your route</li>
        <li>Set specific available dates for each hut (routes will only use huts on their available dates)</li>
        <li>Leave all boxes unchecked to allow all huts (default)</li>
      </ul>
      <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem;" class="muted-text">💡 Tip: Open booking links in new tabs, check availability, then return here to select huts and set dates.</p>
    `;

    root.appendChild(label);
    root.appendChild(dateInfo);
    root.appendChild(helper);

    // Included huts
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
      const isIncluded = state.includedHuts.includes(hut);
      const bookingInfo = getHutBookingInfo(hut);
      
      // Create hut card container
      const hutCard = document.createElement("div");
      hutCard.className = `hut-exclusion-card ${isIncluded ? "hut-exclusion-card-included" : ""}`;

      // Checkbox and label container (hut title)
      const checkboxContainer = document.createElement("label");
      checkboxContainer.className = `hut-checkbox ${isIncluded ? "hut-checkbox-selected" : ""}`;
      checkboxContainer.setAttribute("for", `hut-${hut.replace(/\s+/g, "-")}`);

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `hut-${hut.replace(/\s+/g, "-")}`;
      checkbox.value = hut;
      checkbox.checked = isIncluded;
      checkbox.className = "hut-checkbox-input";
      checkbox.addEventListener("change", (e) => {
        if (e.target.checked) {
          if (!state.includedHuts.includes(hut)) {
            state.includedHuts.push(hut);
          }
        } else {
          state.includedHuts = state.includedHuts.filter((h) => h !== hut);
        }
        // Clear validation error when huts change
        state.errors.includedHuts = "";
        // Update visual state
        if (e.target.checked) {
          checkboxContainer.classList.add("hut-checkbox-selected");
          hutCard.classList.add("hut-exclusion-card-included");
        } else {
          checkboxContainer.classList.remove("hut-checkbox-selected");
          hutCard.classList.remove("hut-exclusion-card-included");
        }
        saveStateToStorage();
        renderAppShell();
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

      // Availability dates section
      const availabilitySection = document.createElement("div");
      availabilitySection.className = "hut-availability-section";

      const availabilityLabel = document.createElement("div");
      availabilityLabel.className = "hut-availability-label";
      availabilityLabel.textContent = "Set available dates (leave empty if always available):";

      // Button to open calendar modal
      const calendarButton = document.createElement("button");
      calendarButton.type = "button";
      calendarButton.className = "btn hut-availability-calendar-btn";
      
      const currentDates = state.hutAvailability[hut] || [];
      if (currentDates.length > 0) {
        calendarButton.innerHTML = `<span>📅</span><span>${currentDates.length} date${currentDates.length === 1 ? '' : 's'} selected</span>`;
      } else {
        calendarButton.innerHTML = '<span>📅</span><span>Select dates</span>';
      }

      // Create modal for calendar
      const modal = document.createElement("div");
      modal.className = "hut-availability-modal";
      modal.style.display = "none";

      const modalOverlay = document.createElement("div");
      modalOverlay.className = "hut-availability-modal-overlay";
      modalOverlay.addEventListener("click", () => {
        modal.style.display = "none";
      });

      const modalContent = document.createElement("div");
      modalContent.className = "hut-availability-modal-content";
      modalContent.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent closing when clicking inside modal
      });

      // Modal header
      const modalHeader = document.createElement("div");
      modalHeader.className = "hut-availability-modal-header";
      const modalTitle = document.createElement("h3");
      modalTitle.textContent = `Set availability: ${hut}`;
      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "hut-availability-modal-close";
      closeButton.innerHTML = "×";
      closeButton.addEventListener("click", () => {
        modal.style.display = "none";
      });
      modalHeader.appendChild(modalTitle);
      modalHeader.appendChild(closeButton);

      // Calendar grid
      const calendarContainer = document.createElement("div");
      calendarContainer.className = "hut-availability-calendar";

      // Function to update button text
      const updateButton = () => {
        const dates = state.hutAvailability[hut] || [];
        if (dates.length > 0) {
          calendarButton.innerHTML = `<span>📅</span><span>${dates.length} date${dates.length === 1 ? '' : 's'} selected</span>`;
        } else {
          calendarButton.innerHTML = '<span>📅</span><span>Select dates</span>';
        }
      };

      // Function to update calendar display (will be defined inside if block)
      let updateCalendar = () => {};

      if (state.startDate && state.numDays) {
        // Generate all dates in the trip range
        const [startYear, startMonth, startDay] = state.startDate.split('-').map(Number);
        const numDays = parseInt(state.numDays, 10);

        // Create calendar grid
        const calendarGrid = document.createElement("div");
        calendarGrid.className = "hut-availability-calendar-grid";

        // Add weekday headers
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        weekdays.forEach(day => {
          const header = document.createElement("div");
          header.className = "hut-availability-calendar-weekday";
          header.textContent = day;
          calendarGrid.appendChild(header);
        });

        // Calculate first day of week for the start date
        const startDateObj = new Date(Date.UTC(startYear, startMonth - 1, startDay));
        const firstDayOfWeek = startDateObj.getUTCDay();

        // Add empty cells before start date to align with weekday headers
        for (let i = 0; i < firstDayOfWeek; i++) {
          const emptyCell = document.createElement("div");
          emptyCell.className = "hut-availability-calendar-cell hut-availability-calendar-cell-empty";
          calendarGrid.appendChild(emptyCell);
        }

        // Show summary of selected dates
        const summary = document.createElement("div");
        summary.className = "hut-availability-summary";

        // Function to update calendar display
        updateCalendar = () => {
          const dates = state.hutAvailability[hut] || [];
          // Update all cells
          calendarGrid.querySelectorAll('.hut-availability-calendar-cell:not(.hut-availability-calendar-cell-empty)').forEach(cell => {
            const dateString = cell.getAttribute("data-date");
            if (dates.includes(dateString)) {
              cell.classList.add('hut-availability-calendar-cell-selected');
            } else {
              cell.classList.remove('hut-availability-calendar-cell-selected');
            }
          });
          // Update summary
          if (dates.length > 0) {
            summary.textContent = `${dates.length} date${dates.length === 1 ? '' : 's'} selected`;
            summary.className = "hut-availability-summary";
          } else {
            summary.textContent = "No dates selected (assumed always available)";
            summary.className = "hut-availability-summary hut-availability-summary-empty";
          }
          // Update button
          updateButton();
        };

        // Add date cells
        for (let i = 0; i < numDays; i++) {
          const dateObj = new Date(Date.UTC(startYear, startMonth - 1, startDay + i));
          const dateString = dateObj.toISOString().slice(0, 10);
          const dayOfMonth = dateObj.getUTCDate();
          const isSelected = currentDates.includes(dateString);

          const dateCell = document.createElement("button");
          dateCell.type = "button";
          dateCell.className = `hut-availability-calendar-cell ${isSelected ? 'hut-availability-calendar-cell-selected' : ''}`;
          dateCell.textContent = dayOfMonth;
          dateCell.setAttribute("data-date", dateString);
          dateCell.setAttribute("title", formatShortDate(dateString));

          dateCell.addEventListener("click", () => {
            // Initialize array if it doesn't exist
            if (!state.hutAvailability[hut]) {
              state.hutAvailability[hut] = [];
            }

            // Toggle date
            if (isSelected) {
              state.hutAvailability[hut] = state.hutAvailability[hut].filter(d => d !== dateString);
              if (state.hutAvailability[hut].length === 0) {
                delete state.hutAvailability[hut];
              }
            } else {
              if (!state.hutAvailability[hut].includes(dateString)) {
                state.hutAvailability[hut].push(dateString);
                state.hutAvailability[hut].sort(); // Keep sorted
              }
            }
            saveStateToStorage();
            updateCalendar();
          });

          calendarGrid.appendChild(dateCell);
        }

        calendarContainer.appendChild(calendarGrid);
        calendarContainer.appendChild(summary);
        
        // Initialize summary
        updateCalendar();
      } else {
        const noDatesMsg = document.createElement("div");
        noDatesMsg.className = "hut-availability-no-dates";
        noDatesMsg.textContent = "Select dates in Step 1 to set availability";
        calendarContainer.appendChild(noDatesMsg);
      }

      // Open modal on button click
      calendarButton.addEventListener("click", () => {
        modal.style.display = "flex";
      });

      // Display selected dates as pills
      const datesList = document.createElement("div");
      datesList.className = "hut-availability-dates-list";

      const updateDatesList = () => {
        datesList.innerHTML = ""; // Clear existing
        const dates = state.hutAvailability[hut] || [];
        
        if (dates.length > 0) {
          dates.forEach((date) => {
            const dateTag = document.createElement("div");
            dateTag.className = "hut-availability-date-tag";
            dateTag.innerHTML = `
              <span>${formatShortDate(date)}</span>
              <button type="button" class="hut-availability-remove-btn" data-date="${date}">×</button>
            `;
            
            const removeBtn = dateTag.querySelector(".hut-availability-remove-btn");
            removeBtn.addEventListener("click", (e) => {
              e.stopPropagation(); // Prevent any bubbling
              // Remove date
              state.hutAvailability[hut] = state.hutAvailability[hut].filter(d => d !== date);
              if (state.hutAvailability[hut].length === 0) {
                delete state.hutAvailability[hut];
              }
              saveStateToStorage();
              // Update calendar in modal (if it exists)
              updateCalendar();
              // Update dates list
              updateDatesList();
              // Update button
              updateButton();
            });
            
            datesList.appendChild(dateTag);
          });
        }
      };

      // Initial render of dates list
      updateDatesList();

      // Wrap updateCalendar to also update dates list
      const originalUpdateCalendar = updateCalendar;
      updateCalendar = () => {
        originalUpdateCalendar();
        updateDatesList();
        updateButton();
      };

      // Assemble modal
      modalContent.appendChild(modalHeader);
      modalContent.appendChild(calendarContainer);
      modal.appendChild(modalOverlay);
      modal.appendChild(modalContent);

      // Close on Escape key
      const handleEscape = (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
          modal.style.display = 'none';
        }
      };
      document.addEventListener('keydown', handleEscape);

      // Store cleanup function on modal
      modal._cleanup = () => {
        document.removeEventListener('keydown', handleEscape);
      };

      // Add to document body
      document.body.appendChild(modal);

      availabilitySection.appendChild(availabilityLabel);
      availabilitySection.appendChild(calendarButton);
      availabilitySection.appendChild(datesList);
      hutCard.appendChild(availabilitySection);

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
    
    // Show validation error if present
    if (state.errors.includedHuts) {
      const error = document.createElement("div");
      error.className = "error-text";
      error.textContent = state.errors.includedHuts;
      hutsGroup.appendChild(error);
    }
    
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
      saveStateToStorage();
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

      // Validate: if huts are selected, must have at least as many huts as days
      state.errors.includedHuts = "";
      if (state.includedHuts && state.includedHuts.length > 0) {
        if (state.includedHuts.length < parsed) {
          state.errors.includedHuts = `You selected ${state.includedHuts.length} hut${state.includedHuts.length === 1 ? '' : 's'}, but your trip is ${parsed} day${parsed === 1 ? '' : 's'}. Please select at least ${parsed} hut${parsed === 1 ? '' : 's'} or leave all unchecked to allow all huts.`;
          saveStateToStorage();
          renderAppShell();
          return;
        }
      }

      // Generate all possible hut combinations for the selected number of days
      // Apply filters and limit to first 10
      const allCombos = generateAllCombinations(parsed);
      const filtered = applyFilters(allCombos, {
        minDistancePerDay: state.minDistancePerDay,
        maxDistancePerDay: state.maxDistancePerDay,
        maxAltitudePerDay: state.maxAltitudePerDay,
        includedHuts: state.includedHuts,
        hutAvailability: state.hutAvailability,
        startDate: state.startDate,
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
        includedHuts: state.includedHuts,
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

    saveStateToStorage();
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
      saveStateToStorage();
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
      saveStateToStorage();
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
      { id: "commuting", label: "Commuting" },
      // { id: "tips", label: "Tips & Points of Interest" }, // Disabled for now
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
      case "commuting":
        container.appendChild(createCommutingTab());
        break;
      // case "tips":
      //   container.appendChild(createTipsTab());
      //   break;
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

    // Action buttons
    const actionsSection = document.createElement("div");
    actionsSection.className = "navigation-actions";

    const downloadGPXButton = document.createElement("button");
    downloadGPXButton.className = "btn btn-primary navigation-action-btn";
    downloadGPXButton.innerHTML = '<span>📥</span><span>Download GPX File</span>';
    downloadGPXButton.addEventListener("click", () => {
      const gpxContent = generateGPX(state.itinerary, state.startDate);
      const filename = `alta-via-1-${state.startDate.replace(/-/g, '')}.gpx`;
      downloadGPX(gpxContent, filename);
    });

    actionsSection.appendChild(downloadGPXButton);
    content.appendChild(heading);
    content.appendChild(actionsSection);

    // Time estimates section
    const timeSection = document.createElement("div");
    timeSection.className = "navigation-section";

    const timeTitle = document.createElement("h3");
    timeTitle.className = "navigation-section-title";
    timeTitle.textContent = "⏱️ Estimated Hiking Times";

    const timeList = document.createElement("div");
    timeList.className = "time-estimates-list";

    state.itinerary.forEach((day) => {
      const timeCard = document.createElement("div");
      timeCard.className = "time-estimate-card";

      const dayHeader = document.createElement("div");
      dayHeader.className = "time-estimate-header";
      dayHeader.textContent = `Day ${day.dayIndex} · ${formatShortDate(day.date)}`;

      const timeInfo = document.createElement("div");
      timeInfo.className = "time-estimate-info";

      // Calculate estimated time based on distance and elevation
      // Rough estimate: 4 km/h on flat, slower with elevation
      const baseSpeed = 4; // km/h
      const elevationFactor = day.stage.ascentM / 1000; // Add time for elevation
      const estimatedHours = (day.stage.distanceKm / baseSpeed) + (elevationFactor * 0.5);
      const hours = Math.floor(estimatedHours);
      const minutes = Math.round((estimatedHours - hours) * 60);

      const timeDisplay = document.createElement("div");
      timeDisplay.className = "time-estimate-value";
      if (hours > 0) {
        timeDisplay.textContent = `${hours}h ${minutes}m`;
      } else {
        timeDisplay.textContent = `${minutes}m`;
      }

      const distanceInfo = document.createElement("div");
      distanceInfo.className = "time-estimate-meta";
      distanceInfo.textContent = `${day.stage.distanceKm} km · ${day.stage.ascentM} m ascent`;

      timeInfo.appendChild(timeDisplay);
      timeInfo.appendChild(distanceInfo);

      timeCard.appendChild(dayHeader);
      timeCard.appendChild(timeInfo);
      timeList.appendChild(timeCard);
    });

    timeSection.appendChild(timeTitle);
    timeSection.appendChild(timeList);
    content.appendChild(timeSection);

    // Elevation profile section
    const elevationSection = document.createElement("div");
    elevationSection.className = "navigation-section";

    const elevationTitle = document.createElement("h3");
    elevationTitle.className = "navigation-section-title";
    elevationTitle.textContent = "📈 Elevation Profile";

    const elevationChart = document.createElement("div");
    elevationChart.className = "elevation-chart-container";

    // Create simple bar chart visualization
    const chartBars = document.createElement("div");
    chartBars.className = "elevation-chart-bars";

    const maxAscent = Math.max(...state.itinerary.map((d) => d.stage.ascentM));
    const maxDistance = Math.max(...state.itinerary.map((d) => d.stage.distanceKm));

    state.itinerary.forEach((day, index) => {
      const barContainer = document.createElement("div");
      barContainer.className = "elevation-chart-day";

      const barLabel = document.createElement("div");
      barLabel.className = "elevation-chart-label";
      barLabel.textContent = `Day ${day.dayIndex}`;

      const barWrapper = document.createElement("div");
      barWrapper.className = "elevation-chart-bar-wrapper";

      // Ascent bar
      const ascentBar = document.createElement("div");
      ascentBar.className = "elevation-chart-bar elevation-chart-bar-ascent";
      const ascentHeight = (day.stage.ascentM / maxAscent) * 100;
      ascentBar.style.height = `${ascentHeight}%`;
      ascentBar.title = `${day.stage.ascentM} m ascent`;

      // Distance indicator (width)
      const distanceBar = document.createElement("div");
      distanceBar.className = "elevation-chart-bar elevation-chart-bar-distance";
      const distanceWidth = (day.stage.distanceKm / maxDistance) * 100;
      distanceBar.style.width = `${distanceWidth}%`;
      distanceBar.title = `${day.stage.distanceKm} km`;

      const barInfo = document.createElement("div");
      barInfo.className = "elevation-chart-info";
      barInfo.innerHTML = `
        <div class="elevation-chart-info-item">${day.stage.ascentM}m</div>
        <div class="elevation-chart-info-item">${day.stage.distanceKm}km</div>
      `;

      barWrapper.appendChild(ascentBar);
      barWrapper.appendChild(distanceBar);
      barContainer.appendChild(barLabel);
      barContainer.appendChild(barWrapper);
      barContainer.appendChild(barInfo);
      chartBars.appendChild(barContainer);
    });

    elevationChart.appendChild(chartBars);
    elevationSection.appendChild(elevationTitle);
    elevationSection.appendChild(elevationChart);
    content.appendChild(elevationSection);

    // Map placeholder
    const mapSection = document.createElement("div");
    mapSection.className = "navigation-section";

    const mapTitle = document.createElement("h3");
    mapTitle.className = "navigation-section-title";
    mapTitle.textContent = "🗺️ Interactive Map";

    const mapPlaceholder = document.createElement("div");
    mapPlaceholder.className = "map-placeholder";
    mapPlaceholder.innerHTML = `
      <p>🚧 Interactive map coming soon</p>
      <p class="muted-text">This will show your route on an interactive map with waypoints, elevation, and terrain information.</p>
      <p class="muted-text" style="margin-top: 0.5rem; font-size: 0.85rem;">For now, use the GPX file above to load the route into your favorite mapping app (AllTrails, Komoot, Gaia GPS, etc.)</p>
    `;

    mapSection.appendChild(mapTitle);
    mapSection.appendChild(mapPlaceholder);
    content.appendChild(mapSection);

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

    // General packing list section
    const packingSection = document.createElement("div");
    packingSection.className = "preparation-section";

    const packingTitle = document.createElement("h3");
    packingTitle.className = "preparation-section-title";
    packingTitle.textContent = "🎒 Packing List";

    const packingList = generatePackingList(
      parseInt(state.numDays, 10),
      state.startDate
    );

    const packingGrid = document.createElement("div");
    packingGrid.className = "packing-list-grid";

    packingList.forEach((item) => {
      const itemCard = document.createElement("div");
      itemCard.className = "packing-item-card";
      itemCard.innerHTML = `
        <span class="packing-item-checkbox">☐</span>
        <span class="packing-item-text">${item}</span>
      `;
      itemCard.addEventListener("click", () => {
        const checkbox = itemCard.querySelector(".packing-item-checkbox");
        if (checkbox.textContent === "☐") {
          checkbox.textContent = "☑";
          itemCard.classList.add("packing-item-checked");
        } else {
          checkbox.textContent = "☐";
          itemCard.classList.remove("packing-item-checked");
        }
      });
      packingGrid.appendChild(itemCard);
    });

    packingSection.appendChild(packingTitle);
    packingSection.appendChild(packingGrid);
    content.appendChild(heading);
    content.appendChild(packingSection);

    // Essential gear section
    const essentialGear = getEssentialGear();
    const essentialSection = document.createElement("div");
    essentialSection.className = "preparation-section";

    const essentialTitle = document.createElement("h3");
    essentialTitle.className = "preparation-section-title";
    essentialTitle.textContent = "⚠️ Essential Gear (Don't Leave Without These)";

    const criticalList = document.createElement("div");
    criticalList.className = "essential-gear-list";
    essentialGear.critical.forEach((item) => {
      const gearItem = document.createElement("div");
      gearItem.className = "essential-gear-item essential-gear-critical";
      gearItem.innerHTML = `<span class="essential-gear-icon">🔴</span><span>${item}</span>`;
      criticalList.appendChild(gearItem);
    });

    const recommendedList = document.createElement("div");
    recommendedList.className = "essential-gear-list";
    recommendedList.style.marginTop = "1rem";
    const recommendedTitle = document.createElement("div");
    recommendedTitle.className = "essential-gear-subtitle";
    recommendedTitle.textContent = "Recommended:";
    recommendedList.appendChild(recommendedTitle);
    essentialGear.recommended.forEach((item) => {
      const gearItem = document.createElement("div");
      gearItem.className = "essential-gear-item essential-gear-recommended";
      gearItem.innerHTML = `<span class="essential-gear-icon">🟢</span><span>${item}</span>`;
      recommendedList.appendChild(gearItem);
    });

    essentialSection.appendChild(essentialTitle);
    essentialSection.appendChild(criticalList);
    essentialSection.appendChild(recommendedList);
    content.appendChild(essentialSection);

    // Weather recommendations
    const weatherRecs = getWeatherRecommendations(
      state.startDate,
      parseInt(state.numDays, 10)
    );
    if (weatherRecs.length > 0) {
      weatherRecs.forEach((rec) => {
        const weatherSection = document.createElement("div");
        weatherSection.className = "preparation-section";

        const weatherTitle = document.createElement("h3");
        weatherTitle.className = "preparation-section-title";
        weatherTitle.textContent = `🌤️ ${rec.title}`;

        const weatherList = document.createElement("ul");
        weatherList.className = "preparation-list";
        rec.items.forEach((item) => {
          const li = document.createElement("li");
          li.textContent = item;
          weatherList.appendChild(li);
        });

        weatherSection.appendChild(weatherTitle);
        weatherSection.appendChild(weatherList);
        content.appendChild(weatherSection);
      });
    }

    // Day-by-day food planning
    const foodSection = document.createElement("div");
    foodSection.className = "preparation-section";

    const foodTitle = document.createElement("h3");
    foodTitle.className = "preparation-section-title";
    foodTitle.textContent = "🍽️ Food Planning by Day";

    const foodList = document.createElement("div");
    foodList.className = "plan-itinerary-list";

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
      dayCard.appendChild(dayHeader);

      // Get hut details for food planning
      const hutDetails = getHutDetails(day.stage.hut);
      const foodSuggestions = getFoodPlanning(day, hutDetails);

      if (foodSuggestions.length > 0) {
        const foodInfo = document.createElement("div");
        foodInfo.className = "preparation-day-info";

        const foodListItems = document.createElement("ul");
        foodListItems.className = "preparation-list";
        foodSuggestions.forEach((suggestion) => {
          const li = document.createElement("li");
          li.textContent = suggestion;
          foodListItems.appendChild(li);
        });

        foodInfo.appendChild(foodListItems);
        dayCard.appendChild(foodInfo);
      }

      foodList.appendChild(dayCard);
    });

    foodSection.appendChild(foodTitle);
    foodSection.appendChild(foodList);
    content.appendChild(foodSection);

    return content;
  }

  function createCommutingTab() {
    const content = document.createElement("div");
    content.className = "plan-tab-content";

    const heading = document.createElement("h2");
    heading.className = "plan-section-heading";
    heading.textContent = "Getting There & Back";

    const commutingList = document.createElement("div");
    commutingList.className = "commuting-sections";

    // Getting to Lago di Braies (Start)
    const startSection = document.createElement("div");
    startSection.className = "commuting-section";

    const startTitle = document.createElement("h3");
    startTitle.className = "commuting-section-title";
    startTitle.innerHTML = "📍 Getting to Lago di Braies (Start)";

    const startContent = document.createElement("div");
    startContent.className = "commuting-content";

    const startMethods = [
      {
        method: "🚗 By Car",
        details: [
          "Drive to Prags (Braies) in South Tyrol",
          "Parking available near Lago di Braies (paid parking, ~€5-10/day)",
          "Arrive early in peak season (parking fills up by 9-10 AM)",
          "GPS coordinates: 46.6942° N, 12.0847° E",
        ],
      },
      {
        method: "🚌 By Bus",
        details: [
          "From Bolzano: Take bus 340 to Dobbiaco, then bus 442 to Lago di Braies",
          "From Cortina d'Ampezzo: Take bus 445 to Lago di Braies",
          "Check SAD (South Tyrol public transport) schedules",
          "Bus runs seasonally (typically June-September)",
        ],
      },
      {
        method: "✈️ By Plane",
        details: [
          "Nearest airports: Venice (VCE), Innsbruck (INN), or Munich (MUC)",
          "From Venice: ~3.5 hours by car/bus",
          "From Innsbruck: ~2 hours by car",
          "Consider renting a car or taking a combination of train + bus",
        ],
      },
      {
        method: "🚂 By Train",
        details: [
          "Nearest train station: Dobbiaco/Toblach",
          "From Dobbiaco: Take bus 442 to Lago di Braies (~20 minutes)",
          "Train connections from major cities (Venice, Munich, etc.)",
        ],
      },
    ];

    startMethods.forEach((method) => {
      const methodCard = document.createElement("div");
      methodCard.className = "commuting-method-card";

      const methodTitle = document.createElement("div");
      methodTitle.className = "commuting-method-title";
      methodTitle.textContent = method.method;

      const methodDetails = document.createElement("ul");
      methodDetails.className = "commuting-method-details";
      method.details.forEach((detail) => {
        const li = document.createElement("li");
        li.textContent = detail;
        methodDetails.appendChild(li);
      });

      methodCard.appendChild(methodTitle);
      methodCard.appendChild(methodDetails);
      startContent.appendChild(methodCard);
    });

    startSection.appendChild(startTitle);
    startSection.appendChild(startContent);

    // Getting from Belluno (End)
    const endSection = document.createElement("div");
    endSection.className = "commuting-section";

    const endTitle = document.createElement("h3");
    endTitle.className = "commuting-section-title";
    endTitle.innerHTML = "📍 Getting from Belluno (End)";

    const endContent = document.createElement("div");
    endContent.className = "commuting-content";

    const endMethods = [
      {
        method: "🚂 By Train",
        details: [
          "Belluno has a train station with good connections",
          "Direct trains to Venice (Mestre) - ~1.5 hours",
          "Connections to major Italian cities (Milan, Rome, etc.)",
          "Check Trenitalia schedules",
        ],
      },
      {
        method: "🚌 By Bus",
        details: [
          "Local buses connect Belluno to surrounding areas",
          "Bus to Cortina d'Ampezzo available",
          "Check Dolomiti Bus schedules",
        ],
      },
      {
        method: "🚗 By Car",
        details: [
          "If you left a car at Lago di Braies, you'll need to return (~2.5 hours drive)",
          "Consider arranging a shuttle service",
          "Or take public transport back to start",
        ],
      },
      {
        method: "✈️ From Airport",
        details: [
          "Venice Airport (VCE) is closest - ~1.5 hours by car/train",
          "Train: Belluno → Mestre → Airport",
          "Consider staying overnight in Belluno before departure",
        ],
      },
    ];

    endMethods.forEach((method) => {
      const methodCard = document.createElement("div");
      methodCard.className = "commuting-method-card";

      const methodTitle = document.createElement("div");
      methodTitle.className = "commuting-method-title";
      methodTitle.textContent = method.method;

      const methodDetails = document.createElement("ul");
      methodDetails.className = "commuting-method-details";
      method.details.forEach((detail) => {
        const li = document.createElement("li");
        li.textContent = detail;
        methodDetails.appendChild(li);
      });

      methodCard.appendChild(methodTitle);
      methodCard.appendChild(methodDetails);
      endContent.appendChild(methodCard);
    });

    endSection.appendChild(endTitle);
    endSection.appendChild(endContent);

    // Tips section
    const tipsSection = document.createElement("div");
    tipsSection.className = "commuting-section";

    const tipsTitle = document.createElement("h3");
    tipsTitle.className = "commuting-section-title";
    tipsTitle.innerHTML = "💡 Useful Tips";

    const tipsContent = document.createElement("div");
    tipsContent.className = "commuting-tips";
    tipsContent.innerHTML = `
      <ul>
        <li><strong>Book transportation in advance</strong> during peak season (July-August)</li>
        <li><strong>Check seasonal schedules</strong> - some bus routes only run in summer</li>
        <li><strong>Arrive early</strong> at Lago di Braies to secure parking</li>
        <li><strong>Consider staying overnight</strong> near the start/end points</li>
        <li><strong>Pack light</strong> - you'll need to carry everything on public transport</li>
        <li><strong>Have backup plans</strong> - weather can affect transportation</li>
      </ul>
    `;

    tipsSection.appendChild(tipsTitle);
    tipsSection.appendChild(tipsContent);

    commutingList.appendChild(startSection);
    commutingList.appendChild(endSection);
    commutingList.appendChild(tipsSection);

    content.appendChild(heading);
    content.appendChild(commutingList);

    return content;
  }

  function createTipsTab() {
    const content = document.createElement("div");
    content.className = "plan-tab-content";

    const heading = document.createElement("h2");
    heading.className = "plan-section-heading";
    heading.textContent = "Tips & Points of Interest";

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

      dayCard.appendChild(dayHeader);

      // Collect all points of interest for this day's stages
      const allPOIs = [];
      if (day.allStages) {
        day.allStages.forEach((stage) => {
          const stagePOIs = getStagePointsOfInterest(stage);
          stagePOIs.forEach((poi) => {
            // Avoid duplicates
            if (!allPOIs.find((p) => p.location === poi.location)) {
              allPOIs.push(poi);
            }
          });
        });
      } else {
        const stagePOIs = getStagePointsOfInterest(day.stage);
        allPOIs.push(...stagePOIs);
      }

      if (allPOIs.length === 0) {
        // No points of interest for this day
        const noPOI = document.createElement("div");
        noPOI.className = "poi-info-section";
        noPOI.innerHTML = `
          <div class="poi-note muted-text">No specific points of interest or tips for this day. Focus on enjoying the trail!</div>
        `;
        dayCard.appendChild(noPOI);
      } else {
        // Display each point of interest
        allPOIs.forEach((poi) => {
          const poiSection = document.createElement("div");
          poiSection.className = "poi-info-section";

          // POI name and type
          const poiHeader = document.createElement("div");
          poiHeader.className = "poi-header";

          const poiName = document.createElement("div");
          poiName.className = "poi-name";
          poiName.textContent = poi.name;

          const poiType = document.createElement("div");
          poiType.className = "poi-type";
          const typeLabels = {
            scenic: "🏞️ Scenic",
            viewpoint: "👁️ Viewpoint",
            hut: "🏕️ Hut",
            area: "🌄 Area",
            finish: "🏁 Finish",
          };
          poiType.textContent = typeLabels[poi.type] || poi.type;

          poiHeader.appendChild(poiName);
          poiHeader.appendChild(poiType);
          poiSection.appendChild(poiHeader);

          // Description
          if (poi.description) {
            const description = document.createElement("div");
            description.className = "poi-description";
            description.textContent = poi.description;
            poiSection.appendChild(description);
          }

          // Detour information
          if (poi.detour) {
            const detourCard = document.createElement("div");
            detourCard.className = "poi-detour-card";

            const detourHeader = document.createElement("div");
            detourHeader.className = "poi-detour-header";
            detourHeader.innerHTML = `
              <span class="poi-detour-icon">🔄</span>
              <span class="poi-detour-title">${poi.detour.name}</span>
            `;

            const detourMeta = document.createElement("div");
            detourMeta.className = "poi-detour-meta";
            detourMeta.innerHTML = `
              <span class="poi-detour-time">${poi.detour.time}</span>
              <span class="poi-detour-difficulty">${poi.detour.difficulty}</span>
            `;

            const detourDescription = document.createElement("div");
            detourDescription.className = "poi-detour-description";
            detourDescription.textContent = poi.detour.description;

            detourCard.appendChild(detourHeader);
            detourCard.appendChild(detourMeta);
            detourCard.appendChild(detourDescription);
            poiSection.appendChild(detourCard);
          }

          // Best time
          if (poi.bestTime) {
            const bestTime = document.createElement("div");
            bestTime.className = "poi-best-time";
            bestTime.innerHTML = `<span class="poi-best-time-icon">⏰</span><span>Best time: ${poi.bestTime}</span>`;
            poiSection.appendChild(bestTime);
          }

          // Tips
          if (poi.tips && poi.tips.length > 0) {
            const tipsSection = document.createElement("div");
            tipsSection.className = "poi-tips-section";

            const tipsTitle = document.createElement("div");
            tipsTitle.className = "poi-section-title";
            tipsTitle.textContent = "💡 Tips";

            const tipsList = document.createElement("ul");
            tipsList.className = "poi-tips-list";
            poi.tips.forEach((tip) => {
              const li = document.createElement("li");
              li.textContent = tip;
              tipsList.appendChild(li);
            });

            tipsSection.appendChild(tipsTitle);
            tipsSection.appendChild(tipsList);
            poiSection.appendChild(tipsSection);
          }

          // Historical context
          if (poi.historical) {
            const historical = document.createElement("div");
            historical.className = "poi-historical";
            historical.innerHTML = `
              <span class="poi-historical-icon">📜</span>
              <span class="poi-historical-text">${poi.historical}</span>
            `;
            poiSection.appendChild(historical);
          }

          dayCard.appendChild(poiSection);
        });
      }

      itineraryList.appendChild(dayCard);
    });

    content.appendChild(heading);
    content.appendChild(itineraryList);

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

