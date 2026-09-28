const STORAGE_PREFIX = "minsplay_";

function getKey(key) {
  return `${STORAGE_PREFIX}${key}`;
}

export function setItem(key, value) {
  try {
    localStorage.setItem(getKey(key), JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Storage write failed:", error);
    return false;
  }
}

export function getItem(key, defaultValue = null) {
  try {
    const value = localStorage.getItem(getKey(key));

    if (value === null) {
      return defaultValue;
    }

    return JSON.parse(value);
  } catch (error) {
    console.error("Storage read failed:", error);
    return defaultValue;
  }
}

export function removeItem(key) {
  try {
    localStorage.removeItem(getKey(key));
    return true;
  } catch (error) {
    console.error("Storage removal failed:", error);
    return false;
  }
}

export function clearStorage() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(STORAGE_PREFIX))
      .forEach((key) => localStorage.removeItem(key));

    return true;
  } catch (error) {
    console.error("Storage clear failed:", error);
    return false;
  }
}