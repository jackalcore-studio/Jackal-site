(() => {
  "use strict";

  const PROJECT_URL =
    "https://lmmbdkcvcytlqkjdfjcc.supabase.co";

  const PUBLISHABLE_KEY =
    "sb_publishable_12dAHPDWfLpV_E6a3NmD1A_MtheTgLO";

  const CONFIRM_REDIRECT =
    "https://jackalcore.club/account.html";

  if (!window.supabase) {
    console.error("Supabase did not load.");
    return;
  }

  const client = window.supabase.createClient(
    PROJECT_URL,
    PUBLISHABLE_KEY
  );

  const tabs =
    document.querySelectorAll("[data-auth-tab]");

  const panels =
    document.querySelectorAll("[data-auth-panel]");

  const status =
    document.getElementById("auth-status");

  const signupForm =
    document.getElementById("signup-form");

  const signinForm =
    document.getElementById("signin-form");

  const resetButton =
    document.getElementById("reset-password-button");

  const signoutButton =
    document.getElementById("signout-button");

  const signedInPanel =
    document.getElementById("signed-in-panel");

  const signedInEmail =
    document.getElementById("signed-in-email");

  const authTabs =
    document.querySelector(".auth-tabs");

  function showStatus(message, type = "success") {
    status.textContent = message;
    status.className =
      `auth-status is-visible is-${type}`;
  }

  function clearStatus() {
    status.textContent = "";
    status.className = "auth-status";
  }

  function setMode(mode) {
    clearStatus();

    tabs.forEach((tab) => {
      const selected =
        tab.dataset.authTab === mode;

      tab.classList.toggle(
        "is-active",
        selected
      );

      tab.setAttribute(
        "aria-selected",
        String(selected)
      );
    });

    panels.forEach((panel) => {
      panel.hidden =
        panel.dataset.authPanel !== mode;
    });
  }

  function setBusy(form, busy) {
    const button =
      form.querySelector('button[type="submit"]');

    button.disabled = busy;

    button.setAttribute(
      "aria-busy",
      String(busy)
    );
  }

  function showSignedIn(user) {
    authTabs.hidden = true;

    panels.forEach((panel) => {
      panel.hidden = true;
    });

    signedInPanel.hidden = false;

    signedInEmail.textContent =
      user.email || "Signed-in account";

    localStorage.removeItem(
      "jackalcore_continue_as_guest"
    );
  }

  function showSignedOut() {
    authTabs.hidden = false;
    signedInPanel.hidden = true;
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setMode(tab.dataset.authTab);
    });
  });

  signupForm.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();
      clearStatus();

      const email =
        document
          .getElementById("signup-email")
          .value
          .trim();

      const password =
        document
          .getElementById("signup-password")
          .value;

      const confirmation =
        document
          .getElementById(
            "signup-password-confirm"
          )
          .value;

      if (password !== confirmation) {
        showStatus(
          "The passwords do not match.",
          "error"
        );

        return;
      }

      setBusy(signupForm, true);

      try {
        const { data, error } =
          await client.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo:
                CONFIRM_REDIRECT
            }
          });

        if (error) {
          throw error;
        }

        if (data.session) {
          showSignedIn(data.user);

          showStatus(
            "Account created and signed in.",
            "success"
          );
        } else {
          showStatus(
            "Account created. Check your email and click the confirmation link before signing in.",
            "success"
          );

          signupForm.reset();
        }
      } catch (error) {
        showStatus(
          error.message ||
            "Could not create the account.",
          "error"
        );
      } finally {
        setBusy(signupForm, false);
      }
    }
  );

  signinForm.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();
      clearStatus();

      const email =
        document
          .getElementById("signin-email")
          .value
          .trim();

      const password =
        document
          .getElementById("signin-password")
          .value;

      setBusy(signinForm, true);

      try {
        const { data, error } =
          await client.auth.signInWithPassword({
            email,
            password
          });

        if (error) {
          throw error;
        }

        showSignedIn(data.user);

        showStatus(
          "Signed in successfully.",
          "success"
        );

        signinForm.reset();
      } catch (error) {
        showStatus(
          error.message ||
            "Could not sign in. Check your email and password.",
          "error"
        );
      } finally {
        setBusy(signinForm, false);
      }
    }
  );

  resetButton.addEventListener(
    "click",
    async () => {
      const enteredEmail =
        document
          .getElementById("signin-email")
          .value
          .trim();

      const email =
        enteredEmail ||
        window.prompt(
          "What email address should receive the reset link?"
        );

      if (!email) {
        return;
      }

      clearStatus();
      resetButton.disabled = true;

      try {
        const { error } =
          await client.auth.resetPasswordForEmail(
            email,
            {
              redirectTo: CONFIRM_REDIRECT
            }
          );

        if (error) {
          throw error;
        }

        showStatus(
          "Password-reset email requested. Check your inbox.",
          "success"
        );
      } catch (error) {
        showStatus(
          error.message ||
            "Could not request a reset email.",
          "error"
        );
      } finally {
        resetButton.disabled = false;
      }
    }
  );

  signoutButton.addEventListener(
    "click",
    async () => {
      clearStatus();

      try {
        const { error } =
          await client.auth.signOut();

        if (error) {
          throw error;
        }

        showSignedOut();
        setMode("signin");

        showStatus(
          "Signed out.",
          "success"
        );
      } catch (error) {
        showStatus(
          error.message ||
            "Could not sign out.",
          "error"
        );
      }
    }
  );

  async function initialize() {
    const requestedMode =
      new URLSearchParams(
        window.location.search
      ).get("mode");

    setMode(
      requestedMode === "signin"
        ? "signin"
        : "signup"
    );

    try {
      const { data, error } =
        await client.auth.getSession();

      if (error) {
        throw error;
      }

      if (data.session?.user) {
        showSignedIn(data.session.user);
      }
    } catch (error) {
      showStatus(
        "Could not check your current login session.",
        "error"
      );

      console.error(error);
    }

    client.auth.onAuthStateChange(
      (event, session) => {
        window.setTimeout(() => {
          if (session?.user) {
            showSignedIn(session.user);
          } else if (event === "SIGNED_OUT") {
            showSignedOut();
          }
        }, 0);
      }
    );
  }

  initialize();
})();
