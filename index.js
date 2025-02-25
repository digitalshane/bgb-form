// ===== Form State Management =====

// Factory function to create a reactive form state using Proxy
const createFormState = (initialState = {}) => {
  const handler = {
    set: (target, key, value) => {
      target[key] = value;
      console.log(`State updated: ${key} = ${value}`);
      return true;
    },
  };
  return new Proxy({ ...initialState }, handler);
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

// Create a map of data-input elements to their corresponding values
const inputMap = {};

// Function to initialize the input map by finding all elements with data-input attribute
const initializeInputMap = () => {
  document.querySelectorAll("[data-input]").forEach((element) => {
    const inputKey = element.getAttribute("data-input");
    if (inputKey) {
      // Store the element reference in the map
      inputMap[inputKey] = element;

      // Initialize the formState with any existing values
      if (element.value) {
        formState[inputKey] = element.value;
      }
    }
  });
  console.log("Input map initialized:", Object.keys(inputMap));
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

  if (direction === "next" && formStepState.currentStep < 5) {
    // Changed from 4 to 5
    formStepState.currentStep++;
  } else if (direction === "back" && formStepState.currentStep > 1) {
    formStepState.currentStep--;
  }
  showStep(formStepState.currentStep);
  console.log("Current form data:", formState);
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
const handleSubmit = (e) => {
  e.preventDefault();

  // Get the latest form data
  const formData = getFormData();
  console.log("Submitting form with data:", formData);

  // Example: Sending the state as a JSON payload via fetch
  fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  })
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then((data) => console.log("Form submitted successfully:", data))
    .catch((error) => console.error("Form submission error:", error));
};

// Attach submit handler to element with data-alt="submit"
document
  .querySelectorAll('[data-alt="submit"]')
  .forEach((btn) => btn.addEventListener("click", handleSubmit));

// Keep the form submit handler too (if needed)
document.addEventListener("submit", handleSubmit);
