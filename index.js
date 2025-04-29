// runs on page load and calls the file with everything else

document.addEventListener("DOMContentLoaded", async () => {
  if (window.location.pathname === "/form") {
    try {
      const { initForm } = await import("./form.js");
      initForm(); // <-- run it!
      console.log("Form loaded");
    } catch (err) {
      console.error("Could not load form:", err);
    }
  }
});
