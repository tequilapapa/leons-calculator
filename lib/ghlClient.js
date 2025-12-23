// lib/ghlClient.js

const GHL_API_BASE = "https://rest.gohighlevel.com/v1";

if (!process.env.GHL_API_KEY) {
  console.warn("[GHL] Missing GHL_API_KEY in environment variables");
}

/**
 * Basic wrapper to call Go High Level API
 * @param {string} path - e.g. "/contacts/"
 * @param {object} options - fetch options
 */
export async function ghlFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.GHL_API_KEY}`,
    ...(options.headers || {}),
  };

  const res = await fetch(`${GHL_API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[GHL] Error:", res.status, text);
    throw new Error(`GHL request failed: ${res.status} ${text}`);
  }

  return res.json();
}

/**
 * Example: create/update a contact from a Wix log event
 */
export async function upsertContactFromWixEvent(event) {
  // Shape this however you want; just an example
  const {
    email,
    name,
    phone,
    zip,
    source = "leons-calculator",
    notes,
  } = event;

  if (!email && !phone) {
    console.warn("[GHL] No email or phone on event, skipping contact");
    return null;
  }

  const payload = {
    email,
    name,
    phone,
    tags: [source],
    customField: {
      zip,
    },
    // You can map more advanced GHL fields here later
  };

  return ghlFetch("/contacts/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

