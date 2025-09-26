let questions = [];
let currentQuestionIndex = 0;
let answers = [];
let skinTypeVotes = {
  "Dry": 0,
  "Oily": 0,
  "Combination": 0,
  "Normal": 0
};
let markers = {
  sensitivity: 0,
  pigmentation: 0,
  wrinkles: 0,
  acne: 0
};

const questionImage = document.getElementById("question-image");
const questionText = document.getElementById("question-text");
const answersContainer = document.getElementById("answers-container");
const progress = document.getElementById("progress");

async function fetchQuestions() {
  try {
    const res = await fetch("/api/questions");
    questions = await res.json();
    showQuestion();
  } catch (err) {
    questionText.textContent = "Failed to load questions.";
    console.error(err);
  }
}

function showQuestion() {
  const question = questions[currentQuestionIndex];
  questionText.textContent = question.text;
  questionImage.src = `images/${question.image}`;
  answersContainer.innerHTML = "";

  question.answers.forEach((answer, index) => {
    const btn = document.createElement("button");
    btn.classList.add("answer-btn");
    btn.textContent = answer;
    btn.onclick = () => selectAnswer(index, answer);
    answersContainer.appendChild(btn);
  });

  progress.style.width = `${(currentQuestionIndex / questions.length) * 100}%`;
}

function selectAnswer(index, answerText) {
  answers.push({ question: questions[currentQuestionIndex].text, answer: answerText });

  const lowerText = answerText.toLowerCase();
  const indexToUseForSkin = [2, 3, 4, 5, 10, 12, 14];

  if (indexToUseForSkin.includes(currentQuestionIndex)) {
    if (lowerText.includes("dry") || lowerText.includes("flaky")) skinTypeVotes["Dry"]++;
    if (lowerText.includes("oily") || lowerText.includes("shine")) skinTypeVotes["Oily"]++;
    if (lowerText.includes("t-zone") || (lowerText.includes("oily") && lowerText.includes("dry"))) skinTypeVotes["Combination"]++;
    if (lowerText.includes("normal")) skinTypeVotes["Normal"]++;
  }

  if (lowerText.includes("redness") || lowerText.includes("reacts") || lowerText.includes("flaky")) markers.sensitivity++;
  if (lowerText.includes("pigment") || lowerText.includes("freckles")) markers.pigmentation++;
  if (lowerText.includes("wrinkles") || lowerText.includes("fine lines")) markers.wrinkles++;
  if (lowerText.includes("acne") || lowerText.includes("breakouts") || lowerText.includes("pimples")) markers.acne++;

  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    showQuestion();
  } else {
    saveResults();
  }
}

async function saveResults() {
  const maxVotes = Math.max(...Object.values(skinTypeVotes));
  const skinType = Object.keys(skinTypeVotes).find(type => skinTypeVotes[type] === maxVotes);

  const selectedMarkers = Object.entries(markers)
    .filter(([key, value]) => value > 0)
    .map(([key]) => key);

  const resultsSummary = {
    skinType,
    markers: selectedMarkers,
    answers
  };

  try {
    // 🔹 Відправка результатів на сервер
    await fetch("/api/save-results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resultsSummary)
    });

    // 🔹 Перенаправлення на Stripe Checkout
    const stripeRes = await fetch("/api/create-checkout-session", {
      method: "POST"
    });
    const { id } = await stripeRes.json();
    const stripe = Stripe("YOUR_PUBLISHABLE_KEY_HERE");
    stripe.redirectToCheckout({ sessionId: id });
  } catch (err) {
    alert("Помилка при збереженні результатів.");
    console.error(err);
  }
}


fetchQuestions();
