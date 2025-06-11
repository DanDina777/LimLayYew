// Global state management
const state = {
  isLoginModalOpen: false,
  isMemoryModalOpen: false,
  selectedChapter: null,
};

// Modal Management Functions
function openLoginModal() {
  state.isLoginModalOpen = true;
  const modal = document.getElementById("loginModal");
  modal.style.display = "flex";

  // Focus on password input for accessibility
  setTimeout(() => {
    const passwordInput = document.getElementById("loginPassword");
    if (passwordInput) {
      passwordInput.focus();
    }
  }, 100);

  // Prevent body scroll
  document.body.style.overflow = "hidden";
}

function closeLoginModal() {
  state.isLoginModalOpen = false;
  const modal = document.getElementById("loginModal");
  modal.style.display = "none";

  // Restore body scroll
  document.body.style.overflow = "";
}

function openMemoryModal() {
  state.isMemoryModalOpen = true;
  const modal = document.getElementById("memoryModal");
  modal.style.display = "flex";

  // Focus on name input for accessibility
  setTimeout(() => {
    const nameInput = document.getElementById("memoryName");
    if (nameInput) {
      nameInput.focus();
    }
  }, 100);

  // Prevent body scroll
  document.body.style.overflow = "hidden";
}

function closeMemoryModal() {
  state.isMemoryModalOpen = false;
  const modal = document.getElementById("memoryModal");
  modal.style.display = "none";

  // Restore body scroll
  document.body.style.overflow = "";
}

// Chapter Selection
function selectChapter(chapterElement) {
  const chapterType = chapterElement.getAttribute("data-chapter");
  state.selectedChapter = chapterType;

  // Add visual feedback
  const allChapters = document.querySelectorAll(".chapter-card");
  allChapters.forEach((card) => card.classList.remove("selected"));
  chapterElement.classList.add("selected");

  // Log for now - in real implementation, this would navigate to chapter details
  console.log(`Selected chapter: ${chapterType}`);

  // Show a temporary notification
  showNotification(
    `Selected: ${chapterElement.querySelector(".chapter-title").textContent}`,
  );
}

// Gallery Album Opening
function openGallery(albumType) {
  console.log(`Opening ${albumType} gallery`);
  showNotification(`Opening ${albumType} gallery`);
}

// Form Handlers
function handleLoginSubmit(event) {
  event.preventDefault();

  const passwordInput = document.getElementById("loginPassword");
  const password = passwordInput.value;

  // Basic validation (in real app, this would be secure authentication)
  if (password.length < 1) {
    showNotification("Please enter a password", "error");
    return;
  }

  // Mock authentication - in real app, this would validate against a secure backend
  if (password === "family123" || password === "admin") {
    showNotification("Welcome! Redirecting to private area...", "success");
    setTimeout(() => {
      closeLoginModal();
      // In real app, this would redirect to private dashboard
      console.log("Redirecting to private area");
    }, 1500);
  } else {
    showNotification("Incorrect password. Please try again.", "error");
    passwordInput.value = "";
    passwordInput.focus();
  }
}

function handleMemorySubmit(event) {
  event.preventDefault();

  const nameInput = document.getElementById("memoryName");
  const textInput = document.getElementById("memoryText");
  const photoInput = document.getElementById("memoryPhoto");

  const name = nameInput.value.trim() || "Anonymous";
  const memory = textInput.value.trim();

  // Validation
  if (!memory) {
    showNotification("Please share your memory before submitting", "error");
    textInput.focus();
    return;
  }

  // Create memory object (in real app, this would be sent to backend)
  const newMemory = {
    name: name,
    memory: memory,
    photo: photoInput.files[0] || null,
    timestamp: new Date().toISOString(),
  };

  console.log("New memory submitted:", newMemory);

  // Show success message
  showNotification(
    "Thank you for sharing your memory! It will be reviewed and added soon.",
    "success",
  );

  // Reset form and close modal
  setTimeout(() => {
    nameInput.value = "";
    textInput.value = "";
    photoInput.value = "";
    closeMemoryModal();
  }, 2000);
}

// Keyboard Navigation
function handleKeyPress(event, action) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    action();
  }
}

// Notification System
function showNotification(message, type = "info") {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll(".notification");
  existingNotifications.forEach((notification) => notification.remove());

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  // Style the notification
  Object.assign(notification.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "12px 20px",
    borderRadius: "8px",
    color: "white",
    fontWeight: "500",
    fontSize: "14px",
    zIndex: "3000",
    maxWidth: "300px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
    transition: "all 0.3s ease",
  });

  // Set background color based on type
  switch (type) {
    case "success":
      notification.style.backgroundColor = "#22c55e";
      break;
    case "error":
      notification.style.backgroundColor = "#ef4444";
      break;
    default:
      notification.style.backgroundColor = "rgb(139, 115, 85)";
  }

  // Add to page
  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.transform = "translateX(0)";
    notification.style.opacity = "1";
  }, 10);

  // Remove after delay
  setTimeout(() => {
    notification.style.transform = "translateX(100%)";
    notification.style.opacity = "0";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 4000);
}

// Smooth Scrolling for Navigation Links
document.addEventListener("DOMContentLoaded", function () {
  // Handle navigation link clicks
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href");
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        const offsetTop = targetElement.offsetTop - 80; // Account for fixed header
        window.scrollTo({
          top: offsetTop,
          behavior: "smooth",
        });
      }
    });
  });

  // Handle keyboard navigation for interactive elements
  const interactiveElements = document.querySelectorAll(
    ".chapter-card, .gallery-album",
  );
  interactiveElements.forEach((element) => {
    element.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.click();
      }
    });
  });

  // Modal close on escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (state.isLoginModalOpen) {
        closeLoginModal();
      }
      if (state.isMemoryModalOpen) {
        closeMemoryModal();
      }
    }
  });

  // Modal close on overlay click
  const modals = document.querySelectorAll(".modal-overlay");
  modals.forEach((modal) => {
    modal.addEventListener("click", function (e) {
      if (e.target === this) {
        if (this.id === "loginModal") {
          closeLoginModal();
        } else if (this.id === "memoryModal") {
          closeMemoryModal();
        }
      }
    });
  });
});

// Header scroll effect
window.addEventListener("scroll", function () {
  const header = document.querySelector(".main-header");
  if (window.scrollY > 100) {
    header.style.backgroundColor = "rgba(25, 20, 15, 0.98)";
  } else {
    header.style.backgroundColor = "rgba(25, 20, 15, 0.95)";
  }
});

// Intersection Observer for scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver(function (entries) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, observerOptions);

// Observe sections for scroll animations
document.addEventListener("DOMContentLoaded", function () {
  const sections = document.querySelectorAll("section");
  sections.forEach((section) => {
    section.style.opacity = "0";
    section.style.transform = "translateY(20px)";
    section.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    observer.observe(section);
  });
});

// Error handling for images
document.addEventListener("DOMContentLoaded", function () {
  const images = document.querySelectorAll("img");
  images.forEach((img) => {
    img.addEventListener("error", function () {
      // Replace broken images with a placeholder
      this.src =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJyZ2JhKDEzOSwgMTE1LCA4NSwgMC4xKSIvPgo8dGV4dCB4PSIxNTAiIHk9IjEwMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJyZ2IoMTM5LCAxMTUsIDg1KSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2UgTm90IEF2YWlsYWJsZTwvdGV4dD4KPC9zdmc+";
      this.alt = "Image not available";
    });
  });
});

// Form validation helpers
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateRequired(value) {
  return value && value.trim().length > 0;
}

// Export functions for potential external use
window.LegacyWebsite = {
  openLoginModal,
  closeLoginModal,
  openMemoryModal,
  closeMemoryModal,
  selectChapter,
  openGallery,
  showNotification,
};
