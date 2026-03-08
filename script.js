// --- State Management ---
const MAX_CATEGORIES = 6;
const MAX_VALUES = 5;
const MAX_HOUSES = 5;

let state = {
    categories: [
        { name: 'Color', values: ['Red', 'Green', 'Ivory', 'Yellow', 'Blue'] },
        { name: 'Nationality', values: ['Englishman', 'Spaniard', 'Ukrainian', 'Norwegian', 'Japanese'] },
        { name: 'Beverage', values: ['Coffee', 'Tea', 'Milk', 'Orange Juice', 'Water'] },
        { name: 'Smoke', values: ['Old Gold', 'Kools', 'Chesterfields', 'Lucky Strike', 'Parliaments'] },
        { name: 'Pet', values: ['Dog', 'Snails', 'Fox', 'Horse', 'Zebra'] },
        { name: '', values: ['', '', '', '', ''] }
    ],
    puzzleGrid: Array(MAX_CATEGORIES).fill(0).map(() => Array(MAX_HOUSES).fill(0).map(() => [])),
    notes: '',
    currentView: 'setup',
    history: [],   // Stack for undo
    redoStack: []  // Stack for redo
};

// --- Storage ---
function loadState() {
    const saved = localStorage.getItem('zebra-puzzle-state-v4');
    if (saved) {
        state = JSON.parse(saved);
        // Ensure 6 categories
        while (state.categories.length < MAX_CATEGORIES) {
            state.categories.push({ name: '', values: Array(MAX_VALUES).fill('') });
        }
        if (!state.redoStack) state.redoStack = [];
    }
}

function saveState() {
    // Limit history and redo stacks for storage efficiency
    if (state.history.length > 50) state.history = state.history.slice(-50);
    if (state.redoStack.length > 50) state.redoStack = state.redoStack.slice(-50);
    localStorage.setItem('zebra-puzzle-state-v4', JSON.stringify(state));
}

function pushToHistory() {
    const snapshot = JSON.parse(JSON.stringify(state.puzzleGrid));
    state.history.push(snapshot);
    state.redoStack = []; // Clear redo stack on new action
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
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');

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
        
        const label = document.createElement('label');
        label.textContent = `Category ${catIdx + 1}:`;
        label.style.fontSize = '0.8rem';
        label.style.display = 'block';
        block.appendChild(label);

        const nameInput = document.createElement('input');
        nameInput.className = 'cat-name-input';
        nameInput.value = cat.name;
        nameInput.placeholder = `Category name...`;
        nameInput.oninput = (e) => {
            state.categories[catIdx].name = e.target.value;
            saveState();
        };
        block.appendChild(nameInput);

        for (let i = 0; i < MAX_VALUES; i++) {
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
        const hasContent = cat.name || cat.values.some(v => v.trim() !== '');
        if (!hasContent) return;

        const tr = document.createElement('tr');
        tr.className = 'zebra-stripe';
        
        const labelTd = document.createElement('td');
        labelTd.className = 'category-label';
        labelTd.textContent = cat.name || `Category ${catIdx + 1}`;
        tr.appendChild(labelTd);

        for (let houseIdx = 0; houseIdx < MAX_HOUSES; houseIdx++) {
            const td = document.createElement('td');
            const container = document.createElement('div');
            container.className = 'candidates-container';

            cat.values.forEach((val, valIdx) => {
                if (!val || val.trim() === '') return;
                const span = document.createElement('span');
                span.className = 'candidate';
                span.textContent = val;
                
                const isEliminated = state.puzzleGrid[catIdx][houseIdx].includes(valIdx);
                if (isEliminated) span.classList.add('eliminated');

                span.onclick = () => {
                    pushToHistory();
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
    if (confirm('Clear all progress?')) {
        pushToHistory();
        state.puzzleGrid = Array(MAX_CATEGORIES).fill(0).map(() => Array(MAX_HOUSES).fill(0).map(() => []));
        state.notes = '';
        notesArea.value = '';
        saveState();
        renderPuzzle();
    }
};

undoBtn.onclick = () => {
    if (state.history.length > 0) {
        state.redoStack.push(JSON.parse(JSON.stringify(state.puzzleGrid)));
        state.puzzleGrid = state.history.pop();
        saveState();
        renderPuzzle();
    }
};

redoBtn.onclick = () => {
    if (state.redoStack.length > 0) {
        state.history.push(JSON.parse(JSON.stringify(state.puzzleGrid)));
        state.puzzleGrid = state.redoStack.pop();
        saveState();
        renderPuzzle();
    }
};

switchView(state.currentView);
