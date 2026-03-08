// --- State Management ---
let state = {
    categories: [
        { name: 'Color', values: ['Red', 'Green', 'Ivory', 'Yellow', 'Blue'] },
        { name: 'Nationality', values: ['Englishman', 'Spaniard', 'Ukrainian', 'Norwegian', 'Japanese'] },
        { name: 'Beverage', values: ['Coffee', 'Tea', 'Milk', 'Orange Juice', 'Water'] },
        { name: 'Smoke', values: ['Old Gold', 'Kools', 'Chesterfields', 'Lucky Strike', 'Parliaments'] },
        { name: 'Pet', values: ['Dog', 'Snails', 'Fox', 'Horse', 'Zebra'] }
    ],
    // puzzleGrid[catIndex][houseIndex] = Array of eliminated value indices
    puzzleGrid: Array(5).fill(0).map(() => Array(5).fill(0).map(() => [])),
    notes: '',
    currentView: 'setup' // 'setup' or 'puzzle'
};

// --- Storage ---
function loadState() {
    const saved = localStorage.getItem('zebra-puzzle-state');
    if (saved) {
        state = JSON.parse(saved);
    }
}

function saveState() {
    localStorage.setItem('zebra-puzzle-state', JSON.stringify(state));
}

// --- DOM Elements ---
const setupView = document.getElementById('setup-view');
const puzzleView = document.getElementById('puzzle-view');
const catInputsContainer = document.getElementById('category-inputs-container');
const gridBody = document.getElementById('grid-body');
const notesArea = document.getElementById('notes-area');
const showSetupBtn = document.getElementById('show-setup');
const showPuzzleBtn = document.getElementById('show-puzzle');
const saveSetupBtn = document.getElementById('save-setup');
const resetBtn = document.getElementById('reset-btn');

// --- View Logic ---
function switchView(viewName) {
    state.currentView = viewName;
    if (viewName === 'setup') {
        setupView.classList.remove('hidden');
        puzzleView.classList.add('hidden');
        showSetupBtn.classList.add('active');
        showPuzzleBtn.classList.remove('active');
        renderSetup();
    } else {
        setupView.classList.add('hidden');
        puzzleView.classList.remove('hidden');
        showSetupBtn.classList.remove('active');
        showPuzzleBtn.classList.add('active');
        renderPuzzle();
    }
    saveState();
}

// --- Setup Logic ---
function renderSetup() {
    catInputsContainer.innerHTML = '';
    state.categories.forEach((cat, catIdx) => {
        const block = document.createElement('div');
        block.className = 'category-setup-block';
        
        const nameInput = document.createElement('input');
        nameInput.className = 'cat-name-input';
        nameInput.value = cat.name;
        nameInput.placeholder = `Category ${catIdx + 1}`;
        nameInput.oninput = (e) => {
            state.categories[catIdx].name = e.target.value;
            saveState();
        };
        block.appendChild(nameInput);

        for (let i = 0; i < 5; i++) {
            const valInput = document.createElement('input');
            valInput.value = cat.values[i] || '';
            valInput.placeholder = `Value ${i + 1}`;
            valInput.oninput = (e) => {
                state.categories[catIdx].values[i] = e.target.value;
                saveState();
            };
            block.appendChild(valInput);
        }
        catInputsContainer.appendChild(block);
    });
}

// --- Puzzle Logic ---
function renderPuzzle() {
    gridBody.innerHTML = '';
    state.categories.forEach((cat, catIdx) => {
        const tr = document.createElement('tr');
        tr.className = 'zebra-stripe';
        
        const labelTd = document.createElement('td');
        labelTd.className = 'category-label';
        labelTd.textContent = cat.name || `Category ${catIdx + 1}`;
        tr.appendChild(labelTd);

        for (let houseIdx = 0; houseIdx < 5; houseIdx++) {
            const td = document.createElement('td');
            const container = document.createElement('div');
            container.className = 'candidates-container';

            cat.values.forEach((val, valIdx) => {
                if (!val) return;
                const span = document.createElement('span');
                span.className = 'candidate';
                span.textContent = val;
                
                const isEliminated = state.puzzleGrid[catIdx][houseIdx].includes(valIdx);
                if (isEliminated) span.classList.add('eliminated');

                span.onclick = () => {
                    const elimList = state.puzzleGrid[catIdx][houseIdx];
                    if (elimList.includes(valIdx)) {
                        state.puzzleGrid[catIdx][houseIdx] = elimList.filter(idx => idx !== valIdx);
                    } else {
                        state.puzzleGrid[catIdx][houseIdx].push(valIdx);
                    }
                    saveState();
                    renderPuzzle();
                };

                container.appendChild(span);
            });

            td.appendChild(container);
            tr.appendChild(td);
        }
        gridBody.appendChild(tr);
    });
}

// --- Initialization ---
loadState();

showSetupBtn.onclick = () => switchView('setup');
showPuzzleBtn.onclick = () => switchView('puzzle');
saveSetupBtn.onclick = () => switchView('puzzle');

notesArea.value = state.notes;
notesArea.oninput = (e) => {
    state.notes = e.target.value;
    saveState();
};

resetBtn.onclick = () => {
    if (confirm('Clear all progress? (Categories will be kept, but grid and notes will be wiped)')) {
        state.puzzleGrid = Array(5).fill(0).map(() => Array(5).fill(0).map(() => []));
        state.notes = '';
        notesArea.value = '';
        saveState();
        renderPuzzle();
    }
};

// Initial view
switchView(state.currentView);
