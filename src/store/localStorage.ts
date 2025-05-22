export function loadState<T>(): T | undefined {
  try {
    const serializedState = localStorage.getItem("reduxState");
    if (!serializedState) return undefined;
    return JSON.parse(serializedState) as T;
  } catch (e) {
    console.warn("Could not load state from localStorage", e);
    return undefined;
  }
}

export function saveState<T>(state: T): void {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem("reduxState", serializedState);
  } catch (e) {
    console.warn("Could not save state to localStorage", e);
  }
}
