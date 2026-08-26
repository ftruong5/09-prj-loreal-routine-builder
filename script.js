/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

let allProducts = [];
let selectedProducts = [];

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Runs once when the page loads: fetch all products up front */
async function init() {
  allProducts = await loadProducts();
}
init();

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map((product) => {
      const isSelected = selectedProducts.some((p) => p.id === product.id);

      return `
    <div class="product-card ${isSelected ? "selected" : ""}" data-id="${product.id}">
      <div class="product-card-top">
        <img src="${product.image}" alt="${product.name}">
        <div class="product-info">
          <h3>${product.name}</h3>
          <p>${product.brand}</p>
          <button
            type="button"
            class="info-btn"
            aria-expanded="false"
            aria-controls="desc-${product.id}"
          >
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            <span class="visually-hidden">Show description</span>
          </button>
        </div>
      </div>
      <div class="description-wrapper" id="desc-${product.id}" aria-hidden="true">
        <p>${product.description}</p>
      </div>
    </div>
  `;
    })
    .join("");
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", (e) => {
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = allProducts.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

productsContainer.addEventListener("click", (e) => {
   const infoBtn = e.target.closest(".info-btn");
  if (infoBtn) {
    toggleDescription(infoBtn);
    return;
  }

  const card = e.target.closest(".product-card");
  if (!card) return;

  const id = Number(card.dataset.id);
  toggleProductSelection(id);
});



/* Adds a product to selectedProducts if it isn't already there,
   or removes it if it is. */
function toggleProductSelection(id) {
  const alreadySelected = selectedProducts.some((p) => p.id === id);

  if (alreadySelected) {
    selectedProducts = selectedProducts.filter((p) => p.id !== id);
  } else {
    const product = allProducts.find((p) => p.id === id);
    selectedProducts.push(product);
  }

  updateSelectedProductsUI();
}

/* Shows or hides a product's description, and keeps the button's
aria-expanded state and icon in sync with whether it's open. */
function toggleDescription(button) {
  const wrapperId = button.getAttribute("aria-controls");
  const wrapper = document.getElementById(wrapperId);

  const isOpen = button.getAttribute("aria-expanded") === "true";

  wrapper.classList.toggle("expanded", !isOpen);
  wrapper.setAttribute("aria-hidden", String(isOpen));
  button.setAttribute("aria-expanded", String(!isOpen));

  const icon = button.querySelector("i");
  icon.classList.toggle("fa-circle-info", isOpen);
  icon.classList.toggle("fa-circle-xmark", !isOpen);
}

/* Keeps both the card highlighting and the Selected Products list
   in sync with the current selectedProducts array. */
function updateSelectedProductsUI() {
  // Re-check every card currently on screen and toggle its "selected" class
  document.querySelectorAll(".product-card").forEach((card) => {
    const id = Number(card.dataset.id);
    const isSelected = selectedProducts.some((p) => p.id === id);
    card.classList.toggle("selected", isSelected);
  });

  // Rebuild the Selected Products list
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `<p class="placeholder-message">No products selected yet</p>`;
    return;
  }

  selectedProductsList.innerHTML = selectedProducts
    .map((product) => `<div class="selected-chip">${product.name}</div>`)
    .join("");
}

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});
