// Life Story Journal State Management
class LifeStoryManager {
  constructor() {
    this.totalQuestions = 24; // Only count main questions, not memos
    this.answers = this.loadAnswers();
    this.memos = this.loadMemos();
    this.currentQuestionId = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];

    this.init();
  }

  init() {
    this.updateProgress();
    this.bindEvents();
    this.updateAllSectionProgress();
  }

  // Local Storage Management
  loadAnswers() {
    const saved = localStorage.getItem("lifeStoryAnswers");
    return saved ? JSON.parse(saved) : {};
  }

  saveAnswers() {
    localStorage.setItem("lifeStoryAnswers", JSON.stringify(this.answers));
    this.showAutosaveIndicator();
  }

  loadMemos() {
    const saved = localStorage.getItem("lifeStoryMemos");
    return saved ? JSON.parse(saved) : {};
  }

  saveMemos() {
    localStorage.setItem("lifeStoryMemos", JSON.stringify(this.memos));
    this.showAutosaveIndicator();
  }

  saveAnswer(questionId, data) {
    const isMemo = questionId.includes("-memo");

    if (isMemo) {
      this.memos[questionId] = {
        ...data,
        timestamp: new Date().toISOString(),
        completed: true,
      };
      this.saveMemos();
      this.updateMemoStatus(questionId);
    } else {
      this.answers[questionId] = {
        ...data,
        timestamp: new Date().toISOString(),
        completed: true,
      };
      this.saveAnswers();
      this.updateQuestionStatus(questionId);
      this.updateProgress();
      this.updateSectionProgress(questionId);
    }
  }

  getAnswer(questionId) {
    const isMemo = questionId.includes("-memo");
    return isMemo
      ? this.memos[questionId] || null
      : this.answers[questionId] || null;
  }

  // Progress Management
  updateProgress() {
    const completed = Object.keys(this.answers).length;
    const percentage = Math.round((completed / this.totalQuestions) * 100);

    // Update progress bar
    const progressBar = document.getElementById("progressBar");
    const progressPercentage = document.getElementById("progressPercentage");
    const progressStats = document.getElementById("progressStats");

    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
      progressBar.classList.add("updated");
      setTimeout(() => progressBar.classList.remove("updated"), 500);
    }

    if (progressPercentage) {
      progressPercentage.textContent = percentage;
    }

    if (progressStats) {
      progressStats.textContent = `${completed} of ${this.totalQuestions} questions completed`;
    }
  }

  updateSectionProgress(questionId) {
    const section = questionId.split("-")[0];
    const sectionElement = document.querySelector(
      `[data-section="${section}"]`,
    );

    if (sectionElement) {
      // Only count non-memo questions for progress
      const sectionQuestions = sectionElement.querySelectorAll(
        ".question-card:not(.memo-card)",
      );
      const completedQuestions = Array.from(sectionQuestions).filter((card) =>
        this.getAnswer(card.dataset.questionId),
      ).length;

      const progressElement = sectionElement.querySelector(".completed-count");
      if (progressElement) {
        progressElement.textContent = `${completedQuestions}/${sectionQuestions.length}`;
      }
    }
  }

  updateAllSectionProgress() {
    const sections = [
      "childhood",
      "youth",
      "military",
      "family",
      "hobbies",
      "lessons",
    ];
    sections.forEach((section) => {
      const sectionElement = document.querySelector(
        `[data-section="${section}"]`,
      );
      if (sectionElement) {
        // Only count non-memo questions for progress
        const sectionQuestions = sectionElement.querySelectorAll(
          ".question-card:not(.memo-card)",
        );
        const completedQuestions = Array.from(sectionQuestions).filter((card) =>
          this.getAnswer(card.dataset.questionId),
        ).length;

        const progressElement =
          sectionElement.querySelector(".completed-count");
        if (progressElement) {
          progressElement.textContent = `${completedQuestions}/${sectionQuestions.length}`;
        }
      }
    });
  }

  updateQuestionStatus(questionId) {
    const questionCard = document.querySelector(
      `[data-question-id="${questionId}"]`,
    );
    if (questionCard) {
      const statusIcon = questionCard.querySelector(".status-icon");
      if (statusIcon) {
        statusIcon.textContent = "✓";
        statusIcon.classList.remove("incomplete");
        statusIcon.classList.add("completed");
      }
      questionCard.classList.add("completed");
    }
  }

  updateMemoStatus(questionId) {
    const memoCard = document.querySelector(
      `[data-question-id="${questionId}"]`,
    );
    if (memoCard) {
      const statusIcon = memoCard.querySelector(".status-icon");
      if (statusIcon) {
        statusIcon.textContent = "✓";
        statusIcon.classList.remove("memo");
        statusIcon.classList.add("completed");
      }
      memoCard.classList.add("has-memo");
    }
  }

  // Event Binding
  bindEvents() {
    // Question card clicks
    document.querySelectorAll(".question-card").forEach((card) => {
      card.addEventListener("click", () => {
        this.openQuestionModal(card.dataset.questionId);
      });

      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.openQuestionModal(card.dataset.questionId);
        }
      });

      // Set initial status
      const answer = this.getAnswer(card.dataset.questionId);
      if (answer) {
        const isMemo = card.dataset.questionId.includes("-memo");
        if (isMemo) {
          this.updateMemoStatus(card.dataset.questionId);
        } else {
          this.updateQuestionStatus(card.dataset.questionId);
        }
      }
    });

    // Media upload handlers
    document.getElementById("answerPhoto")?.addEventListener("change", (e) => {
      this.handlePhotoUpload(e);
    });

    document.getElementById("answerAudio")?.addEventListener("change", (e) => {
      this.handleAudioUpload(e);
    });
  }

  // Modal Management
  openQuestionModal(questionId) {
    this.currentQuestionId = questionId;
    const questionCard = document.querySelector(
      `[data-question-id="${questionId}"]`,
    );
    const questionTitle =
      questionCard.querySelector(".question-title").textContent;
    const questionHint =
      questionCard.querySelector(".question-hint").textContent;

    const existingAnswer = this.getAnswer(questionId);

    if (existingAnswer && existingAnswer.completed) {
      this.openPreviewModal(questionId, questionTitle, existingAnswer);
    } else {
      this.openEditModal(
        questionId,
        questionTitle,
        questionHint,
        existingAnswer,
      );
    }
  }

  openEditModal(questionId, title, hint, existingAnswer = null) {
    const modal = document.getElementById("questionModal");
    const titleElement = document.getElementById("modalQuestionTitle");
    const hintElement = document.getElementById("modalQuestionHint");
    const questionIdInput = document.getElementById("currentQuestionId");
    const answerTextArea = document.getElementById("answerText");

    // Update title for memo cards
    const isMemo = questionId.includes("-memo");
    titleElement.textContent = isMemo ? title.replace("✏️ ", "") : title;
    hintElement.textContent = hint;
    questionIdInput.value = questionId;

    // Pre-fill existing answer if available
    if (existingAnswer) {
      answerTextArea.value = existingAnswer.text || "";

      // Handle existing media
      if (existingAnswer.photoURL) {
        this.showPhotoPreview(existingAnswer.photoURL);
      }
      if (existingAnswer.audioURL) {
        this.showAudioPreview(existingAnswer.audioURL);
      }
    } else {
      answerTextArea.value = "";
      this.clearMediaPreviews();
    }

    modal.style.display = "flex";
    document.body.style.overflow = "hidden";

    // Focus on textarea
    setTimeout(() => answerTextArea.focus(), 100);
  }

  openPreviewModal(questionId, title, answer) {
    const modal = document.getElementById("previewModal");
    const titleElement = document.getElementById("previewQuestionTitle");
    const textElement = document.getElementById("previewAnswerText");
    const mediaElement = document.getElementById("previewAnswerMedia");

    titleElement.textContent = title;
    textElement.textContent = answer.text || "No text answer provided.";

    // Clear previous media
    mediaElement.innerHTML = "";

    // Show media if available
    if (answer.photoURL) {
      const img = document.createElement("img");
      img.src = answer.photoURL;
      img.alt = "Answer photo";
      img.style.maxWidth = "100%";
      img.style.borderRadius = "8px";
      mediaElement.appendChild(img);
    }

    if (answer.audioURL) {
      const audio = document.createElement("audio");
      audio.src = answer.audioURL;
      audio.controls = true;
      audio.style.width = "100%";
      audio.style.marginTop = "8px";
      mediaElement.appendChild(audio);
    }

    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  closeQuestionModal() {
    const modal = document.getElementById("questionModal");
    modal.style.display = "none";
    document.body.style.overflow = "";
    this.clearMediaPreviews();
    this.currentQuestionId = null;
  }

  closePreviewModal() {
    const modal = document.getElementById("previewModal");
    modal.style.display = "none";
    document.body.style.overflow = "";
  }

  editAnswer() {
    this.closePreviewModal();
    const questionCard = document.querySelector(
      `[data-question-id="${this.currentQuestionId}"]`,
    );
    const questionTitle =
      questionCard.querySelector(".question-title").textContent;
    const questionHint =
      questionCard.querySelector(".question-hint").textContent;
    const existingAnswer = this.getAnswer(this.currentQuestionId);

    this.openEditModal(
      this.currentQuestionId,
      questionTitle,
      questionHint,
      existingAnswer,
    );
  }

  // Form Handling
  handleQuestionSubmit(event) {
    event.preventDefault();

    const questionId = document.getElementById("currentQuestionId").value;
    const answerText = document.getElementById("answerText").value.trim();

    if (!answerText) {
      this.showNotification("Please provide an answer before saving.", "error");
      return;
    }

    const answerData = {
      text: answerText,
      photoURL: this.currentPhotoURL || null,
      audioURL: this.currentAudioURL || null,
    };

    this.saveAnswer(questionId, answerData);
    this.closeQuestionModal();
    this.showNotification("Answer saved successfully!", "success");
  }

  // Media Handling
  handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        this.showNotification(
          "Photo file is too large. Please choose a file under 5MB.",
          "error",
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.currentPhotoURL = e.target.result;
        this.showPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  handleAudioUpload(event) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        this.showNotification(
          "Audio file is too large. Please choose a file under 10MB.",
          "error",
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.currentAudioURL = e.target.result;
        this.showAudioPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  showPhotoPreview(url) {
    const preview = document.getElementById("photoPreview");
    const img = document.getElementById("previewImage");

    img.src = url;
    preview.style.display = "block";
  }

  showAudioPreview(url) {
    const preview = document.getElementById("audioPreview");
    const audio = document.getElementById("previewAudio");

    audio.src = url;
    preview.style.display = "block";
  }

  removePhoto() {
    this.currentPhotoURL = null;
    document.getElementById("photoPreview").style.display = "none";
    document.getElementById("answerPhoto").value = "";
  }

  removeAudio() {
    this.currentAudioURL = null;
    document.getElementById("audioPreview").style.display = "none";
    document.getElementById("answerAudio").value = "";

    // Stop any playing audio
    const audio = document.getElementById("previewAudio");
    audio.pause();
    audio.currentTime = 0;
  }

  clearMediaPreviews() {
    this.removePhoto();
    this.removeAudio();
    this.hideRecordingIndicator();
  }

  // Audio Recording
  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = (e) => {
          this.currentAudioURL = e.target.result;
          this.showAudioPreview(e.target.result);
        };
        reader.readAsDataURL(blob);

        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      this.mediaRecorder.start();
      this.showRecordingIndicator();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      this.showNotification(
        "Unable to access microphone. Please check your permissions.",
        "error",
      );
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
      this.hideRecordingIndicator();
    }
  }

  showRecordingIndicator() {
    const indicator = document.getElementById("recordingIndicator");
    indicator.style.display = "flex";
  }

  hideRecordingIndicator() {
    const indicator = document.getElementById("recordingIndicator");
    indicator.style.display = "none";
  }

  // Utility Functions
  showNotification(message, type = "info") {
    // Use the existing notification system from the main site
    if (window.LegacyWebsite && window.LegacyWebsite.showNotification) {
      window.LegacyWebsite.showNotification(message, type);
    } else {
      // Fallback notification
      alert(message);
    }
  }

  showAutosaveIndicator() {
    // Create or update autosave indicator
    let indicator = document.querySelector(".autosave-indicator");
    if (!indicator) {
      indicator = document.createElement("div");
      indicator.className = "autosave-indicator";
      document.body.appendChild(indicator);
    }

    indicator.textContent = "Auto-saved ✓";
    indicator.classList.add("show");

    setTimeout(() => {
      indicator.classList.remove("show");
    }, 2000);
  }

  // Export functionality
  exportData() {
    const data = {
      answers: this.answers,
      memos: this.memos,
      totalQuestions: this.totalQuestions,
      completedQuestions: Object.keys(this.answers).length,
      totalMemos: Object.keys(this.memos).length,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "life-story-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Global Functions for HTML event handlers
let lifeStoryManager;

function closeQuestionModal() {
  lifeStoryManager.closeQuestionModal();
}

function closePreviewModal() {
  lifeStoryManager.closePreviewModal();
}

function editAnswer() {
  lifeStoryManager.editAnswer();
}

function handleQuestionSubmit(event) {
  lifeStoryManager.handleQuestionSubmit(event);
}

function removePhoto() {
  lifeStoryManager.removePhoto();
}

function removeAudio() {
  lifeStoryManager.removeAudio();
}

function startRecording() {
  lifeStoryManager.startRecording();
}

function stopRecording() {
  lifeStoryManager.stopRecording();
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", function () {
  lifeStoryManager = new LifeStoryManager();

  // Modal close on escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      const questionModal = document.getElementById("questionModal");
      const previewModal = document.getElementById("previewModal");

      if (questionModal.style.display === "flex") {
        closeQuestionModal();
      } else if (previewModal.style.display === "flex") {
        closePreviewModal();
      }
    }
  });

  // Modal close on overlay click
  document
    .getElementById("questionModal")
    ?.addEventListener("click", function (e) {
      if (e.target === this) {
        closeQuestionModal();
      }
    });

  document
    .getElementById("previewModal")
    ?.addEventListener("click", function (e) {
      if (e.target === this) {
        closePreviewModal();
      }
    });

  // Auto-save on text input (debounced)
  let saveTimeout;
  document.getElementById("answerText")?.addEventListener("input", function () {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      const questionId = document.getElementById("currentQuestionId").value;
      const text = this.value.trim();

      if (questionId && text) {
        // Save draft
        const drafts = JSON.parse(
          localStorage.getItem("lifeStoryDrafts") || "{}",
        );
        drafts[questionId] = { text, timestamp: new Date().toISOString() };
        localStorage.setItem("lifeStoryDrafts", JSON.stringify(drafts));

        lifeStoryManager.showAutosaveIndicator();
      }
    }, 2000); // Save draft after 2 seconds of no typing
  });
});

// Export the manager for external access
window.LifeStoryManager = lifeStoryManager;
