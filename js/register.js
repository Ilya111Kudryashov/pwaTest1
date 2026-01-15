class RegisterManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupPasswordStrength();
  }

  setupEventListeners() {
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
      registerForm.addEventListener("submit", (e) => this.handleRegister(e));
    }

    const passwordInput = document.getElementById("regPassword");
    if (passwordInput) {
      passwordInput.addEventListener("input", () =>
        this.updatePasswordStrength()
      );
    }
  }

  setupPasswordStrength() {
    this.passwordStrength = {
      weak: { text: "Слабый", class: "weak", width: "25%" },
      medium: { text: "Средний", class: "medium", width: "50%" },
      strong: { text: "Сильный", class: "strong", width: "75%" },
      veryStrong: {
        text: "Очень сильный",
        class: "very-strong",
        width: "100%",
      },
    };
  }

  updatePasswordStrength() {
    const password = document.getElementById("regPassword").value;
    const strengthBar = document.querySelector(".strength-bar");
    const strengthText = document.querySelector(".strength-text");

    let strength = this.calculatePasswordStrength(password);

    strengthBar.style.width = strength.width;
    strengthBar.className = `strength-bar ${strength.class}`;
    strengthText.textContent = strength.text;
    strengthText.className = `strength-text ${strength.class}`;
  }

  calculatePasswordStrength(password) {
    if (password.length === 0) return this.passwordStrength.weak;

    let score = 0;

    // Длина
    if (password.length > 8) score++;
    if (password.length > 12) score++;

    // Разнообразие символов
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score >= 6) return this.passwordStrength.veryStrong;
    if (score >= 4) return this.passwordStrength.strong;
    if (score >= 2) return this.passwordStrength.medium;
    return this.passwordStrength.weak;
  }
}

// Инициализация
document.addEventListener("DOMContentLoaded", () => {
  new RegisterManager();
});
