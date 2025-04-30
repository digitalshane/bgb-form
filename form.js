// form.js
import { createToast } from "./toast.js";
import { createValidator } from "./validation.js";
import { initPlacesAutocomplete } from "./autocomplete.js";
import flatpickr from "https://cdn.skypack.dev/flatpickr";

/**
 * Call this from main.js after you dynamically import the module:
 *   const { initForm } = await import('./form.js');
 *   initForm();
 */
export function initForm() {
  /* ===== Form State Management ===== */

  const createFormState = (initialState = {}) => {
    const saved = localStorage.getItem("formState");
    const base = saved ? JSON.parse(saved) : initialState;

    return new Proxy(
      { ...base },
      {
        set(target, key, value) {
          target[key] = value;
          localStorage.setItem("formState", JSON.stringify(target));
          return true;
        },
      }
    );
  };

  flatpickr("#myDate", {
    dateFormat: "Y-m-d",
    // any other options…
  });

  const formState = createFormState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    currentStep: 1,
    newPlanting: false,
    decorativeStone: false,
    maintenance: false,
    landscapeLighting: false,
    newLawnInstall: false,
    specializedExcavation: false,
    treeRemoval: false,
    treePruning: false,
    other: "",
    doneByDate: "",
  });

  window.formState = formState; // 👈 This makes it available in the console

  const toast = createToast();
  const validator = createValidator(formState);

  /* ===== Inputs ===== */

  // Map every [data-input] element to its key
  const inputMap = {};

  const initializeInputMap = () => {
    document.querySelectorAll("[data-input]").forEach((el) => {
      const key = el.getAttribute("data-input");
      if (!key) return;
      inputMap[key] = el;

      if (el.type === "checkbox") {
        // sync checked state, don’t touch `value`
        el.checked = !!formState[key];
      } else {
        // text / number / select / etc.
        if (formState[key]) {
          el.value = formState[key];
        } else if (el.value) {
          formState[key] = el.value;
        }
      }
    });
    console.log("Input map initialised:", Object.keys(inputMap));
  };

  const handleInputChange = (e) => {
    const key = e.target.getAttribute("data-input");
    if (!key) return;

    if (e.target.type === "checkbox") {
      // for checkboxes, use checked (boolean)
      formState[key] = e.target.checked;
    } else {
      // for everything else, use value
      formState[key] = e.target.value;
    }
  };

  const attachInputListeners = () => {
    document
      .querySelectorAll("[data-input]")
      .forEach((el) => el.addEventListener("input", handleInputChange));

    // legacy support for [data-custom-change]
    document.querySelectorAll("[data-custom-change]").forEach((el) =>
      el.addEventListener("input", (e) => {
        const name = e.target.getAttribute("name");
        if (name) formState[name] = e.target.value;
      })
    );

    console.log("Input listeners attached");
  };

  const attachCheckboxListeners = () => {
    document
      .querySelectorAll('input[type="checkbox"][data-input]')
      .forEach((checkbox) => {
        checkbox.addEventListener("click", (e) => {
          const key = e.target.dataset.input;
          if (!(key in formState)) {
            console.warn(`formState has no key "${key}"`, formState);
            return;
          }
          // only update on click
          formState[key] = e.target.checked;
        });
      });

    console.log("Checkbox listeners attached (no init sync)");
  };

  /* ===== Multi-step navigation ===== */

  const stepsMap = Array.from(document.querySelectorAll("[data-step]")).reduce(
    (acc, el) => {
      acc[el.getAttribute("data-step")] = el;
      return acc;
    },
    {}
  );

  const getQueryParam = (p) =>
    new URLSearchParams(window.location.search).get(p);

  const updateQueryParam = (p, v) => {
    const url = new URL(window.location);
    url.searchParams.set(p, v);
    history.replaceState({}, "", url);
  };

  const formStepState = { currentStep: 1 };

  const showStep = (step) => {
    Object.values(stepsMap).forEach((el) => el.classList.add("hide"));
    if (!stepsMap[step]) return;

    stepsMap[step].classList.remove("hide");
    formStepState.currentStep = Number(step);
    formState.currentStep = Number(step);
    updateQueryParam("step", step);
    console.log(`Showing step ${step}`);
  };

  const handleStepNavigation = (e) => {
    e.preventDefault();
    const dir = e.target.getAttribute("data-alt");

    if (dir === "next") {
      const { isValid, errors } = validator.validateStep(
        formStepState.currentStep
      );
      if (!isValid) {
        toast.error(errors.join(", "));
        return;
      }
      if (formStepState.currentStep < 5) formStepState.currentStep++;
    }

    if (dir === "back" && formStepState.currentStep > 1) {
      formStepState.currentStep--;
    }

    showStep(formStepState.currentStep);
  };

  document
    .querySelectorAll('[data-alt="next"], [data-alt="back"]')
    .forEach((btn) => btn.addEventListener("click", handleStepNavigation));

  /* ===== Submission ===== */

  const clearStoredFormData = () => {
    localStorage.removeItem("formState");
    console.log("Stored form data cleared");
  };

  const getFormData = () => ({ ...formState });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = getFormData();

    fetch("https://form-handler.clients-248.workers.dev/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((r) => r.json())
      .then((out) => {
        if (!out.success) throw new Error(out.error || "Submission failed");
        toast.success("Form submitted successfully!");
        clearStoredFormData();
        if (out.analysis) console.log("AI Analysis:", out.analysis);
      })
      .catch((err) => toast.error("Failed to submit form: " + err.message));
  };

  document
    .querySelectorAll('[data-alt="submit"]')
    .forEach((btn) => btn.addEventListener("click", handleSubmit));

  document.addEventListener("submit", handleSubmit);

  /* ===== Kick-off immediately (DOM is already ready) ===== */

  initializeInputMap();
  attachInputListeners();
  attachCheckboxListeners();
  initPlacesAutocomplete(formState);

  const qsStep = Number(getQueryParam("step"));
  if (qsStep >= 1 && qsStep <= 5) formStepState.currentStep = qsStep;
  showStep(formStepState.currentStep);
}
