// validation.js
export const createValidator = (formState) => {
  const validateField = (inputElement) => {
    const value = inputElement.value.trim();
    const fieldName = inputElement.getAttribute("data-label") || "Field";

    if (value === "") {
      inputElement.classList.add("error");
      return `${fieldName} is required`;
    }
    if (fieldName.toLowerCase() === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        inputElement.classList.add("error");
        return "Please enter a valid email";
      }
    }
    inputElement.classList.remove("error");
    return "";
  };

  const validateStep = (step) => {
    const stepNum = Number(step);
    const stepEl = document.querySelector(`[data-step="${stepNum}"]`);
    if (!stepEl) return { isValid: true, errors: [] };

    // ← Custom logic for the SERVICES step now on step 2
    if (stepNum === 2) {
      // collect all service checkboxes (including the “Other” toggle)
      const allCbs = Array.from(
        stepEl.querySelectorAll('input[type="checkbox"][data-input]')
      );
      // filter out “Other” toggle
      const serviceCbs = allCbs.filter((cb) => cb.dataset.input !== "other");
      const otherCb = allCbs.find((cb) => cb.dataset.input === "other");

      // require at least one service OR “Other”
      if (!serviceCbs.some((cb) => cb.checked) && !otherCb.checked) {
        return {
          isValid: false,
          errors: ["Please select at least one service or check ‘Other.’"],
        };
      }

      // if “Other” checked, require its text field
      if (otherCb.checked) {
        const otherText = stepEl.querySelector('input[data-input="otherText"]');
        if (!otherText.value.trim()) {
          otherText.classList.add("error");
          return {
            isValid: false,
            errors: ["Please specify your ‘Other’ service."],
          };
        }
      }

      return { isValid: true, errors: [] };
    }

    // fallback for other steps
    const inputs = stepEl.querySelectorAll(
      'input[data-input]:not([type="checkbox"]), textarea[data-input], select[data-input]'
    );
    const errors = [];
    inputs.forEach((input) => {
      const err = validateField(input);
      if (err) errors.push(err);
    });
    return { isValid: errors.length === 0, errors };
  };

  return { validateStep, validateField };
};
