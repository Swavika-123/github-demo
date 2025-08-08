document.addEventListener('DOMContentLoaded', function () {
  const menu = document.getElementById('language-menu');
  const main = document.querySelector('main');

  // Game state
  let xp = 0;
  let hearts = 3;
  let visitedLanguages = []; // Track which languages have been visited
  
  // FIB state tracking
  let currentFibQuestion = 0;
  let fibQuestions = [];
  let fibLanguage = '';

  // Audio context for feedback sounds
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // Function to play success sound
  function playSuccessSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }

  // Function to play error sound
  function playErrorSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  }

  // Function to show visual feedback
  function showVisualFeedback(element, isCorrect) {
    if (isCorrect) {
      element.style.backgroundColor = '#4CAF50';
      element.style.color = '#fff';
      element.style.transform = 'scale(1.05)';
      element.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        element.style.transform = 'scale(1)';
        element.style.backgroundColor = '';
        element.style.color = '';
      }, 500);
    } else {
      element.style.backgroundColor = '#f44336';
      element.style.color = '#fff';
      element.style.transform = 'scale(0.95)';
      element.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        element.style.transform = 'scale(1)';
        element.style.backgroundColor = '';
        element.style.color = '';
      }, 500);
    }
  }

  // Render XP and hearts bar
  function renderStatusBar() {
    return `<div class="status-bar" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
      <div class="xp-bar" style="font-size:1.2rem;font-weight:bold;">XP: <span id="xp-value">${xp}</span></div>
      <div class="hearts-bar" style="font-size:1.5rem;">${'❤️'.repeat(hearts)}${'🤍'.repeat(3 - hearts)}</div>
    </div>`;
  }

  // Data for exercises (10+ per type per language)
  const exerciseData = {
    German: {
      fill: [
        { q: 'Ich ___ ein Buch. (haben)', a: 'habe' },
        { q: 'Du ___ einen Hund. (haben)', a: 'hast' },
        { q: 'Er ___ Fußball. (spielen)', a: 'spielt' },
        { q: 'Wir ___ nach Berlin. (fahren)', a: 'fahren' },
        { q: 'Sie ___ in München. (wohnen)', a: 'wohnen' },
        { q: 'Ich ___ Brot. (essen)', a: 'esse' },
        { q: 'Ihr ___ schnell. (laufen)', a: 'lauft' },
        { q: 'Du ___ müde. (sein)', a: 'bist' },
        { q: 'Wir ___ Freunde. (sein)', a: 'sind' },
        { q: 'Er ___ Lehrer. (sein)', a: 'ist' }
      ],
      match: [
        { left: 'Apfel', right: 'Apple' },
        { left: 'Brot', right: 'Bread' },
        { left: 'Wasser', right: 'Water' },
        { left: 'Milch', right: 'Milk' },
        { left: 'Käse', right: 'Cheese' },
        { left: 'Fisch', right: 'Fish' },
        { left: 'Ei', right: 'Egg' },
        { left: 'Reis', right: 'Rice' },
        { left: 'Kartoffel', right: 'Potato' },
        { left: 'Tomate', right: 'Tomato' }
      ],
      drag: [
        { word: 'Hund', match: 'Dog' },
        { word: 'Katze', match: 'Cat' },
        { word: 'Vogel', match: 'Bird' },
        { word: 'Pferd', match: 'Horse' },
        { word: 'Kuh', match: 'Cow' },
        { word: 'Schwein', match: 'Pig' },
        { word: 'Schaf', match: 'Sheep' },
        { word: 'Huhn', match: 'Chicken' },
        { word: 'Ente', match: 'Duck' },
        { word: 'Maus', match: 'Mouse' }
      ],
      // Demo Lesson 1: Basic Greetings
      greetings: [
        { q: 'Hello (formal)', a: 'Guten Tag' },
        { q: 'Good morning', a: 'Guten Morgen' },
        { q: 'Good evening', a: 'Guten Abend' },
        { q: 'Goodbye', a: 'Auf Wiedersehen' },
        { q: 'Good night', a: 'Gute Nacht' },
        { q: 'How are you? (formal)', a: 'Wie geht es Ihnen?' },
        { q: 'How are you? (informal)', a: 'Wie geht es dir?' },
        { q: 'Fine, thank you', a: 'Gut, danke' },
        { q: 'Please', a: 'Bitte' },
        { q: 'Thank you', a: 'Danke' }
      ],
      // Demo Lesson 2: Numbers
      numbers: [
        { q: 'One', a: 'Eins' },
        { q: 'Two', a: 'Zwei' },
        { q: 'Three', a: 'Drei' },
        { q: 'Four', a: 'Vier' },
        { q: 'Five', a: 'Fünf' },
        { q: 'Six', a: 'Sechs' },
        { q: 'Seven', a: 'Sieben' },
        { q: 'Eight', a: 'Acht' },
        { q: 'Nine', a: 'Neun' },
        { q: 'Ten', a: 'Zehn' }
      ]
    },
    Spanish: {
      fill: [
        { q: 'Yo ___ una manzana. (tener)', a: 'tengo' },
        { q: 'Tú ___ un perro. (tener)', a: 'tienes' },
        { q: 'Él ___ fútbol. (jugar)', a: 'juega' },
        { q: 'Nosotros ___ a Madrid. (ir)', a: 'vamos' },
        { q: 'Ellos ___ en Barcelona. (vivir)', a: 'viven' },
        { q: 'Yo ___ pan. (comer)', a: 'como' },
        { q: 'Vosotros ___ rápido. (correr)', a: 'corréis' },
        { q: 'Tú ___ cansado. (estar)', a: 'estás' },
        { q: 'Nosotros ___ amigos. (ser)', a: 'somos' },
        { q: 'Ella ___ profesora. (ser)', a: 'es' }
      ],
      match: [
        { left: 'Manzana', right: 'Apple' },
        { left: 'Pan', right: 'Bread' },
        { left: 'Agua', right: 'Water' },
        { left: 'Leche', right: 'Milk' },
        { left: 'Queso', right: 'Cheese' },
        { left: 'Pescado', right: 'Fish' },
        { left: 'Huevo', right: 'Egg' },
        { left: 'Arroz', right: 'Rice' },
        { left: 'Patata', right: 'Potato' },
        { left: 'Tomate', right: 'Tomato' }
      ],
      drag: [
        { word: 'Perro', match: 'Dog' },
        { word: 'Gato', match: 'Cat' },
        { word: 'Pájaro', match: 'Bird' },
        { word: 'Caballo', match: 'Horse' },
        { word: 'Vaca', match: 'Cow' },
        { word: 'Cerdo', match: 'Pig' },
        { word: 'Oveja', match: 'Sheep' },
        { word: 'Pollo', match: 'Chicken' },
        { word: 'Pato', match: 'Duck' },
        { word: 'Ratón', match: 'Mouse' }
      ],
      // Demo Lesson 1: Basic Greetings
      greetings: [
        { q: 'Hello', a: 'Hola' },
        { q: 'Good morning', a: 'Buenos días' },
        { q: 'Good afternoon', a: 'Buenas tardes' },
        { q: 'Good evening', a: 'Buenas noches' },
        { q: 'Goodbye', a: 'Adiós' },
        { q: 'How are you?', a: '¿Cómo estás?' },
        { q: 'Fine, thank you', a: 'Bien, gracias' },
        { q: 'Please', a: 'Por favor' },
        { q: 'Thank you', a: 'Gracias' },
        { q: "You're welcome", a: 'De nada' }
      ],
      // Demo Lesson 2: Numbers
      numbers: [
        { q: 'One', a: 'Uno' },
        { q: 'Two', a: 'Dos' },
        { q: 'Three', a: 'Tres' },
        { q: 'Four', a: 'Cuatro' },
        { q: 'Five', a: 'Cinco' },
        { q: 'Six', a: 'Seis' },
        { q: 'Seven', a: 'Siete' },
        { q: 'Eight', a: 'Ocho' },
        { q: 'Nine', a: 'Nueve' },
        { q: 'Ten', a: 'Diez' }
      ]
    },
    Japanese: {
      fill: [
        { q: '私は ___ を飲みます。 (water)', a: 'みず' },
        { q: 'あなたは ___ を食べます。 (apple)', a: 'りんご' },
        { q: '彼は ___ を読みます。 (book)', a: 'ほん' },
        { q: '私たちは ___ へ行きます。 (school)', a: 'がっこう' },
        { q: '彼女は ___ を話します。 (Japanese)', a: 'にほんご' },
        { q: '私は ___ を買います。 (bread)', a: 'パン' },
        { q: 'あなたは ___ を見ます。 (movie)', a: 'えいが' },
        { q: '彼は ___ を書きます。 (letter)', a: 'てがみ' },
        { q: '私たちは ___ を作ります。 (cake)', a: 'ケーキ' },
        { q: '彼女は ___ を弾きます。 (piano)', a: 'ピアノ' }
      ],
      match: [
        { left: 'りんご', right: 'Apple' },
        { left: 'パン', right: 'Bread' },
        { left: 'みず', right: 'Water' },
        { left: 'ぎゅうにゅう', right: 'Milk' },
        { left: 'チーズ', right: 'Cheese' },
        { left: 'さかな', right: 'Fish' },
        { left: 'たまご', right: 'Egg' },
        { left: 'ごはん', right: 'Rice' },
        { left: 'じゃがいも', right: 'Potato' },
        { left: 'トマト', right: 'Tomato' }
      ],
      drag: [
        { word: 'いぬ', match: 'Dog' },
        { word: 'ねこ', match: 'Cat' },
        { word: 'とり', match: 'Bird' },
        { word: 'うま', match: 'Horse' },
        { word: 'うし', match: 'Cow' },
        { word: 'ぶた', match: 'Pig' },
        { word: 'ひつじ', match: 'Sheep' },
        { word: 'にわとり', match: 'Chicken' },
        { word: 'あひる', match: 'Duck' },
        { word: 'ねずみ', match: 'Mouse' }
      ],
      // Demo Lesson 1: Basic Greetings
      greetings: [
        { q: 'Hello', a: 'こんにちは' },
        { q: 'Good morning', a: 'おはようございます' },
        { q: 'Good evening', a: 'こんばんは' },
        { q: 'Goodbye', a: 'さようなら' },
        { q: 'Good night', a: 'おやすみなさい' },
        { q: 'How are you?', a: 'お元気ですか' },
        { q: 'Fine, thank you', a: '元気です、ありがとう' },
        { q: 'Please', a: 'お願いします' },
        { q: 'Thank you', a: 'ありがとう' },
        { q: "You're welcome", a: 'どういたしまして' }
      ],
      // Demo Lesson 2: Numbers
      numbers: [
        { q: 'One', a: '一' },
        { q: 'Two', a: '二' },
        { q: 'Three', a: '三' },
        { q: 'Four', a: '四' },
        { q: 'Five', a: '五' },
        { q: 'Six', a: '六' },
        { q: 'Seven', a: '七' },
        { q: 'Eight', a: '八' },
        { q: 'Nine', a: '九' },
        { q: 'Ten', a: '十' }
      ]
    }
  };

  // Function to render home page
  function renderHomePage() {
    main.innerHTML = `
      <h1>Welcome to LinguaQuest</h1>
      <p>Select a language to begin your quest!</p>
      <p><em>Interactive exercises will appear after you select a language.</em></p>
    `;
    main.removeAttribute('data-lang');
    // Reset menu buttons
    Array.from(menu.querySelectorAll('button')).forEach(btn => btn.removeAttribute('aria-current'));
  }

  function renderExerciseTypeMenu(lang) {
    let html = renderStatusBar();
    
    // Check if this is the first time visiting this language
    const isFirstVisit = !visitedLanguages.includes(lang);
    if (isFirstVisit) {
      visitedLanguages.push(lang);
    }
    
    html += `<section aria-label="${lang} Exercise Types">
      <button class="back-btn" type="button">&larr; Back to Home</button>
      <h2>Choose Exercise Type for ${lang}</h2>
      <div class="exercise-type-container">
        <button class="exercise-type-btn" data-type="fib" data-lang="${lang}">
          <span class="exercise-icon">✏️</span>
          Fill in the Blanks
        </button>
        <button class="exercise-type-btn" data-type="match" data-lang="${lang}">
          <span class="exercise-icon">🔗</span>
          Match the Following
        </button>
        <button class="exercise-type-btn" data-type="dnd" data-lang="${lang}">
          <span class="exercise-icon">📦</span>
          Drag and Drop
        </button>
        <button class="exercise-type-btn" data-type="demo-greetings" data-lang="${lang}">
          <span class="exercise-icon">👋</span>
          Basic Greetings
        </button>
        <button class="exercise-type-btn" data-type="demo-numbers" data-lang="${lang}">
          <span class="exercise-icon">🔢</span>
          Numbers
        </button>
      </div>
      
      ${isFirstVisit ? `
      <div class="game-explanation" id="game-explanation">
        <div class="explanation-slide">
          <div class="explanation-content">
            <h3>🎮 Welcome to LinguaQuest!</h3>
            <div class="explanation-item">
              <span class="explanation-icon">⭐</span>
              <div class="explanation-text">
                <strong>XP (Experience Points):</strong> Earn 10 XP for each correct answer!
              </div>
            </div>
            <div class="explanation-item">
              <span class="explanation-icon">❤️</span>
              <div class="explanation-text">
                <strong>Hearts:</strong> You have 3 hearts. Lose 1 heart for each wrong answer!
              </div>
            </div>
            <div class="explanation-item">
              <span class="explanation-icon">🎯</span>
              <div class="explanation-text">
                <strong>Goal:</strong> Complete exercises to earn XP and keep your hearts!
              </div>
            </div>
            <button class="got-it-btn" id="got-it-btn">Got it! Let's Start! 🚀</button>
          </div>
        </div>
      </div>
      ` : ''}
    </section>`;
    
    main.innerHTML = html;
    main.setAttribute('data-lang', lang);
  }

  function renderFillInTheBlanks(lang) {
    const questions = exerciseData[lang].fill;
    fibQuestions = questions;
    fibLanguage = lang;
    currentFibQuestion = 0;
    
    let html = renderStatusBar();
    html += `<section aria-label="${lang} Fill in the Blanks">
      <button class="back-btn" type="button">&larr; Back</button>
      <h2>Fill in the Blanks</h2>
      <div class="fib-question-container">
        <div class="question-counter">Question ${currentFibQuestion + 1} of ${questions.length}</div>
        <div class="question-content">
          <p class="question-text">${questions[currentFibQuestion].q}</p>
          <div class="answer-section">
            <input type="text" class="fib-input" data-idx="${currentFibQuestion}" aria-label="Fill in the blank ${currentFibQuestion + 1}" placeholder="Enter your answer">
            <button type="button" class="check-fib" data-idx="${currentFibQuestion}">Check</button>
            <span class="fib-feedback" id="fib-feedback-${currentFibQuestion}" aria-live="polite"></span>
          </div>
        </div>
        <div class="navigation-buttons">
          <button type="button" class="next-question" data-idx="${currentFibQuestion}" style="display: none;">Next Question</button>
          <button type="button" class="finish-exercise" style="display: none;">Finish Exercise</button>
        </div>
      </div>
    </section>`;
    main.innerHTML = html;
    main.setAttribute('data-lang', lang);
  }

  function renderMatchTheFollowing(lang) {
    const pairs = exerciseData[lang].match;
    // Shuffle right side
    const right = pairs.map(p => p.right).sort(() => Math.random() - 0.5);
    let html = renderStatusBar();
    html += `<section aria-label="${lang} Match the Following"><button class="back-btn" type="button">&larr; Back</button><h2>Match the Following</h2><form class="match-form"><ol>`;
    pairs.forEach((p, i) => {
      html += `<li>${p.left} = <select class="match-select" data-idx="${i}"><option value="">Select</option>${right.map(r => `<option value="${r}">${r}</option>`).join('')}</select> <span class="match-feedback" id="match-feedback-${i}" aria-live="polite"></span></li>`;
    });
    html += '</ol><button type="button" class="check-match">Check Answers</button></form></section>';
    main.innerHTML = html;
    main.setAttribute('data-lang', lang);
  }

  function renderDragAndDrop(lang) {
    const pairs = exerciseData[lang].drag;
    // Shuffle both sides
    const left = pairs.map(p => p.word).sort(() => Math.random() - 0.5);
    const right = pairs.map(p => p.match).sort(() => Math.random() - 0.5);
    let html = renderStatusBar();
    html += `<section aria-label="${lang} Drag and Drop"><button class="back-btn" type="button">&larr; Back</button><h2>Drag and Drop</h2><div class="drag-container">`;
    html += '<div class="drag-items">';
    left.forEach((w, i) => {
      html += `<div class="draggable" draggable="true" data-match="${pairs.find(p => p.word === w).match}">${w}</div>`;
    });
    html += '</div><div class="drop-targets">';
    right.forEach((r, i) => {
      html += `<div class="drop-target" data-accept="${r}">${r}</div>`;
    });
    html += '</div></div><button type="button" class="check-dnd">Check Matching</button> <span class="dnd-feedback" aria-live="polite"></span></section>';
    main.innerHTML = html;
    main.setAttribute('data-lang', lang);
  }

  // Function to render demo lessons
  function renderDemoLesson(language, lessonType) {
    const lessonData = exerciseData[language][lessonType];
    const lessonTitle = lessonType === 'greetings' ? 'Basic Greetings' : 'Numbers';
    
    let exerciseHTML = `
      <div class="status-bar">
        <div class="xp-bar">XP: <span id="xp-value">${xp}</span></div>
        <div class="hearts-bar">❤️ ${hearts}</div>
      </div>
      <h1>${language} - ${lessonTitle}</h1>
      <p>Translate the following words:</p>
      <section aria-label="${lessonTitle} Exercise">
        <ol>
    `;
    
    lessonData.forEach((item, index) => {
      exerciseHTML += `
        <li>
          <span>${item.q}: </span>
          <input type="text" class="fib-input" data-answer="${item.a}" placeholder="Enter your answer">
          <button class="check-fib" data-answer="${item.a}">Check</button>
          <span class="fib-feedback"></span>
        </li>
      `;
    });
    
    exerciseHTML += `
        </ol>
      </section>
      <button class="back-btn" type="button">&larr; Back</button>
    `;
    
    main.innerHTML = exerciseHTML;
  }

  menu.addEventListener('click', function (e) {
    if (e.target.tagName === 'BUTTON') {
      const lang = e.target.textContent;
      renderExerciseTypeMenu(lang);
      Array.from(menu.querySelectorAll('button')).forEach(btn => btn.removeAttribute('aria-current'));
      e.target.setAttribute('aria-current', 'page');
      main.setAttribute('data-lang', lang);
    }
  });

  menu.addEventListener('keydown', function (e) {
    const buttons = Array.from(menu.querySelectorAll('button'));
    const idx = buttons.indexOf(document.activeElement);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      buttons[(idx + 1) % buttons.length].focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      buttons[(idx - 1 + buttons.length) % buttons.length].focus();
    }
  });

  // Handle exercise type selection, back button, and exercise logic
  main.addEventListener('click', function (e) {
    const lang = main.getAttribute('data-lang');
    
    // Close explanation slide
    if (e.target.id === 'got-it-btn') {
      const explanation = document.getElementById('game-explanation');
      if (explanation) {
        explanation.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
          explanation.remove();
        }, 300);
      }
      return;
    }
    
    // Back button logic
    if (e.target.classList.contains('back-btn')) {
      if (e.target.textContent.includes('Back to Home')) {
        renderHomePage(); // Go to home page
      } else {
        renderExerciseTypeMenu(lang); // Go to exercise type menu
      }
      return;
    }

    // Exercise type selection buttons
    if (e.target.classList.contains('exercise-type-btn')) {
      const type = e.target.getAttribute('data-type');
      if (type === 'fib') renderFillInTheBlanks(lang);
      if (type === 'match') renderMatchTheFollowing(lang);
      if (type === 'dnd') renderDragAndDrop(lang);
      if (type === 'demo-greetings') renderDemoLesson(lang, 'greetings');
      if (type === 'demo-numbers') renderDemoLesson(lang, 'numbers');
      return;
    }

    // Next question button for FIB
    if (e.target.classList.contains('next-question')) {
      currentFibQuestion++;
      if (currentFibQuestion < fibQuestions.length) {
        renderCurrentFibQuestion();
      }
      return;
    }

    // Finish exercise button for FIB
    if (e.target.classList.contains('finish-exercise')) {
      renderExerciseTypeMenu(fibLanguage);
      return;
    }

    // Fill in the Blanks check
    if (e.target.classList.contains('check-fib')) {
      const idx = e.target.getAttribute('data-idx');
      const answer = e.target.getAttribute('data-answer');
      let input, feedback;
      
      if (idx !== null) {
        // Regular fill in the blanks
        input = main.querySelector(`.fib-input[data-idx="${idx}"]`);
        feedback = main.querySelector(`#fib-feedback-${idx}`);
        const expectedAnswer = exerciseData[lang].fill[idx].a;
        const isCorrect = input.value.trim().toLowerCase() === expectedAnswer.toLowerCase();
        
        if (isCorrect) {
          feedback.textContent = 'Correct!';
          playSuccessSound();
          showVisualFeedback(input, true);
          xp += 10;
          updateStatusBar();
          
          // Show next button or finish button
          const nextBtn = main.querySelector('.next-question');
          const finishBtn = main.querySelector('.finish-exercise');
          if (currentFibQuestion < fibQuestions.length - 1) {
            nextBtn.style.display = 'inline-block';
          } else {
            finishBtn.style.display = 'inline-block';
          }
        } else {
          feedback.textContent = 'Try again.';
          playErrorSound();
          showVisualFeedback(input, false);
          if (hearts > 0) hearts--;
          updateStatusBar();
        }
      } else if (answer !== null) {
        // Demo lesson check
        input = e.target.previousElementSibling;
        feedback = e.target.nextElementSibling;
        const isCorrect = input.value.trim().toLowerCase() === answer.toLowerCase();
        
        if (isCorrect) {
          feedback.textContent = 'Correct!';
          playSuccessSound();
          showVisualFeedback(input, true);
          xp += 10;
          updateStatusBar();
        } else {
          feedback.textContent = 'Try again.';
          playErrorSound();
          showVisualFeedback(input, false);
          if (hearts > 0) hearts--;
          updateStatusBar();
        }
      }
    }
    // Match the Following check
    if (e.target.classList.contains('check-match')) {
      const selects = main.querySelectorAll('.match-select');
      let allCorrect = true;
      selects.forEach((sel, i) => {
        const feedback = main.querySelector(`#match-feedback-${i}`);
        const answer = exerciseData[lang].match[i].right;
        const isCorrect = sel.value === answer;
        if (isCorrect) {
          feedback.textContent = 'Correct!';
          showVisualFeedback(sel, true);
        } else {
          feedback.textContent = 'Try again.';
          showVisualFeedback(sel, false);
          allCorrect = false;
        }
      });
      if (allCorrect) {
        playSuccessSound();
        xp += 20;
        updateStatusBar();
        alert('All answers correct!');
      } else {
        playErrorSound();
        if (hearts > 0) hearts--;
        updateStatusBar();
      }
    }
    // Drag and Drop check
    if (e.target.classList.contains('check-dnd')) {
      const drops = main.querySelectorAll('.drop-target');
      let correct = true;
      drops.forEach(drop => {
        const drag = drop.querySelector('.draggable');
        if (!drag || drag.dataset.match !== drop.dataset.accept) correct = false;
      });
      const feedback = main.querySelector('.dnd-feedback');
      if (correct) {
        feedback.textContent = 'All matched correctly!';
        playSuccessSound();
        showVisualFeedback(e.target, true);
        xp += 20;
        updateStatusBar();
      } else {
        feedback.textContent = 'Try again.';
        playErrorSound();
        showVisualFeedback(e.target, false);
        if (hearts > 0) hearts--;
        updateStatusBar();
      }
    }
  });

  // Update XP and hearts in the status bar
  function updateStatusBar() {
    const xpEl = main.querySelector('#xp-value');
    const heartsEl = main.querySelector('.hearts-bar');
    if (xpEl) xpEl.textContent = xp;
    if (heartsEl) heartsEl.innerHTML = '❤️'.repeat(hearts) + '🤍'.repeat(3 - hearts);
  }

  // Drag and Drop logic
  let dragged = null;
  main.addEventListener('dragstart', function (e) {
    if (e.target.classList.contains('draggable')) {
      dragged = e.target;
      e.dataTransfer.effectAllowed = 'move';
    }
  });
  main.addEventListener('dragover', function (e) {
    if (e.target.classList.contains('drop-target')) {
      e.preventDefault();
    }
  });
  main.addEventListener('drop', function (e) {
    if (e.target.classList.contains('drop-target')) {
      e.preventDefault();
      if (dragged) {
        e.target.appendChild(dragged);
        dragged = null;
      }
    }
  });

  // Function to render current FIB question
  function renderCurrentFibQuestion() {
    const questions = fibQuestions;
    let html = renderStatusBar();
    html += `<section aria-label="${fibLanguage} Fill in the Blanks">
      <button class="back-btn" type="button">&larr; Back</button>
      <h2>Fill in the Blanks</h2>
      <div class="fib-question-container">
        <div class="question-counter">Question ${currentFibQuestion + 1} of ${questions.length}</div>
        <div class="question-content">
          <p class="question-text">${questions[currentFibQuestion].q}</p>
          <div class="answer-section">
            <input type="text" class="fib-input" data-idx="${currentFibQuestion}" aria-label="Fill in the blank ${currentFibQuestion + 1}" placeholder="Enter your answer">
            <button type="button" class="check-fib" data-idx="${currentFibQuestion}">Check</button>
            <span class="fib-feedback" id="fib-feedback-${currentFibQuestion}" aria-live="polite"></span>
          </div>
        </div>
        <div class="navigation-buttons">
          <button type="button" class="next-question" data-idx="${currentFibQuestion}" style="display: none;">Next Question</button>
          <button type="button" class="finish-exercise" style="display: none;">Finish Exercise</button>
        </div>
      </div>
    </section>`;
    main.innerHTML = html;
    main.setAttribute('data-lang', fibLanguage);
  }

  // Initial content
  main.innerHTML = '<h1>Welcome to LinguaQuest</h1><p>Select a language to begin your quest!</p><p><em>Interactive exercises will appear after you select a language.</em></p>';
});