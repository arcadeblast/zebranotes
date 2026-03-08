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
        { name: '', values: ['', '', '', '', ''] } // 6th optional category
    ],
    // puzzleGrid[catIndex][houseIndex] = Array of eliminated value indices
    puzzleGrid: Array(MAX_CATEGORIES).fill(0).map(() => Array(MAX_HOUSES).fill(0).map(() => [])),
    notes: '',
    currentView: 'setup' 
};

// --- Storage ---
function loadState() {
    const saved = localStorage.getItem('zebra-puzzle-state-v2');
    if (saved) {
        state = JSON.parse(saved);
        // Migration/Fix: ensure we have 6 categories if loading from old state
        while (state.categories.length < MAX_CATEGORIES) {
            state.categories.push({ name: '', values: Array(MAX_VALUES).fill('') });
        }
        // Ensure puzzleGrid is sized correctly
        if (state.puzzleGrid.length < MAX_CATEGORIES) {
            state.puzzleGrid = Array(MAX_CATEGORIES).fill(0).map(() => Array(MAX_HOUSES).fill(0).map(() => []));
        }
    }
}

function saveState() {
    localStorage.setItem('zebra-puzzle-state-v2', JSON.stringify(state));
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
        
        const label = document.createElement('label');
        label.textContent = `Category ${catIdx + 1} Name:`;
        label.style.fontSize = '0.8rem';
        label.style.display = 'block';
        label.style.marginBottom = '4px';
        block.appendChild(label);

        const nameInput = document.createElement('input');
        nameInput.className = 'cat-name-input';
        nameInput.value = cat.name;
        nameInput.placeholder = `e.g. Color...`;
        nameInput.oninput = (e) => {
            state.categories[catIdx].name = e.target.value;
            saveState();
        };
        block.appendChild(nameInput);

        const valuesLabel = document.createElement('label');
        valuesLabel.textContent = `Possible Values:`;
        valuesLabel.style.fontSize = '0.7rem';
        valuesLabel.style.display = 'block';
        valuesLabel.style.marginTop = '10px';
        valuesLabel.style.marginBottom = '4px';
        block.appendChild(valuesLabel);

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
    // Only render categories that have a name or at least one value
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
        state.puzzleGrid = Array(MAX_CATEGORIES).fill(0).map(() => Array(MAX_HOUSES).fill(0).map(() => []));
        state.notes = '';
        notesArea.value = '';
        saveState();
        renderPuzzle();
    }
};

// Initial view
switchView(state.currentView);
