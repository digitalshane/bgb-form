import { createToast } from "./toast.js";
import { createValidator } from "./validation.js";
import { initPlacesAutocomplete } from "./autocomplete.js";

// ===== Form State Management =====

// Factory function to create a reactive form state using Proxy with persistence
const createFormState = (initialState = {}) => {
  const savedState = localStorage.getItem("formState");
  const startingState = savedState ? JSON.parse(savedState) : initialState;

  const handler = {
    set: (target, key, value) => {
      target[key] = value;
      localStorage.setItem("formState", JSON.stringify(target));
      console.log(`State updated and saved: ${key} = ${value}`);
      return true;
    },
  };
  return new Proxy({ ...startingState }, handler);
};

// Initialize state with keys for all form fields and current step (if needed)
const formState = createFormState({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  currentStep: 1, // sync current step in form state
});

// Initialize toast and validator after formState creation
const toast = createToast();
const validator = createValidator(formState);

// Create a map of data-input elements to their corresponding values
const inputMap = {};

// Function to initialize the input map by finding all elements with data-input attribute
const initializeInputMap = () => {
  document.querySelectorAll("[data-input]").forEach((element) => {
    const inputKey = element.getAttribute("data-input");
    if (inputKey) {
      inputMap[inputKey] = element;

      // Set input value from stored state if it exists
      if (formState[inputKey]) {
        element.value = formState[inputKey];
      }
      // Otherwise initialize formState with any existing values
      else if (element.value) {
        formState[inputKey] = element.value;
      }
    }
  });
  console.log(
    "Input map initialized with stored values:",
    Object.keys(inputMap)
  );
};

// Add a function to clear stored form data (useful for testing or after submission)
const clearStoredFormData = () => {
  localStorage.removeItem("formState");
  console.log("Stored form data cleared");
};

// Handler for data-input changes
const handleInputChange = (e) => {
  const element = e.target;
  const inputKey = element.getAttribute("data-input");
  if (inputKey) {
    formState[inputKey] = element.value;
  }
};

// Attach event listeners to inputs with the data-input attribute
const attachInputListeners = () => {
  document
    .querySelectorAll("[data-input]")
    .forEach((input) => input.addEventListener("input", handleInputChange));
  console.log("Input listeners attached");
};

// Handler for custom input changes (keep for backward compatibility)
const handleCustomChange = (e) => {
  const key = e.target.getAttribute("name");
  const value = e.target.value;
  if (key) formState[key] = value;
};

// Attach event listeners to inputs with the custom attribute
document
  .querySelectorAll("[data-custom-change]")
  .forEach((input) => input.addEventListener("input", handleCustomChange));

// ===== Multi-Step Navigation =====

// Create a map of step numbers to their corresponding DOM elements
const stepsMap = Array.from(document.querySelectorAll("[data-step]")).reduce(
  (acc, el) => {
    const step = el.getAttribute("data-step");
    acc[step] = el;
    return acc;
  },
  {}
);

// Helper: Get query parameter value by name
const getQueryParam = (param) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};

// Helper: Update the URL's query parameter without reloading the page
const updateQueryParam = (param, value) => {
  const url = new URL(window.location);
  url.searchParams.set(param, value);
  window.history.replaceState({}, "", url);
};

// Form step state (can be managed separately or inside formState)
const formStepState = {
  currentStep: 1,
};

// Function to show the current step and hide others using CSS classes
const showStep = (step) => {
  // Hide all steps by adding the 'hide' class
  Object.values(stepsMap).forEach((el) => {
    el.classList.add("hide");
  });

  // Show the current step by removing the 'hide' class
  if (stepsMap[step]) {
    stepsMap[step].classList.remove("hide");
    console.log(`Showing step ${step}`);

    // Sync the step to the form state and URL query param
    formStepState.currentStep = Number(step);

    // Only update formState if it exists in this scope
    try {
      if (typeof formState !== "undefined") {
        formState.currentStep = Number(step);
      }
    } catch (e) {
      console.log("Note: formState not available in this scope");
    }

    updateQueryParam("step", step);
  }
};

// Navigation handler for Next/Back buttons
const handleStepNavigation = (e) => {
  e.preventDefault();
  const direction = e.target.getAttribute("data-alt");

  if (direction === "next") {
    // Validate current step
    const { isValid, errors } = validator.validateStep(
      formStepState.currentStep
    );

    if (!isValid) {
      // Show which fields are missing
      const errorMessage = `${errors.join(", ")}`;
      toast.error(errorMessage);
      return;
    }

    if (formStepState.currentStep < 5) {
      formStepState.currentStep++;
      // toast.success("Step completed successfully!");
    }
  } else if (direction === "back" && formStepState.currentStep > 1) {
    formStepState.currentStep--;
  }

  showStep(formStepState.currentStep);
};

// Attach event listeners for next and back navigation
document
  .querySelectorAll('[data-alt="next"], [data-alt="back"]')
  .forEach((btn) => btn.addEventListener("click", handleStepNavigation));

// ===== Initialize Step on Load =====
document.addEventListener("DOMContentLoaded", () => {
  // Initialize the input map and attach listeners
  initializeInputMap();
  attachInputListeners();

  // Check if the URL contains a step query parameter
  const queryStep = Number(getQueryParam("step"));
  if (queryStep && queryStep >= 1 && queryStep <= 5) {
    formStepState.currentStep = queryStep;
  }
  // Sync formState and show the correct step
  formState.currentStep = formStepState.currentStep;
  showStep(formStepState.currentStep);
});

// Function to get all form data (for API submission)
const getFormData = () => {
  // Return a copy of the current formState
  return { ...formState };
};

// ===== Form Submission =====
// Update handleSubmit to include validation
const handleSubmit = (e) => {
  e.preventDefault();

  const formData = getFormData();

  fetch("https://form-handler.clients-248.workers.dev/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        toast.success("Form submitted successfully!");
        clearStoredFormData();

        // If you want to show the ChatGPT analysis
        if (data.analysis) {
          console.log("AI Analysis:", data.analysis);
        }
      } else {
        throw new Error(data.error || "Submission failed");
      }
    })
    .catch((error) => {
      toast.error("Failed to submit form: " + error.message);
    });
};

// Attach submit handler to element with data-alt="submit"
document
  .querySelectorAll('[data-alt="submit"]')
  .forEach((btn) => btn.addEventListener("click", handleSubmit));

// Keep the form submit handler too (if needed)
document.addEventListener("submit", handleSubmit);

document.addEventListener("DOMContentLoaded", () => {
  initializeInputMap();
  attachInputListeners();
  initPlacesAutocomplete(formState); // Initialize Places Autocomplete

  // Show initial step
  const queryStep = Number(getQueryParam("step"));
  if (queryStep && queryStep >= 1 && queryStep <= 5) {
    formStepState.currentStep = queryStep;
  }
  formState.currentStep = formStepState.currentStep;
  showStep(formStepState.currentStep);
});
