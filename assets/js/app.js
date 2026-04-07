(() => {
  const data = window.novaData || {};
  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });

  const categoryGrid = document.querySelector("[data-category-grid]");
  const productGrid = document.querySelector("[data-product-grid]");
  const arrivalGrid = document.querySelector("[data-arrival-grid]");
  const testimonialGrid = document.querySelector("[data-testimonial-grid]");
  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const cartCountElements = Array.from(document.querySelectorAll("[data-cart-count]"));
  const toastBox = document.querySelector("[data-toast-box]");
  const toastMessage = document.querySelector("[data-toast-message]");
  const header = document.querySelector("[data-header]");
  const mobileMenu = document.getElementById("mobile-menu");
  const menuOpenButton = document.querySelector("[data-menu-open]");
  const newsletterForm = document.querySelector("[data-newsletter-form]");
  const yearTarget = document.querySelector("[data-current-year]");
  const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
  const sections = Array.from(document.querySelectorAll("main section[id]"));
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let activeFilter = "all";
  let cartCount = 0;
  let toastTimer = null;
  let revealObserver = null;

  const setYear = () => {
    if (yearTarget) {
      yearTarget.textContent = new Date().getFullYear();
    }
  };

  const scanIcons = () => {
    if (window.Iconify && typeof window.Iconify.scan === "function") {
      window.Iconify.scan();
    }
  };

  const showToast = (message) => {
    if (!toastBox || !toastMessage) {
      return;
    }

    toastMessage.textContent = message;
    toastBox.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toastBox.classList.remove("is-visible");
    }, 2600);
  };

  const updateCartCount = () => {
    cartCountElements.forEach((element) => {
      element.textContent = String(cartCount);
      element.style.transform = "scale(1.18)";

      window.setTimeout(() => {
        element.style.transform = "";
      }, 180);
    });
  };

  const renderCategories = () => {
    if (!categoryGrid || !Array.isArray(data.categories)) {
      return;
    }

    categoryGrid.innerHTML = data.categories.map((category, index) => `
      <article class="category-card" data-reveal style="transition-delay:${index * 90}ms">
        <img class="category-card__image" src="${category.image}" alt="${category.alt}" loading="lazy" decoding="async">
        <div class="category-card__overlay"></div>
        <div class="category-card__content">
          <span class="category-card__meta">${category.count} products</span>
          <h3>${category.title}</h3>
          <p>${category.description}</p>
          <span class="inline-link">
            Explore
            <span class="iconify" data-icon="mdi:arrow-top-right"></span>
          </span>
        </div>
      </article>
    `).join("");
  };

  const renderProducts = () => {
    if (!productGrid || !Array.isArray(data.products)) {
      return;
    }

    const visibleProducts = activeFilter === "all"
      ? data.products
      : data.products.filter((product) => product.category === activeFilter);

    productGrid.innerHTML = visibleProducts.map((product, index) => `
      <article class="product-card" data-reveal style="transition-delay:${index * 70}ms">
        <div class="product-card__media">
          <img src="${product.image}" alt="${product.alt}" loading="lazy" decoding="async">
          <span class="product-badge ${product.badgeTone === "accent" ? "product-badge--accent" : ""}">${product.badge}</span>
          <button class="product-card__quick-add" type="button" data-add-to-cart="${product.name}">
            Quick add
          </button>
        </div>
        <div class="product-card__body">
          <div>
            <span class="product-card__category">${product.label}</span>
            <h3>${product.name}</h3>
          </div>
          <p class="product-card__description">${product.description}</p>
          <div class="product-card__footer">
            <span class="product-card__price">${currency.format(product.price)}</span>
            <button class="icon-button icon-button--small" type="button" data-add-to-cart="${product.name}" aria-label="Add ${product.name}">
              <span class="iconify" data-icon="mdi:plus"></span>
            </button>
          </div>
        </div>
      </article>
    `).join("");

    observeReveals(productGrid);
    scanIcons();
  };

  const renderArrivals = () => {
    if (!arrivalGrid || !Array.isArray(data.arrivals)) {
      return;
    }

    arrivalGrid.innerHTML = data.arrivals.map((item, index) => `
      <article class="arrival-card" data-reveal style="transition-delay:${index * 80}ms">
        <div class="arrival-card__media">
          <img src="${item.image}" alt="${item.alt}" loading="lazy" decoding="async">
        </div>
        <div class="arrival-card__body">
          <span class="arrival-card__meta">${item.label}</span>
          <h3>${item.name}</h3>
          <p>${item.description}</p>
          <div class="product-card__footer">
            <span class="arrival-card__price">${currency.format(item.price)}</span>
            <button class="icon-button icon-button--small" type="button" data-add-to-cart="${item.name}" aria-label="Add ${item.name}">
              <span class="iconify" data-icon="mdi:plus"></span>
            </button>
          </div>
        </div>
      </article>
    `).join("");
  };

  const renderTestimonials = () => {
    if (!testimonialGrid || !Array.isArray(data.testimonials)) {
      return;
    }

    testimonialGrid.innerHTML = data.testimonials.map((testimonial, index) => `
      <article class="review-card" data-reveal style="transition-delay:${index * 90}ms">
        <div class="review-card__stars" aria-label="${testimonial.rating} out of 5 stars">
          ${Array.from({ length: 5 }, (_, starIndex) => `
            <span class="iconify" data-icon="${starIndex < testimonial.rating ? "mdi:star" : "mdi:star-outline"}"></span>
          `).join("")}
        </div>
        <p class="review-card__quote">"${testimonial.quote}"</p>
        <div class="review-card__author">
          <img src="${testimonial.image}" alt="${testimonial.alt}" loading="lazy" decoding="async">
          <div>
            <strong>${testimonial.author}</strong>
            <span>${testimonial.role}</span>
          </div>
        </div>
      </article>
    `).join("");
  };

  const setupRevealObserver = () => {
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      document.querySelectorAll("[data-reveal]").forEach((element) => {
        element.classList.add("is-visible");
      });
      return;
    }

    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.14,
      rootMargin: "0px 0px -60px 0px"
    });

    observeReveals(document);
  };

  const observeReveals = (root) => {
    const context = root || document;

    if (prefersReducedMotion) {
      context.querySelectorAll("[data-reveal]").forEach((element) => {
        element.classList.add("is-visible");
      });
      return;
    }

    if (!revealObserver) {
      return;
    }

    context.querySelectorAll("[data-reveal]").forEach((element) => {
      if (!element.classList.contains("is-visible")) {
        revealObserver.observe(element);
      }
    });
  };

  const setActiveFilter = (button) => {
    const nextFilter = button?.dataset.filter;

    if (!nextFilter || nextFilter === activeFilter) {
      return;
    }

    activeFilter = nextFilter;

    filterButtons.forEach((filterButton) => {
      const isActive = filterButton === button;
      filterButton.classList.toggle("is-active", isActive);
      filterButton.setAttribute("aria-pressed", String(isActive));
    });

    renderProducts();
  };

  const openMenu = () => {
    if (!mobileMenu) {
      return;
    }

    mobileMenu.classList.add("is-open");
    mobileMenu.setAttribute("aria-hidden", "false");
    document.body.classList.add("menu-open");

    if (menuOpenButton) {
      menuOpenButton.setAttribute("aria-expanded", "true");
    }
  };

  const closeMenu = () => {
    if (!mobileMenu) {
      return;
    }

    mobileMenu.classList.remove("is-open");
    mobileMenu.setAttribute("aria-hidden", "true");
    document.body.classList.remove("menu-open");

    if (menuOpenButton) {
      menuOpenButton.setAttribute("aria-expanded", "false");
    }
  };

  const syncHeaderState = () => {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    }
  };

  const syncActiveSection = () => {
    if (!sections.length || !navLinks.length) {
      return;
    }

    const offset = window.scrollY + 160;
    let currentId = sections[0].id;

    sections.forEach((section) => {
      if (offset >= section.offsetTop) {
        currentId = section.id;
      }
    });

    navLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${currentId}`;
      link.classList.toggle("is-active", isActive);
    });
  };

  const handleDocumentClick = (event) => {
    const target = event.target;
    const toastTrigger = target.closest("[data-toast]");
    const addToCartButton = target.closest("[data-add-to-cart]");
    const cartTrigger = target.closest("[data-cart-trigger]");
    const filterButton = target.closest("[data-filter]");
    const menuOpenTrigger = target.closest("[data-menu-open]");
    const menuCloseTrigger = target.closest("[data-menu-close]");
    const mobileLink = target.closest("[data-mobile-link]");

    if (toastTrigger) {
      showToast(toastTrigger.dataset.toast);
      return;
    }

    if (addToCartButton) {
      cartCount += 1;
      updateCartCount();
      showToast(`${addToCartButton.dataset.addToCart} added to cart preview.`);
      return;
    }

    if (cartTrigger) {
      const message = cartCount
        ? `Cart preview contains ${cartCount} item${cartCount === 1 ? "" : "s"}.`
        : "Your cart preview is still empty.";
      showToast(message);
      return;
    }

    if (filterButton) {
      setActiveFilter(filterButton);
      return;
    }

    if (menuOpenTrigger) {
      openMenu();
      return;
    }

    if (menuCloseTrigger || mobileLink) {
      closeMenu();
    }
  };

  const handleNewsletterSubmit = (event) => {
    event.preventDefault();
    newsletterForm.reset();
    showToast("Thanks for subscribing to the preview list.");
  };

  const handleKeydown = (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  };

  const handleScroll = () => {
    syncHeaderState();
    syncActiveSection();
  };

  const init = () => {
    setYear();
    renderCategories();
    renderProducts();
    renderArrivals();
    renderTestimonials();
    setupRevealObserver();
    observeReveals(document);
    scanIcons();
    syncHeaderState();
    syncActiveSection();

    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleKeydown);
    window.addEventListener("scroll", handleScroll, { passive: true });

    if (newsletterForm) {
      newsletterForm.addEventListener("submit", handleNewsletterSubmit);
    }
  };

  init();
})();
