const CANVAS_ORIGIN = "https://courses.iwu.edu";
const DEFAULT_DAYS = 119;

document.addEventListener("DOMContentLoaded", async () => {
  const purposeInput = document.getElementById("purpose");
  const expiresInput = document.getElementById("expires-at");
  const hintText = document.getElementById("hint-text");
  const btnGenerate = document.getElementById("btn-generate");
  const resultSection = document.getElementById("result-section");
  const errorSection = document.getElementById("error-section");
  const tokenValue = document.getElementById("token-value");
  const tokenDetails = document.getElementById("token-details");
  const errorMessage = document.getElementById("error-message");
  const btnCopy = document.getElementById("btn-copy");
  const status = document.getElementById("status");
  const notCanvas = document.getElementById("not-canvas");
  const formSection = document.getElementById("form-section");

  const defaultExpiry = new Date(Date.now() + DEFAULT_DAYS * 24 * 60 * 60 * 1000);
  expiresInput.value = toLocalDatetimeString(defaultExpiry);
  updateHint();

  expiresInput.addEventListener("input", updateHint);

  function updateHint() {
    const val = expiresInput.value;
    if (!val) { hintText.textContent = ""; return; }
    const target = new Date(val);
    const diffMs = target - Date.now();
    if (diffMs <= 0) { hintText.textContent = "Date is in the past"; return; }
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    hintText.textContent = `≈ ${days} day${days !== 1 ? "s" : ""} from now`;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const onCanvas = tab?.url?.startsWith(CANVAS_ORIGIN);

  if (!onCanvas) {
    notCanvas.hidden = false;
    formSection.style.opacity = "0.4";
    formSection.style.pointerEvents = "none";
    return;
  }

  btnGenerate.addEventListener("click", async () => {
    const purpose = purposeInput.value.trim() || "Testing";
    const expiresAt = new Date(expiresInput.value).toISOString();

    btnGenerate.disabled = true;
    btnGenerate.textContent = "Generating…";
    resultSection.hidden = true;
    errorSection.hidden = true;
    status.textContent = "";

    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: "MAIN",
        func: generateToken,
        args: [purpose, expiresAt],
      });

      const result = results?.[0]?.result;

      if (!result) {
        throw new Error("No response from page. Are you logged in?");
      }

      if (result.error) {
        throw new Error(result.error);
      }

      tokenValue.textContent = result.visible_token || "(no token in response)";
      tokenDetails.textContent = JSON.stringify(result, null, 2);
      resultSection.hidden = false;
    } catch (err) {
      errorMessage.textContent = err.message || String(err);
      errorSection.hidden = false;
    } finally {
      btnGenerate.disabled = false;
      btnGenerate.textContent = "Generate Token";
    }
  });

  btnCopy.addEventListener("click", async () => {
    const token = tokenValue.textContent;
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      status.textContent = "Copied!";
      setTimeout(() => { status.textContent = ""; }, 2000);
    } catch {
      status.textContent = "Failed to copy";
    }
  });
});

function toLocalDatetimeString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}`;
}

/**
 * Injected into the page's MAIN world so it executes with the page's
 * origin, cookies, and session. This lets us call the Canvas API
 * exactly as if the page itself made the request.
 */
async function generateToken(purpose, expiresAt) {
  try {
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    const csrfCookie = document.cookie
      .split("; ")
      .find((c) => c.startsWith("_csrf_token="));
    const csrfToken =
      csrfMeta?.content ||
      (csrfCookie ? decodeURIComponent(csrfCookie.split("=")[1]) : null);

    const headers = { "Content-Type": "application/json" };
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }

    const res = await fetch("/api/v1/users/self/tokens", {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({
        token: {
          purpose,
          expires_at: expiresAt,
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: `HTTP ${res.status}: ${JSON.stringify(data)}` };
    }

    return data;
  } catch (err) {
    return { error: err.message || String(err) };
  }
}
