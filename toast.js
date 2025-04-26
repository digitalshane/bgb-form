// toast.js
export const createToast = () => {
  // First create the toast container style
  const style = document.createElement("style");
  style.textContent = `
    .toast-container {
      position: fixed;
      top: 80%;
      right: 20px;
      z-index: 9999;
    }
    .toast {
      min-width: 250px;
      margin: 10px;
      padding: 15px;
      border-radius: 4px;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease-in-out;
    }
    .toast-error {
      background-color: #f44336;
    }
    .toast-success {
      background-color: #4CAF50;
    }
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  // Create toast container
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
        <span>${message}</span>
        <span style="margin-left: 10px; cursor: pointer;" onclick="this.parentElement.remove()">×</span>
      `;

      toastContainer.appendChild(toast);

      // Remove after 5 seconds
      setTimeout(() => {
        toast.remove();
      }, 5000);
    },

    error(message) {
      this.show(message, "error");
    },

    success(message) {
      this.show(message, "success");
    },
  };
};
