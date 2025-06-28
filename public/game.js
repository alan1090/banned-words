const APP_VERSION = "1.0.5";
console.log(`[BannedWords] App Version: ${APP_VERSION}`);

// In game.js (after DOMContentLoaded)
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById(
    "versionInfo"
  ).textContent = `Version: ${APP_VERSION}`;
  new AIBannedWordsGame();
});

class AIBannedWordsGame {
  constructor() {
    this.gameState = {
      players: [],
      scores: [],
      currentRound: 0,
      totalRounds: 0,
      currentPlayerIndex: 0,
      currentWord: null,
      tabooWords: [],
      timer: null,
      timeLeft: 60,
      totalTime: 60,
      wordsUsed: new Set(),
      isGeneratingWord: false,
      isPaused: false,
      category: "general",
      difficulty: "medium",
      language: "english",
      gameActive: false,
    };

    this.screens = {
      start: document.getElementById("startScreen"),
      settings: document.getElementById("settingsScreen"),
      players: document.getElementById("playersScreen"),
      game: document.getElementById("gameScreen"),
      results: document.getElementById("resultsScreen"),
    };

    this.elements = {
      // Buttons
      startGame: document.getElementById("startGameButton"),
      settingsForm: document.getElementById("settingsForm"),
      playersForm: document.getElementById("playersForm"),
      correctButton: document.getElementById("correctButton"),
      passButton: document.getElementById("passButton"),
      pauseButton: document.getElementById("pauseButton"),
      nextRound: document.getElementById("nextRoundButton"),
      endGame: document.getElementById("endGameButton"),
      playAgain: document.getElementById("playAgainButton"),
      newGame: document.getElementById("newGameButton"),
      resume: document.getElementById("resumeButton"),
      quit: document.getElementById("quitButton"),

      // Displays
      wordDisplay: document.getElementById("wordDisplay"),
      tabooWords: document.getElementById("tabooWords"),
      timerDisplay: document.getElementById("timerDisplay"),
      timerProgress: document.getElementById("timerProgress"),
      playersGrid: document.getElementById("playersGrid"),
      currentPlayerName: document.getElementById("currentPlayerName"),
      roundDisplay: document.getElementById("roundDisplay"),
      podium: document.getElementById("podium"),
      finalScores: document.getElementById("finalScores"),

      // Modal
      pauseModal: document.getElementById("pauseModal"),

      // Form inputs
      numberOfPlayers: document.getElementById("numberOfPlayers"),
      numberOfRounds: document.getElementById("numberOfRounds"),
      category: document.getElementById("category"),
      difficulty: document.getElementById("difficulty"),
      language: document.getElementById("language"),
    };

    // Wait for DOM to be fully loaded before initializing
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.initializeEventListeners();
        this.showScreen("start");
      });
    } else {
      this.initializeEventListeners();
      this.showScreen("start");
    }
  }

  initializeEventListeners() {
    // Check if elements exist before adding listeners
    if (this.elements.startGame) {
      this.elements.startGame.addEventListener("click", () =>
        this.showScreen("settings")
      );
    }

    if (this.elements.settingsForm) {
      this.elements.settingsForm.addEventListener("submit", (e) =>
        this.handleSettingsSubmit(e)
      );
    }

    if (this.elements.playersForm) {
      this.elements.playersForm.addEventListener("submit", (e) =>
        this.handlePlayersSubmit(e)
      );
    }

    // Game controls
    if (this.elements.correctButton) {
      this.elements.correctButton.addEventListener("click", () =>
        this.handleCorrectGuess()
      );
    }

    if (this.elements.passButton) {
      this.elements.passButton.addEventListener("click", () =>
        this.handlePassWord()
      );
    }

    if (this.elements.pauseButton) {
      this.elements.pauseButton.addEventListener("click", () =>
        this.togglePause()
      );
    }

    if (this.elements.nextRound) {
      this.elements.nextRound.addEventListener("click", () =>
        this.startNextRound()
      );
    }

    if (this.elements.endGame) {
      this.elements.endGame.addEventListener("click", () => this.endGame());
    }

    // Results
    if (this.elements.playAgain) {
      this.elements.playAgain.addEventListener("click", () => this.playAgain());
    }

    if (this.elements.newGame) {
      this.elements.newGame.addEventListener("click", () => this.newGame());
    }

    // Modal
    if (this.elements.resume) {
      this.elements.resume.addEventListener("click", () => this.togglePause());
    }

    if (this.elements.quit) {
      this.elements.quit.addEventListener("click", () => this.endGame());
    }

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => this.handleKeyPress(e));
  }

  handleKeyPress(e) {
    if (!this.gameState.gameActive) return;

    switch (e.code) {
      case "Space":
        e.preventDefault();
        if (this.gameState.isPaused) {
          this.togglePause();
        } else {
          this.handleCorrectGuess();
        }
        break;
      case "KeyP":
        e.preventDefault();
        this.handlePassWord();
        break;
      case "Escape":
        e.preventDefault();
        this.togglePause();
        break;
    }
  }

  showScreen(screenName) {
    // Hide all screens
    Object.values(this.screens).forEach((screen) => {
      screen.classList.remove("active");
      screen.classList.add("hidden");
    });

    // Show the requested screen
    if (this.screens[screenName]) {
      this.screens[screenName].classList.remove("hidden");
      this.screens[screenName].classList.add("active");
    }
  }

  handleSettingsSubmit(e) {
    e.preventDefault();

    const numberOfPlayers = Number.parseInt(
      this.elements.numberOfPlayers.value
    );
    const numberOfRounds = Number.parseInt(this.elements.numberOfRounds.value);

    this.gameState.totalRounds = numberOfRounds;
    this.gameState.category = this.elements.category.value;
    this.gameState.difficulty = this.elements.difficulty.value;
    this.gameState.language = this.elements.language.value;

    this.createPlayerForm(numberOfPlayers);
    this.showScreen("players");
  }

  createPlayerForm(numberOfPlayers) {
    this.elements.playersForm.innerHTML = "";

    for (let i = 1; i <= numberOfPlayers; i++) {
      const formGroup = document.createElement("div");
      formGroup.className = "form-group";

      const label = document.createElement("label");
      label.textContent = `👤 Player ${i}`;

      const input = document.createElement("input");
      input.type = "text";
      input.required = true;
      input.placeholder = `Enter name for Player ${i}`;
      input.value = `Player ${i}`;

      formGroup.appendChild(label);
      formGroup.appendChild(input);
      this.elements.playersForm.appendChild(formGroup);
    }

    const submitButton = document.createElement("button");
    submitButton.className = "btn btn-primary btn-large";
    submitButton.type = "submit";
    submitButton.innerHTML = '<span class="btn-icon">🎮</span>Start Playing!';

    this.elements.playersForm.appendChild(submitButton);
  }

  handlePlayersSubmit(e) {
    e.preventDefault();

    const inputs =
      this.elements.playersForm.querySelectorAll('input[type="text"]');
    this.gameState.players = Array.from(inputs).map(
      (input) => input.value.trim() || "Anonymous"
    );
    this.gameState.scores = new Array(this.gameState.players.length).fill(0);

    this.startGame();
  }

  async startGame() {
    this.gameState.gameActive = true;
    this.gameState.currentRound = 0;
    this.gameState.currentPlayerIndex = -1;

    this.showScreen("game");
    this.updatePlayersDisplay();
    await this.startNextRound();
  }

  async startNextRound() {
    this.gameState.currentRound++;
    this.gameState.currentPlayerIndex =
      (this.gameState.currentPlayerIndex + 1) % this.gameState.players.length;

    if (this.gameState.currentRound > this.gameState.totalRounds) {
      this.endGame();
      return;
    }

    // Update UI
    this.elements.roundDisplay.textContent = `Round ${this.gameState.currentRound} of ${this.gameState.totalRounds}`;
    this.elements.currentPlayerName.textContent =
      this.gameState.players[this.gameState.currentPlayerIndex];

    // Reset controls
    this.elements.correctButton.disabled = false;
    this.elements.passButton.disabled = false;
    this.elements.pauseButton.disabled = false;
    document.getElementById("roundControls").classList.add("hidden");

    // Reset timer
    this.gameState.timeLeft = this.gameState.totalTime;
    this.updateTimerDisplay();

    this.updatePlayersDisplay();
    await this.generateNewWord();
    this.startTimer();
  }

  async generateNewWord() {
    this.gameState.isGeneratingWord = true;
    this.showLoadingState();

    try {
      const wordData = await this.fetchWordFromAI();
      this.gameState.currentWord = wordData.guess;
      this.gameState.tabooWords = wordData.taboo;
      this.gameState.wordsUsed.add(wordData.guess);

      this.displayWord();
    } catch (error) {
      console.error("Failed to generate word:", error);
      this.showError(`Failed to generate word: ${error.message}`);
    } finally {
      this.gameState.isGeneratingWord = false;
    }
  }

  showLoadingState() {
    this.elements.wordDisplay.innerHTML =
      '<div class="loading-spinner"></div><span>Generating...</span>';
    this.elements.tabooWords.innerHTML = '<div class="loading-spinner"></div>';
  }

  displayWord() {
    this.elements.wordDisplay.textContent = this.gameState.currentWord;

    this.elements.tabooWords.innerHTML = "";
    this.gameState.tabooWords.forEach((word, index) => {
      const tabooElement = document.createElement("div");
      tabooElement.className = "taboo-word";
      tabooElement.textContent = word;
      tabooElement.style.animationDelay = `${index * 0.1}s`;
      this.elements.tabooWords.appendChild(tabooElement);
    });
  }

  startTimer() {
    if (this.gameState.timer) {
      clearInterval(this.gameState.timer);
    }

    this.gameState.timer = setInterval(() => {
      if (this.gameState.isPaused) return;

      this.gameState.timeLeft--;
      this.updateTimerDisplay();

      if (this.gameState.timeLeft <= 0) {
        this.endRound();
      }
    }, 1000);
  }

  updateTimerDisplay() {
    this.elements.timerDisplay.textContent = this.gameState.timeLeft;

    // Update circular progress
    const progress = (this.gameState.timeLeft / this.gameState.totalTime) * 283;
    this.elements.timerProgress.style.strokeDashoffset = 283 - progress;

    // Change color based on time left
    if (this.gameState.timeLeft <= 10) {
      this.elements.timerProgress.style.stroke = "#ff4757";
    } else if (this.gameState.timeLeft <= 30) {
      this.elements.timerProgress.style.stroke = "#ffa502";
    } else {
      this.elements.timerProgress.style.stroke = "#667eea";
    }
  }

  updatePlayersDisplay() {
    this.elements.playersGrid.innerHTML = "";

    this.gameState.players.forEach((player, index) => {
      const playerCard = document.createElement("div");
      playerCard.className = `player-card ${
        index === this.gameState.currentPlayerIndex ? "active" : ""
      }`;

      const playerName = document.createElement("div");
      playerName.className = "player-name";
      playerName.textContent = player;

      const playerScore = document.createElement("div");
      playerScore.className = "player-score";
      playerScore.textContent = this.gameState.scores[index];

      playerCard.appendChild(playerName);
      playerCard.appendChild(playerScore);
      this.elements.playersGrid.appendChild(playerCard);
    });
  }

  async handleCorrectGuess() {
    if (this.gameState.isGeneratingWord) return;

    this.gameState.scores[this.gameState.currentPlayerIndex]++;
    this.updatePlayersDisplay();

    // Add visual feedback
    this.showFeedback("✅ Correct!", "success");

    await this.generateNewWord();
  }

  async handlePassWord() {
    if (this.gameState.isGeneratingWord) return;

    this.showFeedback("⏭️ Passed", "warning");
    await this.generateNewWord();
  }

  showFeedback(message, type) {
    const feedback = document.createElement("div");
    feedback.className = `feedback feedback-${type}`;
    feedback.textContent = message;
    feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--${type === "success" ? "success" : "warning"});
            color: white;
            padding: 1rem 2rem;
            border-radius: 50px;
            font-weight: 600;
            z-index: 1000;
            animation: feedbackPop 1s ease-out forwards;
        `;

    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 1000);
  }

  togglePause() {
    this.gameState.isPaused = !this.gameState.isPaused;

    if (this.gameState.isPaused) {
      this.elements.pauseModal.classList.remove("hidden");
      this.elements.pauseButton.innerHTML =
        '<span class="btn-icon">▶️</span>Resume';
    } else {
      this.elements.pauseModal.classList.add("hidden");
      this.elements.pauseButton.innerHTML =
        '<span class="btn-icon">⏸️</span>Pause';
    }
  }

  endRound() {
    clearInterval(this.gameState.timer);
    this.elements.correctButton.disabled = true;
    this.elements.passButton.disabled = true;
    this.elements.pauseButton.disabled = true;
    document.getElementById("roundControls").classList.remove("hidden");

    this.showFeedback("⏰ Time's up!", "warning");
  }

  endGame() {
    this.gameState.gameActive = false;
    clearInterval(this.gameState.timer);
    this.showResults();
    this.showScreen("results");
  }

  showResults() {
    // Create sorted results
    const results = this.gameState.players
      .map((player, index) => ({
        name: player,
        score: this.gameState.scores[index],
      }))
      .sort((a, b) => b.score - a.score);

    // Show podium (top 3)
    this.elements.podium.innerHTML = "";
    const medals = ["🥇", "🥈", "🥉"];
    const places = ["first", "second", "third"];

    results.slice(0, 3).forEach((player, index) => {
      const podiumPlace = document.createElement("div");
      podiumPlace.className = `podium-place ${places[index]}`;

      podiumPlace.innerHTML = `
                <div class="podium-medal">${medals[index]}</div>
                <div class="podium-step">
                    <div class="podium-name">${player.name}</div>
                    <div class="podium-score">${player.score}</div>
                </div>
            `;

      this.elements.podium.appendChild(podiumPlace);
    });

    // Show all scores
    this.elements.finalScores.innerHTML = `
            <h4>Final Scores</h4>
            ${results
              .map(
                (player, index) => `
                <div style="display: flex; justify-content: space-between; margin: 0.5rem 0; padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 8px;">
                    <span>${index + 1}. ${player.name}</span>
                    <span style="font-weight: bold;">${
                      player.score
                    } points</span>
                </div>
            `
              )
              .join("")}
        `;
  }

  playAgain() {
    // Reset scores but keep players and settings
    this.gameState.scores = new Array(this.gameState.players.length).fill(0);
    this.gameState.currentRound = 0;
    this.gameState.currentPlayerIndex = -1;
    this.gameState.wordsUsed = new Set();
    this.startGame();
  }

  newGame() {
    // Complete reset
    this.gameState = {
      players: [],
      scores: [],
      currentRound: 0,
      totalRounds: 0,
      currentPlayerIndex: 0,
      currentWord: null,
      tabooWords: [],
      timer: null,
      timeLeft: 60,
      totalTime: 60,
      wordsUsed: new Set(),
      isGeneratingWord: false,
      isPaused: false,
      category: "general",
      difficulty: "medium",
      language: "english",
      gameActive: false,
    };

    this.showScreen("start");
  }

  showError(message) {
    const error = document.createElement("div");
    error.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--danger);
            color: white;
            padding: 1rem;
            border-radius: var(--border-radius);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
    error.textContent = message;
    document.body.appendChild(error);
    setTimeout(() => error.remove(), 3000);
  }

  async fetchWordFromAI() {
    const languageMap = {
      english: "English",
      spanish: "Spanish (Español)",
      french: "French (Français)",
      german: "German (Deutsch)",
      italian: "Italian (Italiano)",
      portuguese: "Portuguese (Português)",
      dutch: "Dutch (Nederlands)",
      russian: "Russian (Русский)",
      chinese: "Chinese (中文)",
      japanese: "Japanese (日本語)",
      korean: "Korean (한국어)",
      arabic: "Arabic (العربية)",
    };

    const categoryMap = {
      general: "any topic or subject",
      animals: "animals, wildlife, pets, or creatures",
      cinema: "movies, films, actors, directors, or entertainment",
      sports: "sports, athletics, games, or physical activities",
      food: "food, drinks, cooking, restaurants, or cuisine",
      geography: "countries, cities, landmarks, or geographical features",
      history: "historical events, figures, periods, or civilizations",
      science: "scientific concepts, discoveries, technology, or research",
      technology: "computers, software, gadgets, or digital technology",
    };

    const difficultyMap = {
      easy: "simple, common words that most people know",
      medium: "moderately challenging words that require some thinking",
      hard: "difficult, complex, or specialized terms that are challenging to describe",
    };

    const languagePrompt = languageMap[this.gameState.language] || "English";
    const categoryPrompt = categoryMap[this.gameState.category] || "any topic";
    const difficultyPrompt =
      difficultyMap[this.gameState.difficulty] || "medium difficulty";
    const usedWords = Array.from(this.gameState.wordsUsed);

    // Create a unique seed for variety
    const seed = Math.random().toString(36).substring(2, 8);

    const prompt = `Generate a word for a Taboo-style guessing game in ${languagePrompt}.

Language: ${languagePrompt}
Category: ${categoryPrompt}
Difficulty: ${difficultyPrompt}
Seed: ${seed}
${
  usedWords.length > 0
    ? `Already used words (avoid these): ${usedWords.join(", ")}`
    : ""
}

Create a JSON object with:
- "guess": A single word to guess (uppercase, in ${languagePrompt})
- "taboo": Array of exactly 5 banned words that players cannot use when describing the guess word (in ${languagePrompt})

Rules:
- The guess word should be related to the category
- Taboo words should be the most obvious words someone would use to describe the guess word
- Avoid using parts of the guess word in the taboo list
- Make it appropriately challenging for the difficulty level
- All words must be in ${languagePrompt}
- Return ONLY valid JSON, no explanations

Example format for English:
{
"guess": "ELEPHANT",
"taboo": ["animal", "trunk", "big", "gray", "africa"]
}`;

    try {
      const aiResponse = await this.callDeepSeek(prompt);
      const result = this.parseAIResponse(aiResponse); // ✅ use parser here

      if (result && result.guess && result.taboo && result.taboo.length === 5) {
        return result;
      }

      throw new Error("Invalid response format");
    } catch (error) {
      console.error("DeepSeek API failed:", error);
      throw error;
    }
  }

  async callDeepSeek(prompt) {
    try {
      // Add timeout handling
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10-second timeout

      const response = await fetch("/api/deepseek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("API request timed out");
      }
      throw error;
    }
  }

  parseAIResponse(content) {
    try {
      // Clean up the response - remove markdown code blocks if present
      const cleanContent = content
        .replace(/```json\s*/i, "")
        .replace(/```\s*$/i, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(cleanContent);

      // Validate the response
      if (!parsed.guess || typeof parsed.guess !== "string") {
        throw new Error("Invalid guess word");
      }

      if (!Array.isArray(parsed.taboo) || parsed.taboo.length !== 5) {
        throw new Error("Invalid taboo words array");
      }

      // Ensure guess is uppercase and clean
      parsed.guess = parsed.guess.toUpperCase().trim();

      // Ensure taboo words are clean
      parsed.taboo = parsed.taboo
        .map((word) =>
          typeof word === "string" ? word.toLowerCase().trim() : ""
        )
        .filter((word) => word.length > 0);

      if (parsed.taboo.length !== 5) {
        throw new Error("Not enough valid taboo words");
      }

      return parsed;
    } catch (error) {
      console.error("Failed to parse AI response:", content, error);
      throw new Error("Invalid AI response format");
    }
  }
}

// Add CSS animations
const style = document.createElement("style");
style.textContent = `
    @keyframes feedbackPop {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
        50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
    }

    @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
    }
`;
document.head.appendChild(style);

// Initialize the game when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new AIBannedWordsGame();
});
