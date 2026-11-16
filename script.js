const body = document.body;

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".main-nav");

const cartCounter = document.querySelector("[data-cart-count]");
const toast = document.querySelector(".toast");

const CART_STORAGE_KEY = "ruangrasa-cart";
const productCatalog = {
    "Lilin Aromaterapi Senja": { price: 89000, category: "RITUAL RUMAH", image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1000&q=90", description: "Aroma lembut yang mengingatkan pada sore yang tenang. Perpaduan bergamot, kayu cedar, dan sedikit vanilla untuk menghangatkan ruangmu." },
    "Mug Keramik Pagi": { price: 75000, category: "PERLENGKAPAN RUMAH", image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=1000&q=90", description: "Mug keramik untuk menemani ritual minum kopi atau teh setiap pagi." },
    "Tas Kanvas Sederhana": { price: 119000, category: "GAYA HIDUP", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=90", description: "Tas kanvas praktis untuk menemani aktivitas dan perjalanan sehari-hari." },
    "Vas Kaca Embun": { price: 145000, category: "DEKORASI RUMAH", image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1000&q=90", description: "Vas kaca sederhana untuk memberi sentuhan segar pada sudut ruang." },
    "Notebook Linen": { price: 68000, category: "GAYA HIDUP", image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=1000&q=90", description: "Notebook bersampul linen untuk mencatat ide, rencana, dan cerita kecil." },
    "Set Kartu Pesan": { price: 45000, category: "UNTUK DIHADIAHI", image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1000&q=90", description: "Set kartu sederhana untuk menyampaikan pesan hangat kepada orang tersayang." }
};
let cartItems = loadCart();

function loadCart() {
    try {
        const saved = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "{}");
        if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
        return Object.fromEntries(Object.entries(saved)
            .filter(([name, item]) => productCatalog[name] && Number.isInteger(item?.quantity) && item.quantity > 0)
            .map(([name, item]) => [name, { quantity: item.quantity, price: productCatalog[name].price }]));
    } catch {
        return {};
    }
}

function saveCart() {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
        showToast("Keranjang tidak dapat disimpan di browser ini.");
    }
}

/* ===========================
   MOBILE MENU
=========================== */

function initMobileMenu() {

    if (!menuButton || !navigation) return;

    menuButton.addEventListener("click", () => {

        navigation.classList.toggle("open");

        body.classList.toggle("menu-open");

        menuButton.setAttribute(
            "aria-expanded",
            navigation.classList.contains("open")
        );

    });

}


/* ===========================
   SHOPPING CART
=========================== */

function updateCart() {
    const count = Object.values(cartItems).reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll("[data-cart-count]").forEach(counter => {
        counter.textContent = count;
    });
}

function addToCart(productName, quantity = 1) {
    const product = productCatalog[productName];
    if (!product) return;
    cartItems[productName] = cartItems[productName] || { quantity: 0, price: product.price };
    cartItems[productName].quantity += quantity;
    saveCart();
    updateCart();
    showToast(`${productName} berhasil ditambahkan ke tas.`);
}

function initAddCartButtons() {
    const buttons = document.querySelectorAll(".add-cart");
    buttons.forEach(button => {
        button.addEventListener("click", () => {
            const quantity = Number(document.querySelector("[data-quantity]")?.textContent) || 1;
            addToCart(button.dataset.product, quantity);
        });
    });
    document.querySelectorAll(".cart-button").forEach(button => {
        button.addEventListener("click", openCart);
    });
}

function openCart() {
    let panel = document.querySelector(".cart-panel");
    if (!panel) {
        panel = document.createElement("section");
        panel.className = "cart-panel";
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-modal", "true");
        panel.setAttribute("aria-label", "Keranjang belanja");
        document.body.append(panel);
    }
    renderCart(panel);
    panel.hidden = false;
}

function initProductLinks() {
    document.querySelectorAll(".product-card").forEach(card => {
        const name = card.dataset.product || card.querySelector(".add-cart")?.dataset.product;
        if (!name) return;
        card.querySelectorAll('a[href="detail-produk.html"]').forEach(link => {
            link.href = `detail-produk.html?product=${encodeURIComponent(name)}`;
        });
    });
}

function renderCart(panel) {
    const entries = Object.entries(cartItems);
    const total = entries.reduce((sum, [, item]) => sum + item.price * item.quantity, 0);
    panel.innerHTML = `<div class="cart-panel-header"><h2>Tas belanja</h2><button type="button" data-cart-close aria-label="Tutup keranjang">×</button></div>
        ${entries.length ? `<ul class="cart-items">${entries.map(([name, item]) => `<li>
            <div class="cart-item-info"><strong>${name}</strong><small>${formatPrice(item.price)} / item</small>
                <div class="cart-quantity" aria-label="Jumlah ${name}">
                    <button type="button" data-cart-decrease="${name}" aria-label="Kurangi jumlah ${name}">−</button>
                    <span>${item.quantity}</span>
                    <button type="button" data-cart-increase="${name}" aria-label="Tambah jumlah ${name}">+</button>
                </div>
            </div>
            <div class="cart-item-subtotal"><strong>${formatPrice(item.price * item.quantity)}</strong>
                <button type="button" data-cart-remove="${name}" aria-label="Hapus ${name}">Hapus</button>
            </div>
        </li>`).join("")}</ul>
        <p class="cart-total">Total <strong>${formatPrice(total)}</strong></p><p class="cart-note">Keranjang ini hanya untuk pratinjau. Checkout belum tersedia.</p>` : `<p class="cart-empty">Tasmu masih kosong.</p>`}`;
    panel.querySelector("[data-cart-close]").addEventListener("click", () => { panel.hidden = true; });
    panel.querySelectorAll("[data-cart-increase], [data-cart-decrease]").forEach(button => {
        button.addEventListener("click", () => {
            const name = button.dataset.cartIncrease || button.dataset.cartDecrease;
            const change = button.hasAttribute("data-cart-increase") ? 1 : -1;
            if (change < 0 && cartItems[name].quantity === 1) {
                if (!window.confirm(`Jumlah ${name} tinggal satu. Hapus dari tas?`)) return;
            }
            cartItems[name].quantity += change;
            if (cartItems[name].quantity < 1) {
                delete cartItems[name];
            }
            saveCart();
            updateCart();
            renderCart(panel);
        });
    });
    panel.querySelectorAll("[data-cart-remove]").forEach(button => {
        button.addEventListener("click", () => {
            if (!window.confirm(`Hapus ${button.dataset.cartRemove} dari tas?`)) return;
            delete cartItems[button.dataset.cartRemove];
            saveCart();
            updateCart();
            renderCart(panel);
        });
    });
}

function formatPrice(value) {
    return `Rp${Number(value).toLocaleString("id-ID")}`;
}

function initProductDetail() {
    const name = new URLSearchParams(location.search).get("product");
    const product = productCatalog[name];
    if (!product) return;
    const title = document.querySelector(".product-detail-info h1");
    if (!title) return;
    document.title = `${name} | RuangRasa`;
    title.textContent = name;
    document.querySelector(".breadcrumbs span:last-child").textContent = name;
    document.querySelector(".product-detail-info .overline").textContent = product.category;
    document.querySelector(".product-detail-info h2").textContent = formatPrice(product.price);
    document.querySelector(".detail-description").textContent = product.description;
    if (name !== "Lilin Aromaterapi Senja") {
        const tabDescriptions = document.querySelectorAll(".detail-tabs details p");
        if (tabDescriptions[0]) tabDescriptions[0].textContent = product.description;
        if (tabDescriptions[1]) tabDescriptions[1].textContent = "Informasi bahan dan cara perawatan produk ini belum tersedia.";
    }
    const image = document.querySelector(".main-product-photo img");
    image.src = product.image;
    image.alt = name;
    const firstThumb = document.querySelector(".thumb");
    const extraThumb = document.querySelectorAll(".thumb")[1];
    if (extraThumb) extraThumb.hidden = name !== "Lilin Aromaterapi Senja";
    if (firstThumb) {
        firstThumb.dataset.full = product.image;
        firstThumb.dataset.alt = name;
        firstThumb.querySelector("img").src = product.image.replace("w=1000", "w=250");
        firstThumb.querySelector("img").alt = name;
    }
    const addButton = document.querySelector(".product-detail-info .add-cart");
    if (addButton) addButton.dataset.product = name;
}


/* ===========================
   TOAST
=========================== */

function showToast(message) {

    if (!toast) return;

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(showToast.timeout);

    showToast.timeout = setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}


/* ===========================
   QUANTITY
=========================== */

function initQuantitySelector() {

    const output = document.querySelector("[data-quantity]");
    const minus = document.querySelector("[data-quantity-minus]");
    const plus = document.querySelector("[data-quantity-plus]");

    if (!output) return;

    let quantity = 1;

    function render() {

        output.textContent = quantity;

    }

    plus?.addEventListener("click", () => {

        quantity++;

        render();

    });

    minus?.addEventListener("click", () => {

        if (quantity > 1) {

            quantity--;

            render();

        }

    });

    render();

}

/* ===========================
   PRODUCT GALLERY
=========================== */

function initGallery() {

    const mainImage = document.querySelector(".main-product-photo img");
    const thumbs = [...document.querySelectorAll(".thumb")];

    if (!mainImage || !thumbs.length) return;

    thumbs.forEach(thumb => {

        thumb.addEventListener("click", () => {

            if (thumb.dataset.full) {

                mainImage.src = thumb.dataset.full;

            }

            if (thumb.dataset.alt) {

                mainImage.alt = thumb.dataset.alt;

            }

            thumbs.forEach(item => item.classList.remove("active"));

            thumb.classList.add("active");

        });

    });

}


/* ===========================
   COLOR CHOICE
=========================== */

function initColorChoice() {

    const label = document.querySelector(".color-choice strong span");
    const dots = [...document.querySelectorAll(".color-dot")];

    if (!label || !dots.length) return;

    dots.forEach(dot => {

        dot.addEventListener("click", () => {

            dots.forEach(item => item.classList.remove("active"));

            dot.classList.add("active");

            if (dot.dataset.color) {

                label.textContent = dot.dataset.color;

            }

        });

    });

}


/* ===========================
   PRODUCT FILTER
=========================== */

function initProductSearch() {

    const searchInput = document.querySelector("[data-product-search]");
    const categoryInputs = document.querySelectorAll("input[name='category']");
    const priceInputs = document.querySelectorAll("input[name='price']");
    const sortSelect = document.querySelector("[data-sort]");
    const clearButton = document.querySelector("[data-clear-filter]");

    const cards = [...document.querySelectorAll(".product-card")];
    const container = document.querySelector(".catalog-grid");

    const total = document.querySelector("[data-product-total]");
    const emptyMessage = document.querySelector(".empty-products");

    if (!cards.length) return;

    // Simpan urutan asli (Terbaru)
    cards.forEach((card, index) => {

        card.dataset.order = index;

    });

    function render() {

        let products = [...cards];

        /* =====================
           SEARCH
        ====================== */

        const keyword = searchInput.value
            .toLowerCase()
            .trim();

        if (keyword !== "") {

            products = products.filter(card =>

                card.dataset.product
                    .toLowerCase()
                    .includes(keyword)

            );

        }

        /* =====================
           CATEGORY
        ====================== */

        const category = document.querySelector(
            "input[name='category']:checked"
        ).value;

        if (category !== "all") {

            products = products.filter(card =>

                card.dataset.category === category

            );

        }

        /* =====================
        PRICE
        ===================== */

        const price = document.querySelector(
            "input[name='price']:checked"
        ).value;

        switch (price) {

            case "100000":

                products = products.filter(card => {

                    return Number(card.dataset.price) < 100000;

                });

                break;

            case "200000":

                products = products.filter(card => {

                    const harga = Number(card.dataset.price);

                    return harga >= 100000 && harga <= 200000;

                });

                break;

        }

        /* =====================
           SORT
        ====================== */

        switch (sortSelect.value) {

            case "low":

                products.sort((a, b) =>

                    Number(a.dataset.price) -
                    Number(b.dataset.price)

                );

                break;

            case "high":

                products.sort((a, b) =>

                    Number(b.dataset.price) -
                    Number(a.dataset.price)

                );

                break;

            default:

                products.sort((a, b) =>

                    Number(a.dataset.order) -
                    Number(b.dataset.order)

                );

        }

        /* =====================
           RENDER
        ====================== */

        cards.forEach(card => {

            card.style.display = "none";

        });

        products.forEach(card => {

            card.style.display = "";

            container.appendChild(card);

        });

        if (total) {

            total.textContent = products.length;

        }

        if (emptyMessage) {

            emptyMessage.hidden = products.length !== 0;

        }

    }

    /* =====================
       EVENTS
    ====================== */

    searchInput.addEventListener("input", render);

    categoryInputs.forEach(input => {

        input.addEventListener("change", render);

    });

    priceInputs.forEach(input => {

        input.addEventListener("change", render);

    });

    sortSelect.addEventListener("change", render);

    clearButton.addEventListener("click", () => {

        searchInput.value = "";

        document.querySelector(
            "input[name='category'][value='all']"
        ).checked = true;

        document.querySelector(
            "input[name='price'][value='all']"
        ).checked = true;

        sortSelect.value = "latest";

        render();

    });

    render();

}

/* ===========================
   FAQ SEARCH
=========================== */

function initFaqSearch() {

    const input = document.querySelector("[data-faq-search]");
    const items = [...document.querySelectorAll(".faq-page details")];
    const empty = document.querySelector("[data-faq-empty]");

    if (!input || !items.length) return;

    items.forEach(item => {

        item.dataset.faqText = item.textContent.toLowerCase();

    });

    function render() {

        const keyword = input.value.toLowerCase().trim();

        let visible = 0;

        items.forEach(item => {

            const match = keyword === "" ||
                item.dataset.faqText.includes(keyword);

            item.hidden = !match;

            if (match) visible++;

        });

        if (empty) {

            empty.hidden = visible !== 0;

        }

    }

    input.addEventListener("input", render);

    render();

}


/* ===========================
   FORMS
=========================== */

function initForms() {

    const forms = document.querySelectorAll("form[data-message]");

    forms.forEach(form => {

        form.addEventListener("submit", event => {

            event.preventDefault();

            showToast(form.dataset.message);

            form.reset();

        });

    });

}


/* ===========================
   FOOTER YEAR
=========================== */

function initYear() {

    const year = document.querySelector("[data-year]");

    if (!year) return;

    year.textContent = new Date().getFullYear();

}


/* ===========================
   INITIALIZATION
=========================== */

document.addEventListener("DOMContentLoaded", () => {

    initMobileMenu();

    initAddCartButtons();

    initQuantitySelector();

    initGallery();

    initColorChoice();

    initProductDetail();

    initProductLinks();

    initProductSearch();

    initFaqSearch();

    initForms();

    initYear();

    updateCart();

});
