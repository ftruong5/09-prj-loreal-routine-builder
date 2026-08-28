/* Get references to DOM elements */
const categoryDropdown = document.getElementById("categoryDropdown");
const categoryTrigger = document.getElementById("categoryTrigger");
const categoryTriggerText = document.getElementById("categoryTriggerText");
const categoryOptions = document.getElementById("categoryOptions");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const clearSelectedBtn = document.getElementById("clearSelected");
const generateRoutineBtn = document.getElementById("generateRoutine");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

const workerUrl = "https://loreal-routine.feliciatruong55.workers.dev";

const messages = [
  {
    role: "system",
    content:
      "You are a L'Oréal skincare and beauty advisor. You'll be given a list of products the user has selected, each with a name, brand, category, and description. Build a clear, step-by-step personalized routine using only those products. Format each step exactly like this: a line starting with 'Step N: ' followed by a short title, then one or two sentences on its own line below explaining that step. Leave a blank line between steps. After the routine is built, you may also answer follow-up questions about that routine, or general questions about skincare, haircare, makeup, and fragrance. If someone asks about something unrelated to beauty or their routine, politely explain that you can only help with those topics.",
  },
];

/* Opens or closes the dropdown panel */
function toggleDropdown(forceState) {
  const isOpen = forceState !== undefined ? forceState : categoryOptions.hidden;
  categoryOptions.hidden = !isOpen;
  categoryTrigger.setAttribute("aria-expanded", String(isOpen));
} 

/* Clicking the button opens/closes the dropdown */
categoryTrigger.addEventListener("click", () => {
  toggleDropdown();
});

/* Clicking an option selects that category and closes the dropdown */
categoryOptions.addEventListener("click", (e) => {
  const option = e.target.closest("li[role='option']");
  if (!option) return;

  selectCategory(option.dataset.value, option.textContent);
});

function selectCategory(value, label) {
  categoryTriggerText.textContent = label;
  toggleDropdown(false);

  const filteredProducts = allProducts.filter(
    (product) => product.category === value
  );

  displayProducts(filteredProducts);
}

/* Closes the dropdown if the user clicks anywhere outside of it */
document.addEventListener("click", (e) => {
  if (!categoryDropdown.contains(e.target)) {
    toggleDropdown(false);
  }
});

/* Keyboard support: Escape closes it, Arrow keys move between options */
categoryTrigger.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    toggleDropdown(true);
    categoryOptions.querySelector("li").focus();
  }
});

categoryOptions.addEventListener("keydown", (e) => {
  const options = Array.from(categoryOptions.querySelectorAll("li"));
  const currentIndex = options.indexOf(document.activeElement);

  if (e.key === "ArrowDown") {
    e.preventDefault();
    const next = options[currentIndex + 1] || options[0];
    next.focus();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    const prev = options[currentIndex - 1] || options[options.length - 1];
    prev.focus();
  } else if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    const option = document.activeElement;
    selectCategory(option.dataset.value, option.textContent);
    categoryTrigger.focus();
  } else if (e.key === "Escape") {
    toggleDropdown(false);
    categoryTrigger.focus();
  }
});

// Turns the AI's "Step N: Title" formatted text into real HTML, bolding and coloring the step heading separately from its explanation.
function formatRoutineMessage(text) {
  const safe = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const blocks = safe.split(/\n\s*\n/);

  return blocks
    .map((block) => {
      const stepMatch = block.match(/^Step\s+(\d+):\s*(.+?)(?:\n([\s\S]*))?$/);

      if (stepMatch) {
        const [, stepNumber, stepTitle, stepBody] = stepMatch;
        const bodyHtml = stepBody
          ? `<p class="step-body">${stepBody.trim()}</p>`
          : "";
        return `
          <div class="routine-step">
            <p class="step-heading">Step ${stepNumber}: ${stepTitle.trim()}</p>
            ${bodyHtml}
          </div>
        `;
      }

      // Anything that isn't a recognized "Step N:" block (like an intro
      // sentence, or a follow-up answer) just renders as a normal paragraph
      return `<p>${block.trim()}</p>`;
    })
    .join("");
}

/* Adds one message to the chat window, styled by who sent it */
function addMessage(sender, text) {
  const messageWrapper = document.createElement("div");
  messageWrapper.classList.add("message-wrapper", sender);

  const label = document.createElement("div");
  label.classList.add("msg-label", sender === "ai" ? "ai-label" : "user-label");
  label.textContent = sender === "ai" ? "L'ORÉAL ASSISTANT" : "YOU";
  messageWrapper.appendChild(label);

  const bubble = document.createElement("div");
  bubble.classList.add("msg", sender);
  
  if (sender === "ai") {
    bubble.innerHTML = formatRoutineMessage(text);   
  } else {
    bubble.textContent = text;
  }

  messageWrapper.appendChild(bubble);
  chatWindow.appendChild(messageWrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

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

  // Restore any previously selected products from localStorage
  const saved = localStorage.getItem("selectedProducts");
  if (saved) {
    selectedProducts = JSON.parse(saved);
    updateSelectedProductsUI();
  }
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
  // Save the current selection so it survives a page reload
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));

  document.querySelectorAll(".product-card").forEach((card) => {
    const id = Number(card.dataset.id);
    const isSelected = selectedProducts.some((p) => p.id === id);
    card.classList.toggle("selected", isSelected);
  });

  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `<p class="placeholder-message">No products selected yet</p>`;
    return;
  }

  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) => `
    <div class="selected-chip">
      ${product.name}
      <button type="button" class="remove-chip-btn" data-id="${product.id}" aria-label="Remove ${product.name}">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `
    )
    .join("");
}

async function generateRoutine() {
  // Don't send an empty request if nothing's been picked yet
  if (selectedProducts.length === 0) {
    addMessage("ai", "Please select at least one product first.");
    return;
  }
  const productData = selectedProducts.map((product) => ({
      name: product.name,
      brand: product.brand,
      category: product.category,
      description: product.description,
    }));

  // Show a short, readable message in the chat window...
  addMessage("user", "Generate a routine using my selected products");

  // ...but send the AI the full structured details behind the scenes
  messages.push({
    role: "user",
    content: `Build a personalized routine using these products:\n${JSON.stringify(productData, null, 2)}`,
  });

  // Disable the button while we wait, so it can't be clicked repeatedly
  generateRoutineBtn.disabled = true;
  addMessage("ai", "Generating your routine...");

  try {
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages }),
    });

    const data = await response.json();
    const reply = data.choices[0].message.content;

    chatWindow.removeChild(chatWindow.lastChild);
    addMessage("ai", reply);

  // Remember the AI's routine, so it has context if the user asks a follow-up question about it in the chat below
  messages.push({ role: "assistant", content: reply });
  } catch (error) {
    console.error(error);
    chatWindow.removeChild(chatWindow.lastChild);
    addMessage("ai", "Sorry, something went wrong generating your routine. Please try again.");
  } finally {
    generateRoutineBtn.disabled = false;
  }
}

generateRoutineBtn.addEventListener("click", generateRoutine);

selectedProductsList.addEventListener("click", (e) => {
  const removeBtn = e.target.closest(".remove-chip-btn");
  if (!removeBtn) return;

  const id = Number(removeBtn.dataset.id);
  selectedProducts = selectedProducts.filter((p) => p.id !== id);
  updateSelectedProductsUI();
});

clearSelectedBtn.addEventListener("click", () => {
  selectedProducts = [];
  updateSelectedProductsUI();
});

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const question = userInput.value.trim();
  if (!question) return;

  addMessage("user", question);
  messages.push({ role: "user", content: question });

  userInput.value = "";
  userInput.disabled = true;
  document.getElementById("sendBtn").disabled = true;

  addMessage("ai", "Thinking...");

  try {
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages }),
    });

    const data = await response.json();
    const reply = data.choices[0].message.content;

    chatWindow.removeChild(chatWindow.lastChild);
    addMessage("ai", reply);

    messages.push({ role: "assistant", content: reply });
  } catch (error) {
    console.error(error);
    chatWindow.removeChild(chatWindow.lastChild);
    addMessage("ai", "Sorry, something went wrong. Please try again.");
  } finally {
    userInput.disabled = false;
    document.getElementById("sendBtn").disabled = false;
    userInput.focus();
  }
});
