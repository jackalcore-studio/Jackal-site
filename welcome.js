(() => {
  "use strict";

  const PROJECT_URL = "https://lmmbdkcvcytlqkjdfjcc.supabase.co";
  const PUBLISHABLE_KEY =
    "sb_publishable_12dAHPDWfLpV_E6a3NmD1A_MtheTgLO";

  const GUEST_KEY = "jackalcore_continue_as_guest";

  const modal = document.getElementById("welcome-modal");

  if (!modal) {
    return;
  }

  if (!window.supabase) {
    console.error("Supabase did not load.");
    return;
  }

  const closeButtons = modal.querySelectorAll("[data-close-welcome]");

  const client = window.supabase.createClient(
    PROJECT_URL,
    PUBLISHABLE_KEY
  );

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");

    localStorage.setItem(GUEST_KEY, "true");
  }

  function openModal() {
    modal.hidden = false;
    document.body.classList.add("modal-open");
  }

  async function decideWhetherToShow() {
    try {
      const { data, error } = await client.auth.getSession();

      if (error) {
        throw error;
      }

      const isSignedIn = Boolean(data.session);
      const choseGuest =
        localStorage.getItem(GUEST_KEY) === "true";

      if (!isSignedIn && !choseGuest) {
        openModal();
      }
    } catch (error) {
      console.error("Could not check account session:", error);

      const choseGuest =
        localStorage.getItem(GUEST_KEY) === "true";

      if (!choseGuest) {
        openModal();
      }
    }
  }

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      closeModal();
    }
  });

  decideWhetherToShow();
})();
