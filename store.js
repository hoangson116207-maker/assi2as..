const CART_STORAGE_KEY = "techgear-cart-v2";
const ADMIN_DEMO_CODE = "TG2026";
const defaultCart = [
    { id: "akko-5075b-plus", name: "Akko 5075B Plus", price: 1890000, quantity: 1 }
];

function loadCart() {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!savedCart) {
        return defaultCart.map((item) => ({ ...item }));
    }

    const parsedCart = JSON.parse(savedCart);
    if (!Array.isArray(parsedCart)) {
        return defaultCart.map((item) => ({ ...item }));
    }

    return parsedCart.filter((item) =>
        typeof item.id === "string"
        && typeof item.name === "string"
        && Number.isFinite(item.price)
        && Number.isInteger(item.quantity)
        && item.quantity > 0
    );
}

let cart = loadCart();
let previousFocus = null;

function formatPrice(amount) {
    return `${new Intl.NumberFormat("vi-VN").format(amount)}đ`;
}

function saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function renderCart() {
    document.querySelectorAll("[data-cart-count]").forEach((count) => {
        count.textContent = cart.reduce((total, item) => total + item.quantity, 0);
    });

    document.querySelectorAll("[data-cart-items]").forEach((list) => {
        list.replaceChildren();
        if (cart.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.className = "cart-empty";
            emptyMessage.textContent = "Giỏ hàng của bạn đang trống.";
            list.append(emptyMessage);
            return;
        }

        cart.forEach((item) => {
            const row = document.createElement("article");
            row.className = "cart-line";

            const details = document.createElement("div");
            const name = document.createElement("p");
            name.className = "cart-line-name";
            name.textContent = `${item.name} × ${item.quantity}`;
            const price = document.createElement("p");
            price.className = "cart-line-price";
            price.textContent = formatPrice(item.price * item.quantity);
            details.append(name, price);

            const removeButton = document.createElement("button");
            removeButton.className = "remove-item";
            removeButton.type = "button";
            removeButton.dataset.removeItem = item.id;
            removeButton.textContent = "xóa";

            row.append(details, removeButton);
            list.append(row);
        });
    });

    const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    document.querySelectorAll("[data-cart-subtotal]").forEach((element) => {
        element.textContent = formatPrice(subtotal);
    });

    document.querySelectorAll("[data-checkout-button]").forEach((button) => {
        button.disabled = cart.length === 0;
    });
}

function openCart() {
    const overlay = document.querySelector("[data-cart-overlay]");
    if (!overlay) {
        return;
    }

    previousFocus = document.activeElement;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
    overlay.querySelector("[data-cart-close]").focus();
}

function closeCart() {
    const overlay = document.querySelector("[data-cart-overlay]");
    if (!overlay) {
        return;
    }

    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-locked");
    if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
    }
}

document.querySelectorAll("[data-cart-trigger]").forEach((button) => {
    button.addEventListener("click", openCart);
});

document.querySelectorAll("[data-cart-close]").forEach((button) => {
    button.addEventListener("click", closeCart);
});

document.querySelectorAll("[data-cart-overlay]").forEach((overlay) => {
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
            closeCart();
        }
    });
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.querySelector(".modal-overlay.is-open")) {
        closeCart();
    }
});

document.querySelectorAll("[data-add-to-cart]").forEach((button) => {
    button.addEventListener("click", () => {
        const { id, name, price } = button.dataset;
        const numericPrice = Number(price);
        if (!id || !name || !Number.isSafeInteger(numericPrice) || numericPrice <= 0) {
            throw new Error("Sản phẩm cần có mã, tên và giá hợp lệ để thêm vào giỏ.");
        }

        const existingItem = cart.find((item) => item.id === id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id, name, price: numericPrice, quantity: 1 });
        }

        saveCart();
        renderCart();
        openCart();
    });
});

document.querySelectorAll("[data-cart-items]").forEach((list) => {
    list.addEventListener("click", (event) => {
        const removeButton = event.target.closest("[data-remove-item]");
        if (!removeButton) {
            return;
        }

        cart = cart.filter((item) => item.id !== removeButton.dataset.removeItem);
        saveCart();
        renderCart();
    });
});

document.querySelectorAll("[data-checkout-button]").forEach((button) => {
    button.addEventListener("click", () => {
        const form = document.querySelector("[data-checkout-form]");
        form.hidden = false;
        form.querySelector("input").focus();
    });
});

document.querySelectorAll("[data-checkout-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        window.alert("Cảm ơn bạn! Đây là bản demo, đơn hàng chưa được gửi đến máy chủ.");
        cart = [];
        saveCart();
        renderCart();
        form.reset();
        form.hidden = true;
        closeCart();
    });
});

const searchInput = document.querySelector("[data-product-search]");
const filterButtons = document.querySelectorAll("[data-category-filter]");
const productCards = document.querySelectorAll("[data-category]");

function filterProducts() {
    const searchTerm = searchInput ? searchInput.value.trim().toLocaleLowerCase("vi") : "";
    const selectedFilter = document.querySelector("[data-category-filter][aria-pressed='true']");
    const selectedCategory = selectedFilter ? selectedFilter.dataset.categoryFilter : "all";
    let visibleProducts = 0;

    productCards.forEach((card) => {
        const categoryMatches = selectedCategory === "all" || card.dataset.category === selectedCategory;
        const searchMatches = card.textContent.toLocaleLowerCase("vi").includes(searchTerm);
        const isVisible = categoryMatches && searchMatches;
        card.classList.toggle("is-hidden", !isVisible);
        if (isVisible) {
            visibleProducts += 1;
        }
    });

    const emptyResults = document.querySelector("[data-empty-results]");
    if (emptyResults) {
        emptyResults.classList.toggle("is-hidden", visibleProducts > 0);
    }
}

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        filterButtons.forEach((filterButton) => {
            filterButton.setAttribute("aria-pressed", String(filterButton === button));
        });
        filterProducts();
    });
});

if (searchInput) {
    searchInput.addEventListener("input", filterProducts);
}

document.querySelectorAll("[data-feedback-form], [data-contact-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const message = form.matches("[data-feedback-form]")
            ? "Cảm ơn bạn đã chia sẻ trải nghiệm với TechGear!"
            : "Cảm ơn bạn! Tin nhắn đã được ghi nhận trong bản demo.";
        window.alert(message);
        form.reset();
    });
});

const adminForm = document.querySelector("[data-admin-form]");
if (adminForm) {
    adminForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const enteredCode = new FormData(adminForm).get("admin-code");
        const dashboard = document.querySelector("[data-admin-dashboard]");
        if (enteredCode !== ADMIN_DEMO_CODE) {
            window.alert("Mã khóa chưa chính xác. Hãy kiểm tra mã demo được gợi ý bên dưới.");
            return;
        }

        dashboard.hidden = false;
        adminForm.reset();
        dashboard.scrollIntoView({ behavior: "smooth", block: "start" });
    });
}

renderCart();
