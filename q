[1;33mdiff --git a/src/app.js b/src/app.js[m
[1;33mindex a7f23c1..718a062 100644[m
[1;33m--- a/src/app.js[m
[1;33m+++ b/src/app.js[m
[1;35m@@ -15,7 +15,8 @@[m
 [m
 (() => {[m
   // ---------------------------------------------------------------------------[m
[1;31m-  // Static Alta Via 1 data (shortened prototype version)[m
[1;32m+[m[1;32m  // Static Alta Via 1 data - Complete route with all 12 rifugios[m
[1;32m+[m[1;32m  // Based on: https://www.hikingwithlee.com/alta-via-1-complete-guide/[m
   // ---------------------------------------------------------------------------[m
   const ALTA_VIA_STAGES = [[m
     {[m
[1;35m@@ -23,19 +24,27 @@[m
       from: "Lago di Braies",[m
       to: "Rifugio Biella",[m
       hut: "Rifugio Biella",[m
[1;31m-      distanceKm: 12,[m
[1;31m-      ascentM: 900,[m
[1;32m+[m[1;32m      distanceKm: 9,[m
[1;32m+[m[1;32m      ascentM: 800,[m
     },[m
     {[m
       id: 2,[m
       from: "Rifugio Biella",[m
[1;32m+[m[1;32m      to: "Rifugio Pederù",[m
[1;32m+[m[1;32m      hut: "Rifugio Pederù",[m
[1;32m+[m[1;32m      distanceKm: 12,[m
[1;32m+[m[1;32m      ascentM: 400,[m
[1;32m+[m[1;32m    },[m
[1;32m+[m[1;32m    {[m
[1;32m+[m[1;32m      id: 3,[m
[1;32m+[m[1;32m      from: "Rifugio Pederù",[m
       to: "Rifugio Fanes",[m
       hut: "Rifugio Fanes",[m
[1;31m-      distanceKm: 14,[m
[1;31m-      ascentM: 650,[m
[1;32m+[m[1;32m      distanceKm: 8,[m
[1;32m+[m[1;32m      ascentM: 450,[m
     },[m
     {[m
[1;31m-      id: 3,[m
[1;32m+[m[1;32m      id: 4,[m
       from: "Rifugio Fanes",[m
       to: "Rifugio Lagazuoi",[m
       hut: "Rifugio Lagazuoi",[m
[1;35m@@ -43,7 +52,7 @@[m
       ascentM: 900,[m
     },[m
     {[m
[1;31m-      id: 4,[m
[1;32m+[m[1;32m      id: 5,[m
       from: "Rifugio Lagazuoi",[m
       to: "Rifugio Nuvolau",[m
       hut: "Rifugio Nuvolau",[m
[1;35m@@ -51,7 +60,7 @@[m
       ascentM: 450,[m
     },[m
     {[m
[1;31m-      id: 5,[m
[1;32m+[m[1;32m      id: 6,[m
       from: "Rifugio Nuvolau",[m
       to: "Rifugio Città di Fiume",[m
       hut: "Rifugio Città di Fiume",[m
[1;35m@@ -59,33 +68,57 @@[m
       ascentM: 600,[m
     },[m
     {[m
[1;31m-      id: 6,[m
[1;32m+[m[1;32m      id: 7,[m
       from: "Rifugio Città di Fiume",[m
[1;32m+[m[1;32m      to: "Rifugio Coldai",[m
[1;32m+[m[1;32m      hut: "Rifugio Coldai",[m
[1;32m+[m[1;32m      distanceKm: 11,[m
[1;32m+[m[1;32m      ascentM: 700,[m
[1;32m+[m[1;32m    },[m
[1;32m+[m[1;32m    {[m
[1;32m+[m[1;32m      id: 8,[m
[1;32m+[m[1;32m      from: "Rifugio Coldai",[m
       to: "Rifugio Tissi",[m
       hut: "Rifugio Tissi",[m
[1;31m-      distanceKm: 15,[m
[1;32m+[m[1;32m      distanceKm: 14,[m
       ascentM: 800,[m
     },[m
     {[m
[1;31m-      id: 7,[m
[1;32m+[m[1;32m      id: 9,[m
       from: "Rifugio Tissi",[m
[1;32m+[m[1;32m      to: "Rifugio Vazzoler",[m
[1;32m+[m[1;32m      hut: "Rifugio Vazzoler",[m
[1;32m+[m[1;32m      distanceKm: 10,[m
[1;32m+[m[1;32m      ascentM: 500,[m
[1;32m+[m[1;32m    },[m
[1;32m+[m[1;32m    {[m
[1;32m+[m[1;32m      id: 10,[m
[1;32m+[m[1;32m      from: "Rifugio Vazzoler",[m
       to: "Rifugio Carestiato",[m
       hut: "Rifugio Carestiato",[m
[1;31m-      distanceKm: 11,[m
[1;31m-      ascentM: 550,[m
[1;32m+[m[1;32m      distanceKm: 12,[m
[1;32m+[m[1;32m      ascentM: 600,[m
     },[m
     {[m
[1;31m-      id: 8,[m
[1;32m+[m[1;32m      id: 11,[m
       from: "Rifugio Carestiato",[m
[1;31m-      to: "La Stanga (Belluno side)",[m
[1;32m+[m[1;32m      to: "Rifugio Sommariva al Pramperet",[m
[1;32m+[m[1;32m      hut: "Rifugio Sommariva al Pramperet",[m
[1;32m+[m[1;32m      distanceKm: 9,[m
[1;32m+[m[1;32m      ascentM: 400,[m
[1;32m+[m[1;32m    },[m
[1;32m+[m[1;32m    {[m
[1;32m+[m[1;32m      id: 12,[m
[1;32m+[m[1;32m      from: "Rifugio Sommariva al Pramperet",[m
[1;32m+[m[1;32m      to: "La Pissa (Belluno)",[m
       hut: "End in valley",[m
[1;31m-      distanceKm: 16,[m
[1;31m-      ascentM: 300,[m
[1;32m+[m[1;32m      distanceKm: 11,[m
[1;32m+[m[1;32m      ascentM: 200,[m
     },[m
   ];[m
 [m
[1;31m-  const MIN_DAYS = 3;[m
[1;31m-  const MAX_DAYS = ALTA_VIA_STAGES.length;[m
[1;32m+[m[1;32m  const MIN_DAYS = 5;[m
[1;32m+[m[1;32m  const MAX_DAYS = 12;[m
 [m
   // Simple in-memory state for the wizard.[m
   const state = {[m
[1;35m@@ -93,6 +126,8 @@[m
     startDate: "",[m
     numDays: "",[m
     itinerary: [],[m
[1;32m+[m[1;32m    allCombinations: [], // All possible hut combinations for selected days[m
[1;32m+[m[1;32m    selectedCombinationIndex: null, // Index of selected combination[m
     errors: {[m
       startDate: "",[m
       numDays: "",[m
[1;35m@@ -403,7 +438,7 @@[m
 [m
     const helper = document.createElement("div");[m
     helper.className = "field-helper";[m
[1;31m-    helper.textContent = `For this prototype, we support ${MIN_DAYS}–${MAX_DAYS} days along the core Alta Via 1 stages.`;[m
[1;32m+[m[1;32m    helper.textContent = `Choose ${MIN_DAYS}–${MAX_DAYS} days to complete Alta Via 1 from Lago di Braies to Belluno. We'll show you all possible hut combinations.`;[m
 [m
     const group = document.createElement("div");[m
     group.className = "field-group";[m
[1;35m@@ -465,7 +500,10 @@[m
         return;[m
       }[m
 [m
[1;31m-      state.itinerary = buildItinerary(state.startDate, parsed);[m
[1;32m+[m[1;32m      // Generate all possible hut combinations for the selected number of days[m
[1;32m+[m[1;32m      state.allCombinations = generateAllCombinations(parsed);[m
[1;32m+[m[1;32m      state.selectedCombinationIndex = null;[m
[1;32m+[m[1;32m      state.itinerary = [];[m
       state.currentStep = 3;[m
       renderAppShell();[m
     });[m
[1;35m@@ -483,28 +521,98 @@[m
 [m
     const label = document.createElement("div");[m
     label.className = "field-label";[m
[1;31m-    label.textContent = "Step 3 · These are the huts you should aim for";[m
[1;32m+[m[1;32m    label.textContent = `Step 3 · Choose your ${state.numDays}-day route to Belluno`;[m
 [m
     const helper = document.createElement("div");[m
     helper.className = "field-helper";[m
     helper.textContent =[m
[1;31m-      "Based on your days, we assign one classic Alta Via 1 stage to each hiking day. Distances are approximate but realistic.";[m
[1;32m+[m[1;32m      `All possible ways to complete Alta Via 1 from Lago di Braies to Belluno in ${state.numDays} days. Each option shows different hut combinations and daily distances.`;[m
 [m
     root.appendChild(label);[m
     root.appendChild(helper);[m
 [m
[1;31m-    if (!state.itinerary.length) {[m
[1;32m+[m[1;32m    if (!state.allCombinations || state.allCombinations.length === 0) {[m
       const empty = document.createElement("div");[m
       empty.className = "field-helper";[m
       empty.textContent =[m
[1;31m-        "Set a start date and number of days first to see your suggested huts.";[m
[1;32m+[m[1;32m        "Set a start date and number of days first to see hut combinations.";[m
       root.appendChild(empty);[m
     } else {[m
[1;31m-      const note = document.createElement("div");[m
[1;31m-      note.className = "field-helper";[m
[1;31m-      note.textContent =[m
[1;31m-        "You can refine this later with rest days, variants, and your own hut choices.";[m
[1;31m-      root.appendChild(note);[m
[1;32m+[m[1;32m      const combinationsList = document.createElement("div");[m
[1;32m+[m[1;32m      combinationsList.className = "combinations-list";[m
[1;32m+[m
[1;32m+[m[1;32m      state.allCombinations.forEach((combination, index) => {[m
[1;32m+[m[1;32m        const comboCard = document.createElement("div");[m
[1;32m+[m[1;32m        comboCard.className = `combination-card ${[m
[1;32m+[m[1;32m          state.selectedCombinationIndex === index ? "combination-selected" : ""[m
[1;32m+[m[1;32m        }`;[m
[1;32m+[m[1;32m        comboCard.addEventListener("click", () => {[m
[1;32m+[m[1;32m          state.selectedCombinationIndex = index;[m
[1;32m+[m[1;32m          state.itinerary = buildItineraryFromCombination([m
[1;32m+[m[1;32m            state.startDate,[m
[1;32m+[m[1;32m            combination[m
[1;32m+[m[1;32m          );[m
[1;32m+[m[1;32m          renderAppShell();[m
[1;32m+[m[1;32m        });[m
[1;32m+[m
[1;32m+[m[1;32m        const comboHeader = document.createElement("div");[m
[1;32m+[m[1;32m        comboHeader.className = "combination-header";[m
[1;32m+[m
[1;32m+[m[1;32m        const comboTitle = document.createElement("div");[m
[1;32m+[m[1;32m        comboTitle.className = "combination-title";[m
[1;32m+[m[1;32m        comboTitle.textContent = `Option ${index + 1}`;[m
[1;32m+[m
[1;32m+[m[1;32m        const comboStats = document.createElement("div");[m
[1;32m+[m[1;32m        comboStats.className = "combination-stats";[m
[1;32m+[m
[1;32m+[m[1;32m        const totalDistance = combination.reduce([m
[1;32m+[m[1;32m          (sum, day) => sum + day.totalDistanceKm,[m
[1;32m+[m[1;32m          0[m
[1;32m+[m[1;32m        );[m
[1;32m+[m[1;32m        const totalAscent = combination.reduce([m
[1;32m+[m[1;32m          (sum, day) => sum + day.totalAscentM,[m
[1;32m+[m[1;32m          0[m
[1;32m+[m[1;32m        );[m
[1;32m+[m
[1;32m+[m[1;32m        comboStats.innerHTML = `<span class="accent-text">${totalDistance.toFixed(1)} km</span> · <span>${totalAscent} m up</span>`;[m
[1;32m+[m
[1;32m+[m[1;32m        comboHeader.appendChild(comboTitle);[m
[1;32m+[m[1;32m        comboHeader.appendChild(comboStats);[m
[1;32m+[m
[1;32m+[m[1;32m        const comboDays = document.createElement("div");[m
[1;32m+[m[1;32m        comboDays.className = "combination-days";[m
[1;32m+[m
[1;32m+[m[1;32m        combination.forEach((day, dayIndex) => {[m
[1;32m+[m[1;32m          const dayItem = document.createElement("div");[m
[1;32m+[m[1;32m          dayItem.className = "combination-day-item";[m
[1;32m+[m
[1;32m+[m[1;32m          const dayLabel = document.createElement("span");[m
[1;32m+[m[1;32m          dayLabel.className = "combination-day-label";[m
[1;32m+[m[1;32m          dayLabel.textContent = `Day ${dayIndex + 1}:`;[m
[1;32m+[m
[1;32m+[m[1;32m          const dayInfo = document.createElement("span");[m
[1;32m+[m[1;32m          dayInfo.className = "combination-day-info";[m
[1;32m+[m[1;32m          dayInfo.textContent = `${day.totalDistanceKm} km · ${day.hut}`;[m
[1;32m+[m
[1;32m+[m[1;32m          dayItem.appendChild(dayLabel);[m
[1;32m+[m[1;32m          dayItem.appendChild(dayInfo);[m
[1;32m+[m[1;32m          comboDays.appendChild(dayItem);[m
[1;32m+[m[1;32m        });[m
[1;32m+[m
[1;32m+[m[1;32m        comboCard.appendChild(comboHeader);[m
[1;32m+[m[1;32m        comboCard.appendChild(comboDays);[m
[1;32m+[m[1;32m        combinationsList.appendChild(comboCard);[m
[1;32m+[m[1;32m      });[m
[1;32m+[m
[1;32m+[m[1;32m      root.appendChild(combinationsList);[m
[1;32m+[m
[1;32m+[m[1;32m      if (state.selectedCombinationIndex !== null) {[m
[1;32m+[m[1;32m        const selectedNote = document.createElement("div");[m
[1;32m+[m[1;32m        selectedNote.className = "field-helper";[m
[1;32m+[m[1;32m        selectedNote.innerHTML =[m
[1;32m+[m[1;32m          '<span class="accent-text">✓ Selected</span> · See the detailed itinerary in the right panel.';[m
[1;32m+[m[1;32m        root.appendChild(selectedNote);[m
[1;32m+[m[1;32m      }[m
     }[m
 [m
     const buttons = document.createElement("div");[m
[1;35m@@ -540,14 +648,25 @@[m
       empty.className = "stack-sm";[m
 [m
       const line = document.createElement("div");[m
[1;31m-      line.innerHTML =[m
[1;31m-        '<span class="muted-text">No itinerary yet.</span> ' +[m
[1;31m-        "Choose a start date and number of days in the wizard to see huts and daily distances.";[m
[1;32m+[m[1;32m      if (state.currentStep === 3 && state.allCombinations.length > 0) {[m
[1;32m+[m[1;32m        line.innerHTML =[m
[1;32m+[m[1;32m          '<span class="muted-text">Select a route option</span> ' +[m
[1;32m+[m[1;32m          "Click on one of the combinations in Step 3 to see the detailed itinerary here.";[m
[1;32m+[m[1;32m      } else {[m
[1;32m+[m[1;32m        line.innerHTML =[m
[1;32m+[m[1;32m          '<span class="muted-text">No itinerary yet.</span> ' +[m
[1;32m+[m[1;32m          "Choose a start date and number of days in the wizard to see all possible hut combinations.";[m
[1;32m+[m[1;32m      }[m
 [m
       const hint = document.createElement("div");[m
       hint.className = "field-helper";[m
[1;31m-      hint.textContent =[m
[1;31m-        "Once generated, you will see one card per day here, with the hut you should book and the distance you will hike.";[m
[1;32m+[m[1;32m      if (state.currentStep === 3 && state.allCombinations.length > 0) {[m
[1;32m+[m[1;32m        hint.textContent =[m
[1;32m+[m[1;32m          "Each option shows different ways to combine stages, with varying daily distances and hut stops.";[m
[1;32m+[m[1;32m      } else {[m
[1;32m+[m[1;32m        hint.textContent =[m
[1;32m+[m[1;32m          "Once you select a combination, you will see one card per day here, with the hut you should book and the distance you will hike.";[m
[1;32m+[m[1;32m      }[m
 [m
       const warning = document.createElement("span");[m
       warning.className = "pill pill-danger";[m
[1;35m@@ -624,14 +743,27 @@[m
 [m
       const route = document.createElement("div");[m
       route.className = "itinerary-day-meta";[m
[1;31m-      route.textContent = `${day.stage.from} → ${day.stage.to}`;[m
[1;32m+[m[41m      [m
[1;32m+[m[1;32m      // Show combined stages if multiple stages in one day[m
[1;32m+[m[1;32m      if (day.allStages && day.allStages.length > 1) {[m
[1;32m+[m[1;32m        const stagesList = day.allStages[m
[1;32m+[m[1;32m          .map((s, idx) => (idx === 0 ? s.from : s.to))[m
[1;32m+[m[1;32m          .join(" → ");[m
[1;32m+[m[1;32m        route.textContent = stagesList;[m
[1;32m+[m[1;32m      } else {[m
[1;32m+[m[1;32m        route.textContent = `${day.stage.from} → ${day.stage.to}`;[m
[1;32m+[m[1;32m      }[m
 [m
       const hut = document.createElement("div");[m
       hut.className = "itinerary-day-meta";[m
[1;31m-      hut.textContent =[m
[1;31m-        day.stage.hut === "End in valley"[m
[1;31m-          ? "Finish in the valley (no hut booking needed)."[m
[1;31m-          : `Book: ${day.stage.hut}`;[m
[1;32m+[m[1;32m      if (day.allStages && day.allStages.length > 1) {[m
[1;32m+[m[1;32m        hut.textContent = `Combines ${day.allStages.length} stages · Book: ${day.stage.hut === "End in valley" ? "Finish in valley" : day.stage.hut}`;[m
[1;32m+[m[1;32m      } else {[m
[1;32m+[m[1;32m        hut.textContent =[m
[1;32m+[m[1;32m          day.stage.hut === "End in valley"[m
[1;32m+[m[1;32m            ? "Finish in the valley (no hut booking needed)."[m
[1;32m+[m[1;32m            : `Book: ${day.stage.hut}`;[m
[1;32m+[m[1;32m      }[m
 [m
       item.appendChild(header);[m
       item.appendChild(route);[m
[1;35m@@ -697,23 +829,110 @@[m
   // Helpers[m
   // ---------------------------------------------------------------------------[m
 [m
[1;31m-  function buildItinerary(startDate, numDays) {[m
[1;32m+[m[1;32m  /**[m
[1;32m+[m[1;32m   * Generates all possible ways to complete Alta Via 1 in numDays.[m
[1;32m+[m[1;32m   * Always goes from start (Lago di Braies) to finish (Belluno).[m
[1;32m+[m[1;32m   * Returns an array of combinations, where each combination is an array of days.[m
[1;32m+[m[1;32m   */[m
[1;32m+[m[1;32m  function generateAllCombinations(numDays) {[m
[1;32m+[m[1;32m    const totalStages = ALTA_VIA_STAGES.length;[m
[1;32m+[m[1;32m    const combinations = [];[m
[1;32m+[m
[1;32m+[m[1;32m    // We need to partition totalStages into numDays groups[m
[1;32m+[m[1;32m    // This is equivalent to finding all ways to place (numDays - 1) breaks[m
[1;32m+[m[1;32m    // between the stages[m
[1;32m+[m[1;32m    function findPartitions(stagesLeft, daysLeft, currentPartition) {[m
[1;32m+[m[1;32m      if (daysLeft === 1) {[m
[1;32m+[m[1;32m        // Last day: take all remaining stages[m
[1;32m+[m[1;32m        const dayStages = ALTA_VIA_STAGES.slice([m
[1;32m+[m[1;32m          totalStages - stagesLeft,[m
[1;32m+[m[1;32m          totalStages[m
[1;32m+[m[1;32m        );[m
[1;32m+[m[1;32m        const day = createDayFromStages(dayStages);[m
[1;32m+[m[1;32m        const newPartition = [...currentPartition, day];[m
[1;32m+[m[1;32m        combinations.push(newPartition);[m
[1;32m+[m[1;32m        return;[m
[1;32m+[m[1;32m      }[m
[1;32m+[m
[1;32m+[m[1;32m      // For each possible number of stages for the current day[m
[1;32m+[m[1;32m      // (at least 1, at most stagesLeft - daysLeft + 1)[m
[1;32m+[m[1;32m      const minStages = 1;[m
[1;32m+[m[1;32m      const maxStages = stagesLeft - daysLeft + 1;[m
[1;32m+[m
[1;32m+[m[1;32m      for (let stagesToday = minStages; stagesToday <= maxStages; stagesToday += 1) {[m
[1;32m+[m[1;32m        const dayStages = ALTA_VIA_STAGES.slice([m
[1;32m+[m[1;32m          totalStages - stagesLeft,[m
[1;32m+[m[1;32m          totalStages - stagesLeft + stagesToday[m
[1;32m+[m[1;32m        );[m
[1;32m+[m[1;32m        const day = createDayFromStages(dayStages);[m
[1;32m+[m[1;32m        findPartitions([m
[1;32m+[m[1;32m          stagesLeft - stagesToday,[m
[1;32m+[m[1;32m          daysLeft - 1,[m
[1;32m+[m[1;32m          [...currentPartition, day][m
[1;32m+[m[1;32m        );[m
[1;32m+[m[1;32m      }[m
[1;32m+[m[1;32m    }[m
[1;32m+[m
[1;32m+[m[1;32m    findPartitions(totalStages, numDays, []);[m
[1;32m+[m[1;32m    return combinations;[m
[1;32m+[m[1;32m  }[m
[1;32m+[m
[1;32m+[m[1;32m  /**[m
[1;32m+[m[1;32m   * Creates a day object from an array of consecutive stages.[m
[1;32m+[m[1;32m   */[m
[1;32m+[m[1;32m  function createDayFromStages(stages) {[m
[1;32m+[m[1;32m    if (stages.length === 0) return null;[m
[1;32m+[m
[1;32m+[m[1;32m    const totalDistanceKm = stages.reduce([m
[1;32m+[m[1;32m      (sum, stage) => sum + stage.distanceKm,[m
[1;32m+[m[1;32m      0[m
[1;32m+[m[1;32m    );[m
[1;32m+[m[1;32m    const totalAscentM = stages.reduce([m
[1;32m+[m[1;32m      (sum, stage) => sum + stage.ascentM,[m
[1;32m+[m[1;32m      0[m
[1;32m+[m[1;32m    );[m
[1;32m+[m
[1;32m+[m[1;32m    const firstStage = stages[0];[m
[1;32m+[m[1;32m    const lastStage = stages[stages.length - 1];[m
[1;32m+[m
[1;32m+[m[1;32m    return {[m
[1;32m+[m[1;32m      stages: stages,[m
[1;32m+[m[1;32m      from: firstStage.from,[m
[1;32m+[m[1;32m      to: lastStage.to,[m
[1;32m+[m[1;32m      hut: lastStage.hut,[m
[1;32m+[m[1;32m      totalDistanceKm: totalDistanceKm,[m
[1;32m+[m[1;32m      totalAscentM: totalAscentM,[m
[1;32m+[m[1;32m    };[m
[1;32m+[m[1;32m  }[m
[1;32m+[m
[1;32m+[m[1;32m  /**[m
[1;32m+[m[1;32m   * Builds an itinerary from a selected combination and start date.[m
[1;32m+[m[1;32m   */[m
[1;32m+[m[1;32m  function buildItineraryFromCombination(startDate, combination) {[m
     const itinerary = [];[m
     const base = startDate ? new Date(startDate) : new Date();[m
 [m
[1;31m-    for (let i = 0; i < numDays; i += 1) {[m
[1;31m-      const stage = ALTA_VIA_STAGES[i];[m
[1;31m-      if (!stage) break;[m
[1;31m-[m
[1;32m+[m[1;32m    combination.forEach((day, index) => {[m
       const date = new Date(base);[m
[1;31m-      date.setDate(base.getDate() + i);[m
[1;32m+[m[1;32m      date.setDate(base.getDate() + index);[m
[1;32m+[m
[1;32m+[m[1;32m      // For display, we'll use the first stage as the representative[m
[1;32m+[m[1;32m      // but show the combined distance and ascent[m
[1;32m+[m[1;32m      const representativeStage = {[m
[1;32m+[m[1;32m        ...day.stages[0],[m
[1;32m+[m[1;32m        distanceKm: day.totalDistanceKm,[m
[1;32m+[m[1;32m        ascentM: day.totalAscentM,[m
[1;32m+[m[1;32m        to: day.to,[m
[1;32m+[m[1;32m        hut: day.hut,[m
[1;32m+[m[1;32m      };[m
 [m
       itinerary.push({[m
[1;31m-        dayIndex: i + 1,[m
[1;32m+[m[1;32m        dayIndex: index + 1,[m
         date: date.toISOString().slice(0, 10),[m
[1;31m-        stage,[m
[1;32m+[m[1;32m        stage: representativeStage,[m
[1;32m+[m[1;32m        allStages: day.stages, // Keep all stages for detailed view[m
       });[m
[1;31m-    }[m
[1;32m+[m[1;32m    });[m
 [m
     return itinerary;[m
   }[m
[1;33mdiff --git a/styles.css b/styles.css[m
[1;33mindex 4d2f296..01c709e 100644[m
[1;33m--- a/styles.css[m
[1;33m+++ b/styles.css[m
[1;35m@@ -422,6 +422,81 @@[m [mbody {[m
   letter-spacing: 0.08em;[m
 }[m
 [m
[1;32m+[m[1;32m/* Combination cards for step 3 */[m
[1;32m+[m[1;32m.combinations-list {[m
[1;32m+[m[1;32m  display: flex;[m
[1;32m+[m[1;32m  flex-direction: column;[m
[1;32m+[m[1;32m  gap: 0.75rem;[m
[1;32m+[m[1;32m  margin-top: 0.5rem;[m
[1;32m+[m[1;32m}[m
[1;32m+[m
[1;32m+[m[1;32m.combination-card {[m
[1;32m+[m[1;32m  border-radius: 0.9rem;[m
[1;32m+[m[1;32m  border: 1px solid rgba(148, 163, 184, 0.35);[m
[1;32m+[m[1;32m  padding: 0.75rem;[m
[1;32m+[m[1;32m  background: rgba(15, 23, 42, 0.6);[m
[1;32m+[m[1;32m  cursor: pointer;[m
[1;32m+[m[1;32m  transition: all 0.2s ease;[m
[1;32m+[m[1;32m}[m
[1;32m+[m
[1;32m+[m[1;32m.combination-card:hover {[m
[1;32m+[m[1;32m  border-color: rgba(34, 197, 94, 0.5);[m
[1;32m+[m[1;32m  background: rgba(15, 23, 42, 0.85);[m
[1;32m+[m[1;32m  transform: translateX(2px);[m
[1;32m+[m[1;32m}[m
[1;32m+[m
[1;32m+[m[1;32m.combination-selected {[m
[1;32m+[m[1;32m  border-color: var(--accent);[m
[1;32m+[m[1;32m  background: var(--accent-soft);[m
[1;32m+[m[1;32m  box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.3);[m
[1;32m+[m[1;32m}[m
[1;32m+[m
[1;32m+[m[1;32m.combination-header {[m
[1;32m+[m[1;32m  display: flex;[m
[1;32m+[m[1;32m  justify-content: space-between;[m
[1;32m+[m[1;32m  align-items: center;[m
[1;32m+[m[1;32m  margin-bottom: 0.5rem;[m
[1;32m+[m[1;32m  gap: 0.5rem;[m
[1;32m+[m[1;32m}[m
[1;32m+[m
[1;32m+[m[1;32m.combination-title {[m
[1;32m+[m[1;32m  font-size: 0.85rem;[m
[1;32m+[m[1;32m  font-weight: 600;[m
[1;32m+[m[1;32m  color: var(--text);[m
[1;32m+[m[1;32m}[m
[1;32m+[m
[1;32m+[m[1;32m.combination-stats {[m
[1;32m+[m[1;32m  font-size: 0.75rem;[m
[1;32m+[m[1;32m  color: var(--text-soft);[m
[1;32m+[m[1;32m}[m
[1;32m+[m
[1;32m+[m[1;32m.combination-days {[m
[1;32m+[m[1;32m  display: flex;[m
[1;32m+[m[1;32m  flex-direction: column;[m
[1;32m+[m[1;32m  gap: 0.3rem;[m
[1;32m+[m[1;32m  margin-top: 0.4rem;[m
[1;32m+[m[1;32m}[m
[1;32m+[m
[1;32m+[m[1;32m.combination-day-item {[m
[1;32m+[m[1;32m  display: flex;[m
[1;32m+[m[1;32m  gap: 0.5rem;[m
[1;32m+[m[1;32m  font-size: 0.75rem;[m
[1;32m+[m[1;32m  color: var(--text-soft);[m
[1;32m+[m[1;32m}[m
[1;32m+[m
[1;32m+[m[1;32m.combination-day-label {[m
[1;32m+[m[1;32m  font-weight: 500;[m
[1;32m+[m[1;32m  min-width: 3.5rem;[m
[1;32m+[m[1;32m}[m
[1;32m+[m
[1;32m+[m[1;32m.combination-day-info {[m
[1;32m+[m[1;32m  color: var(--text-soft);[m
[1;32m+[m[1;32m}[m
[1;32m+[m
[1;32m+[m[1;32m.combination-selected .combination-day-label {[m
[1;32m+[m[1;32m  color: var(--accent-strong);[m
[1;32m+[m[1;32m}[m
[1;32m+[m
 @media (max-width: 600px) {[m
   .app-footer-links {[m
     gap: 0.6rem;[m
[1;35m@@ -431,4 +506,10 @@[m [mbody {[m
     padding: 0.35rem 0.65rem;[m
     font-size: 0.75rem;[m
   }[m
[1;32m+[m
[1;32m+[m[1;32m  .combination-header {[m
[1;32m+[m[1;32m    flex-direction: column;[m
[1;32m+[m[1;32m    align-items: flex-start;[m
[1;32m+[m[1;32m    gap: 0.3rem;[m
[1;32m+[m[1;32m  }[m
 }[m
