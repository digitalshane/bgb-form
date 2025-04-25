// validation.js
export const createValidator = (formState) => {
  const validateField = (inputElement) => {
    const value = inputElement.value.trim();
    const fieldName = inputElement.getAttribute("data-input");

    // Check if empty
    if (value === "") {
      inputElement.classList.add("error");
      return `${fieldName} is required`;
    }

    // Check email format if it's an email field
    if (fieldName === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        inputElement.classList.add("error");
        return "Please enter a valid email";
      }
    }

    // If valid, remove error class
    inputElement.classList.remove("error");
    return "";
  };

  const validateStep = (step) => {
    const stepElement = document.querySelector(`[data-step="${step}"]`);
    if (!stepElement) return { isValid: true, errors: [] };

    const inputs = stepElement.querySelectorAll("[data-input]");
    const errors = [];

    inputs.forEach((input) => {
      const error = validateField(input);
      if (error) {
        errors.push(error);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  return {
    validateStep,
    validateField,
  };
};
