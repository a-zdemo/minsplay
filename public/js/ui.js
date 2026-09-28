export function showLoading(message = "Loading Minsplay...") {
  const main = document.querySelector("#main-content");

  if (!main) return;

  main.innerHTML = `
    <div class="loading-screen">
      <div class="loading-spinner" aria-hidden="true"></div>
      <p>${message}</p>
    </div>
  `;
}

export function showError(message = "Something went wrong.") {
  const main = document.querySelector("#main-content");

  if (!main) return;

  main.innerHTML = `
    <section class="error-page">
      <h1>Oops!</h1>
      <p>${message}</p>

      <button type="button" data-route="/">
        Go Home
      </button>
    </section>
  `;
}

export function setDocumentTitle(title) {
  document.title = title
    ? `${title} | Minsplay`
    : "Minsplay";
}