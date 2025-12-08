// ============================================
// PARTIE 1: VARIABLES GLOBALES
// ============================================
let userName = '';
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let selectedAnswer = null;
let userHistory = {};

// ============================================
// PARTIE 2: INITIALISATION AU CHARGEMENT
// ============================================
window.onload = function() {
    loadUserData();
    checkReturningUser();
};

// ============================================
// PARTIE 3: GESTION DES DONNÉES UTILISATEUR
// ============================================

function loadUserData() {
    const data = {};
    
    // Charger toutes les données du localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('quiz_history_')) {
            const name = key.replace('quiz_history_', '');
            data[name] = JSON.parse(localStorage.getItem(key));
        }
    }
    
    userHistory = data;
}

function saveUserScore(name, score) {
    const key = 'quiz_history_' + name;
    let history = [];
    
    // Récupérer l'historique existant
    if (localStorage.getItem(key)) {
        history = JSON.parse(localStorage.getItem(key));
    }
    
    // Ajouter le nouveau score
    history.push({
        score: score,
        date: new Date().toLocaleString('fr-FR'),
        timestamp: Date.now()
    });
    
    // Sauvegarder
    localStorage.setItem(key, JSON.stringify(history));
    userHistory[name] = history;
}

function getUserHistory(name) {
    const key = 'quiz_history_' + name;
    if (localStorage.getItem(key)) {
        return JSON.parse(localStorage.getItem(key));
    }
    return [];
}

function checkReturningUser() {
    // Vérifier s'il y a un utilisateur récent
    const lastUser = localStorage.getItem('quiz_last_user');
    
    if (lastUser && userHistory[lastUser]) {
        const history = userHistory[lastUser];
        const lastScore = history[history.length - 1];
        
        document.getElementById('returningUserMessage').innerHTML = `
            <div class="welcome-message">
                <strong>Bon retour ${lastUser} !</strong><br>
                Votre dernier score : ${lastScore.score}/20 (${lastScore.date})
            </div>
        `;
        
        document.getElementById('userName').value = lastUser;
        displayUserHistory(lastUser);
    }
}

function displayUserHistory(name) {
    const history = getUserHistory(name);
    const historyDisplay = document.getElementById('historyDisplay');
    
    if (history.length > 0) {
        let html = '<div class="history-section"><h3>📊 Votre Historique</h3>';
        
        // Afficher les 5 derniers scores
        const recentHistory = history.slice(-5).reverse();
        
        recentHistory.forEach(item => {
            html += `
                <div class="history-item">
                    <span class="history-date">${item.date}</span>
                    <span class="history-score">${item.score}/20</span>
                </div>
            `;
        });
        
        html += '</div>';
        historyDisplay.innerHTML = html;
    } else {
        historyDisplay.innerHTML = '';
    }
}

// ============================================
// PARTIE 4: FONCTIONS DU QUIZ
// ============================================

function startQuiz() {
    const nameInput = document.getElementById('userName').value.trim();
    
    if (!nameInput) {
        alert('Veuillez entrer votre nom !');
        return;
    }
    
    userName = nameInput;
    localStorage.setItem('quiz_last_user', userName);
    
    // Sélectionner 20 questions aléatoires
    currentQuestions = getRandomQuestions(20);
    currentQuestionIndex = 0;
    score = 0;
    
    document.getElementById('displayName').textContent = userName;
    
    // Changer d'écran
    document.querySelector('.welcome-screen').classList.remove('active');
    document.querySelector('.quiz-screen').classList.add('active');
    
    displayQuestion();
}

function getRandomQuestions(count) {
    // Mélanger toutes les questions
    const shuffled = [...questionsDB].sort(() => Math.random() - 0.5);
    
    // Prendre les 'count' premières
    const selected = shuffled.slice(0, count);
    
    // Mélanger aussi les réponses pour chaque question
    return selected.map(q => {
        const question = {...q};
        const options = [...q.o];
        const correctAnswer = options[q.c];
        
        // Mélanger les options
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }
        
        // Trouver le nouvel index de la bonne réponse
        question.o = options;
        question.c = options.indexOf(correctAnswer);
        
        return question;
    });
}

function displayQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    selectedAnswer = null;
    
    // Mettre à jour les informations
    document.getElementById('currentQuestion').textContent = currentQuestionIndex + 1;
    document.getElementById('currentScore').textContent = score;
    document.getElementById('questionText').textContent = question.q;
    
    // Barre de progression
    const progress = ((currentQuestionIndex + 1) / 20) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    
    // Afficher les options
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    
    question.o.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.textContent = option;
        optionDiv.onclick = () => selectAnswer(index, optionDiv);
        optionsContainer.appendChild(optionDiv);
    });
    
    document.getElementById('nextBtn').style.display = 'none';
}

function selectAnswer(index, element) {
    if (selectedAnswer !== null) return; // Empêcher de changer après sélection
    
    selectedAnswer = index;
    const question = currentQuestions[currentQuestionIndex];
    const options = document.querySelectorAll('.option');
    
    // Désactiver tous les clics
    options.forEach(opt => {
        opt.style.cursor = 'default';
        opt.onclick = null;
    });
    
    // Montrer la bonne et mauvaise réponse
    options.forEach((opt, i) => {
        if (i === question.c) {
            opt.classList.add('correct');
        } else if (i === index) {
            opt.classList.add('incorrect');
        }
    });
    
    // Mettre à jour le score
    if (index === question.c) {
        score++;
        document.getElementById('currentScore').textContent = score;
    }
    
    // Afficher le bouton suivant
    document.getElementById('nextBtn').style.display = 'block';
}

function nextQuestion() {
    currentQuestionIndex++;
    
    if (currentQuestionIndex < 20) {
        displayQuestion();
    } else {
        showResults();
    }
}

// ============================================
// PARTIE 5: ÉCRAN DE RÉSULTATS
// ============================================

function showResults() {
    // Sauvegarder le score
    saveUserScore(userName, score);
    
    // Changer d'écran
    document.querySelector('.quiz-screen').classList.remove('active');
    document.querySelector('.result-screen').classList.add('active');
    
    // Afficher les résultats
    document.getElementById('finalName').textContent = userName;
    document.getElementById('finalScore').textContent = score + ' / 20';
    
    // Message selon le score
    const percentage = (score / 20) * 100;
    let message = '';
    
    if (percentage >= 90) {
        message = '🏆 Excellent ! Vous maîtrisez parfaitement la dynamique de groupe !';
    } else if (percentage >= 75) {
        message = '👏 Très bien ! Vous avez une bonne compréhension du sujet.';
    } else if (percentage >= 60) {
        message = '👍 Bien ! Continuez à réviser pour améliorer vos connaissances.';
    } else if (percentage >= 50) {
        message = '📚 Passable. Il serait bon de revoir certains concepts.';
    } else {
        message = '💪 Courage ! Révisez le cours et réessayez.';
    }
    
    document.getElementById('resultMessage').textContent = message;
}

function restartQuiz() {
    // Retour à l'écran d'accueil
    document.querySelector('.result-screen').classList.remove('active');
    document.querySelector('.welcome-screen').classList.add('active');
    
    // Recharger les données
    loadUserData();
    checkReturningUser();
}

function viewHistory() {
    // Afficher l'historique complet
    const history = getUserHistory(userName);
    
    if (history.length === 0) {
        alert('Aucun historique disponible.');
        return;
    }
    
    let message = `📊 Historique complet de ${userName}\n\n`;
    
    history.forEach((item, index) => {
        message += `${index + 1}. Score: ${item.score}/20 - ${item.date}\n`;
    });
    
    // Calculer la moyenne
    const average = history.reduce((sum, item) => sum + item.score, 0) / history.length;
    message += `\n📈 Score moyen: ${average.toFixed(1)}/20`;
    
    // Meilleur score
    const bestScore = Math.max(...history.map(h => h.score));
    message += `\n🌟 Meilleur score: ${bestScore}/20`;
    
    alert(message);
}

// ============================================
// PARTIE 6: FONCTIONS UTILITAIRES
// ============================================

// Empêcher le rechargement accidentel pendant le quiz
window.onbeforeunload = function(e) {
    if (document.querySelector('.quiz-screen').classList.contains('active')) {
        e.preventDefault();
        return 'Êtes-vous sûr de vouloir quitter ? Votre progression sera perdue.';
    }
};