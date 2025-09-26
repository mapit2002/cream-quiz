const questions = [
  {
    text: "How often do you feel the need to apply cream?",
    options: ["Daily", "Occasionally", "Rarely"],
  },
  {
    text: "How does your skin feel after washing?",
    options: ["Tight", "Normal", "Oily"],
  },
  {
    text: "Do you have visible pores?",
    options: ["Yes", "No", "Only in T-zone"],
  }
];

let currentQuestion = 0;
let answers = [];

function showQuestion() {
  const question = questions[currentQuestion];
  const container = document.getElementById("quiz");
  container.innerHTML = `
    <h2>${question.text}</h2>
    ${question.options.map(option =>
      `<button onclick="selectAnswer('${option}')">${option}</button>`
    ).join("")}
  `;
}

function selectAnswer(answer) {
  answers.push(answer);
  currentQuestion++;

  if (currentQuestion < questions.length) {
    showQuestion();
  } else {
    // Після завершення тесту — створити Stripe Checkout
    fetch("/api/save-results", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ answers })
    })
    .then(res => res.json())
    .then(() => {
      return fetch("/api/create-checkout-session", {
        method: "POST"
      });
    })
    .then(res => res.json())
    .then(session => {
      if (session.id) {
        return stripe.redirectToCheckout({ sessionId: session.id });
      } else {
        alert("Failed to create checkout session.");
      }
    })
    .catch(err => {
      console.error(err);
      alert("Something went wrong.");
    });
  }
}

window.onload = showQuestion;
