const STORAGE_KEY = "xmas-wishes";

const selectors = {
  form: document.querySelector("#wish-form"),
  feedback: document.querySelector(".form-feedback"),
  wishContainer: document.querySelector("#wish-container"),
  wishTemplate: document.querySelector("#wish-template"),
  wishCount: document.querySelector(".wish-count"),
  minPrice: document.querySelector("#min-price"),
  maxPrice: document.querySelector("#max-price"),
  applyFilter: document.querySelector("#apply-filter"),
  resetFilter: document.querySelector("#reset-filter"),
};

const state = {
  wishes: [],
  filters: {
    minPrice: null,
    maxPrice: null,
  },
};

function loadFromStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        state.wishes = parsed;
        return;
      }
    }
  } catch (err) {
    console.error("Fehler beim Lesen aus LocalStorage", err);
  }
  state.wishes = getSeedWishes();
  persist();
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.wishes));
  } catch (err) {
    console.error("Fehler beim Speichern in LocalStorage", err);
  }
}

function getSeedWishes() {
  return [
    {
      id: crypto.randomUUID(),
      person: "Anna",
      title: "Wollmütze in Bordeaux",
      description: "Bevorzugt handgefertigt, gerne aus Merinowolle.",
      link: "https://www.etsy.com",
      image:
        "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=600&q=80",
      price: 35.5,
      reserved: false,
    },
    {
      id: crypto.randomUUID(),
      person: "Jonas",
      title: "Brettspiel 'Cascadia'",
      description: "Familienspiel ab 10 Jahren, deutsche Ausgabe.",
      link: "https://brettspielguru.de",
      image:
        "https://images.unsplash.com/photo-1600959907703-125ba1374a12?auto=format&fit=crop&w=600&q=80",
      price: 42.99,
      reserved: true,
    },
    {
      id: crypto.randomUUID(),
      person: "Mia",
      title: "Kinderbuch 'Weihnachtswunder'",
      description: "Hardcover, gerne mit Illustrationen.",
      link: "https://www.buchhandlung.de",
      image:
        "https://images.unsplash.com/photo-1457694587812-e8bf29a43845?auto=format&fit=crop&w=600&q=80",
      price: 18.75,
      reserved: false,
    },
  ];
}

function handleSubmit(event) {
  event.preventDefault();

  const formData = new FormData(selectors.form);
  const newWish = {
    id: crypto.randomUUID(),
    person: formData.get("person")?.trim(),
    title: formData.get("title")?.trim(),
    description: formData.get("description")?.trim(),
    link: formData.get("link")?.trim(),
    image: formData.get("image")?.trim(),
    price: parseFloat(formData.get("price") ?? "0"),
    reserved: false,
  };

  if (!newWish.person || !newWish.title || Number.isNaN(newWish.price)) {
    selectors.feedback.textContent =
      "Bitte fülle mindestens Person, Wunsch und Preis aus.";
    selectors.feedback.style.color = "#bf1d1d";
    return;
  }

  state.wishes.push(newWish);
  persist();
  render();
  selectors.form.reset();
  selectors.feedback.textContent = `Der Wunsch für ${newWish.person} wurde gespeichert!`;
  selectors.feedback.style.color = "#0f7a3c";
}

function toggleReservation(id) {
  const wish = state.wishes.find((entry) => entry.id === id);
  if (!wish) return;
  wish.reserved = !wish.reserved;
  persist();
  render();
}

function applyFilters() {
  const min = selectors.minPrice.value ? parseFloat(selectors.minPrice.value) : null;
  const max = selectors.maxPrice.value ? parseFloat(selectors.maxPrice.value) : null;
  state.filters.minPrice = Number.isFinite(min) ? min : null;
  state.filters.maxPrice = Number.isFinite(max) ? max : null;
  render();
}

function resetFilters() {
  selectors.minPrice.value = "";
  selectors.maxPrice.value = "";
  state.filters.minPrice = null;
  state.filters.maxPrice = null;
  render();
}

function formatPrice(price) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}

function createImageElement(src, title) {
  const wrapper = document.createElement("div");
  wrapper.className = "wish-card__image";
  if (src) {
    const img = document.createElement("img");
    img.src = src;
    img.alt = title;
    img.loading = "lazy";
    wrapper.appendChild(img);
  } else {
    wrapper.innerHTML =
      '<span role="img" aria-label="Geschenk">🎁</span>';
  }
  return wrapper;
}

function createWishElement(wish) {
  const template = selectors.wishTemplate.content.cloneNode(true);
  const card = template.querySelector(".wish-card");
  card.dataset.id = wish.id;

  const imageSlot = template.querySelector(".wish-card__image");
  imageSlot.replaceWith(createImageElement(wish.image, wish.title));

  template.querySelector(".wish-card__title").textContent = wish.title;
  template.querySelector(".wish-card__person").textContent = `für ${wish.person}`;

  const descriptionEl = template.querySelector(".wish-card__description");
  descriptionEl.textContent = wish.description || "Keine Beschreibung vorhanden.";

  template.querySelector(".wish-card__price").textContent = `Preis: ${formatPrice(
    wish.price
  )}`;

  const linkContainer = template.querySelector(".wish-card__links");
  linkContainer.innerHTML = "";
  if (wish.link) {
    const link = document.createElement("a");
    link.href = wish.link;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Zum Wunsch";
    linkContainer.appendChild(link);
  }

  const button = template.querySelector(".reserve-btn");
  button.textContent = wish.reserved ? "Reserviert" : "Reservieren";
  button.classList.toggle("is-reserved", wish.reserved);
  button.addEventListener("click", () => toggleReservation(wish.id));

  return template;
}

function applyWishFilters(wishes) {
  const { minPrice, maxPrice } = state.filters;
  return wishes.filter((wish) => {
    const meetsMin = minPrice === null || wish.price >= minPrice;
    const meetsMax = maxPrice === null || wish.price <= maxPrice;
    return meetsMin && meetsMax;
  });
}

function render() {
  const container = selectors.wishContainer;
  container.innerHTML = "";

  let wishes = [...state.wishes];
  wishes.sort((a, b) => a.person.localeCompare(b.person) || a.title.localeCompare(b.title));
  wishes = applyWishFilters(wishes);

  selectors.wishCount.textContent = `${wishes.length} Wunsch${
    wishes.length === 1 ? "" : "e"
  }`;

  if (wishes.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent =
      "Keine Wünsche gefunden. Versuche es mit anderen Filtereinstellungen oder füge neue Wünsche hinzu.";
    container.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  wishes.forEach((wish) => {
    fragment.appendChild(createWishElement(wish));
  });
  container.appendChild(fragment);
}

function initEvents() {
  selectors.form.addEventListener("submit", handleSubmit);
  selectors.applyFilter.addEventListener("click", applyFilters);
  selectors.resetFilter.addEventListener("click", resetFilters);
  selectors.minPrice.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      applyFilters();
    }
  });
  selectors.maxPrice.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      applyFilters();
    }
  });
}

function init() {
  loadFromStorage();
  initEvents();
  render();
}

document.addEventListener("DOMContentLoaded", init);
