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
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    currentStep: 1, // sync current step in form state
  });
  
  // Handler for custom input changes
  const handleCustomChange = (e) => {
    const key = e.target.getAttribute('name');
    const value = e.target.value;
    if (key) formState[key] = value;
  };
  
  // Attach event listeners to inputs with the custom attribute
  document.querySelectorAll('[data-custom-change]').forEach((input) =>
    input.addEventListener('input', handleCustomChange)
  );
  
  // ===== Multi-Step Navigation =====
  
  // Create a map of step numbers to their corresponding DOM elements
  const stepsMap = Array.from(document.querySelectorAll('[data-step]')).reduce(
    (acc, el) => {
      const step = el.getAttribute('data-step');
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
    window.history.replaceState({}, '', url);
  };
  
  // Form step state (can be managed separately or inside formState)
  const formStepState = {
    currentStep: 1,
  };
  
  // Function to show the current step and hide others
  const showStep = (step) => {
    Object.values(stepsMap).forEach((el) => {
      el.style.display = 'none';
    });
    if (stepsMap[step]) {
      stepsMap[step].style.display = 'block';
      console.log(`Showing step ${step}`);
      // Sync the step to the form state and URL query param
      formStepState.currentStep = Number(step);
      formState.currentStep = Number(step);
      updateQueryParam('step', step);
    }
  };
  
  // Navigation handler for Next/Back buttons
  const handleStepNavigation = (e) => {
    e.preventDefault();
    const direction = e.target.getAttribute('data-alt');
    
    if (direction === 'next' && formStepState.currentStep < 4) {
      formStepState.currentStep++;
    } else if (direction === 'back' && formStepState.currentStep > 1) {
      formStepState.currentStep--;
    }
    showStep(formStepState.currentStep);
  };
  
  // Attach event listeners for next and back navigation
  document.querySelectorAll('[data-alt="next"], [data-alt="back"]').forEach((btn) =>
    btn.addEventListener('click', handleStepNavigation)
  );
  
  // ===== Initialize Step on Load =====
  document.addEventListener('DOMContentLoaded', () => {
    // Check if the URL contains a step query parameter
    const queryStep = Number(getQueryParam('step'));
    if (queryStep && queryStep >= 1 && queryStep <= 4) {
      formStepState.currentStep = queryStep;
    }
    // Sync formState and show the correct step
    formState.currentStep = formStepState.currentStep;
    showStep(formStepState.currentStep);
  });
  
  // ===== Form Submission =====
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting form with state:', formState);
    
    // Example: Sending the state as a JSON payload via fetch
    fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formState),
    })
      .then((response) => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then((data) => console.log('Form submitted successfully:', data))
      .catch((error) => console.error('Form submission error:', error));
  };
  
  document.querySelector('#multiStepForm').addEventListener('submit', handleSubmit);
``  