// toast.js

export const createToast = () => {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector(".toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  return {
    show(message, type = "success") {
      const toast = document.createElement("div");
      toast.className = `toast toast-${type}`;
      toast.innerHTML = `
        <div class="toast-content">
          ${message}
          <button class="toast-close">&times;</button>
        </div>
      `;

      // Add close button functionality
      const closeBtn = toast.querySelector(".toast-close");
      closeBtn.addEventListener("click", () => {
        toast.classList.add("toast-hide");
        setTimeout(() => toast.remove(), 300);
      });

      toastContainer.appendChild(toast);

      // Auto remove after 5 seconds
      setTimeout(() => {
        toast.classList.add("toast-hide");
        setTimeout(() => toast.remove(), 300);
      }, 5000);
    },

    error(message) {
      this.show(message, "error");
    },

    success(message) {
      this.show(message, "success");
    },

    warning(message) {
      this.show(message, "warning");
    },
  };
};
