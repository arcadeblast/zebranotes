// --- State Management ---
const MAX_CATEGORIES = 6;
const MAX_VALUES = 5;
const MAX_POSITIONS = 5;

let state = {
    categories: [
        { name: 'Category 1', values: ['Red', 'Green', 'Ivory', 'Yellow', 'Blue'] },
        { name: 'Category 2', values: ['Englishman', 'Spaniard', 'Ukrainian', 'Norwegian', 'Japanese'] },
        { name: 'Category 3', values: ['Coffee', 'Tea', 'Milk', 'Orange Juice', 'Water'] },
        { name: 'Category 4', values: ['Old Gold', 'Kools', 'Chesterfields', 'Lucky Strike', 'Parliaments'] },
        { name: 'Category 5', values: ['Dog', 'Snails', 'Fox', 'Horse', 'Zebra'] },
        { name: 'Category 6', values: ['', '', '', '', ''] }
    ],
    puzzleGrid: Array(MAX_CATEGORIES).fill(0).map(() => Array(MAX_POSITIONS).fill(0).map(() => [])),
    clues: [], // Stores { text, rel, vals, itemData: [] }
    currentView: 'setup',
    history: [],
    redoStack: []
};

// --- Storage ---
function loadState() {
    const saved = localStorage.getItem('zebra-puzzle-state-v7');
    if (saved) {
        state = JSON.parse(saved);
        if (!state.clues) state.clues = [];
        // Migration: If clues are strings, clear them or wrap them (better to just clear for this prototype upgrade)
        if (state.clues.length > 0 && typeof state.clues[0] === 'string') {
            state.clues = [];
        }
    }
}

function saveState() {
    localStorage.setItem('zebra-puzzle-state-v7', JSON.stringify(state));
}

// --- DOM Elements ---
const setupView = document.getElementById('setup-view');
const cluesView = document.getElementById('clues-view');
const solveView = document.getElementById('solve-view');

const showSetupBtn = document.getElementById('show-setup');
const showCluesBtn = document.getElementById('show-clues');
const showSolveBtn = document.getElementById('show-solve');

const catInputsContainer = document.getElementById('category-inputs-container');
const relSelect = document.getElementById('rel-select');
const itemSelectsContainer = document.getElementById('item-selects');
const addClueBtn = document.getElementById('add-clue-btn');
const cluesList = document.getElementById('clues-list');
const solveCluesDisplay = document.getElementById('solve-clues-display');

const gridBody = document.getElementById('grid-body');

// --- Navigation ---
function switchView(viewName) {
    state.currentView = viewName;
    [setupView, cluesView, solveView].forEach(v => v.classList.add('hidden'));
    [showSetupBtn, showCluesBtn, showSolveBtn].forEach(b => b.classList.remove('active'));

    if (viewName === 'setup') {
        setupView.classList.remove('hidden');
        showSetupBtn.classList.add('active');
        renderSetup();
    } else if (viewName === 'clues') {
        cluesView.classList.remove('hidden');
        showCluesBtn.classList.add('active');
        renderClueBuilder();
        renderCluesList();
    } else {
        solveView.classList.remove('hidden');
        showSolveBtn.classList.add('active');
        renderPuzzle();
        renderSolveClues();
    }
    saveState();
}

// --- Setup View ---
function renderSetup() {
    catInputsContainer.innerHTML = '';
    state.categories.forEach((cat, catIdx) => {
        const block = document.createElement('div');
        block.className = 'category-setup-block';
        const label = document.createElement('label');
        label.textContent = `Category ${catIdx + 1}:`;
        label.style.fontWeight = 'bold';
        label.style.display = 'block';
        label.style.marginBottom = '8px';
        block.appendChild(label);

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

// --- Clue Builder Logic ---
const RELATIONS = {
    same: { label: 'Goes with / Same position', items: 2 },
    next: { label: 'Next to', items: 2 },
    'left-of': { label: 'Immediately to the left of', items: 2 },
    'right-of': { label: 'Immediately to the right of', items: 2 },
    between: { label: 'Is between', items: 3 },
    position: { label: 'Is in Position #', items: 2, type: 'pos' },
    'left-end': { label: 'Is at the left end', items: 1 },
    'right-end': { label: 'Is at the right end', items: 1 },
    ends: { label: 'Is at one of the ends', items: 1 }
};

function getAllItems() {
    const items = [];
    state.categories.forEach((cat, cIdx) => {
        cat.values.forEach((val, vIdx) => {
            if (val && val.trim()) {
                items.push({ text: val, catIdx: cIdx, valIdx: vIdx });
            }
        });
    });
    return items;
}

function renderClueBuilder() {
    const rel = relSelect.value;
    const config = RELATIONS[rel];
    itemSelectsContainer.innerHTML = '';
    const allItems = getAllItems();

    for (let i = 0; i < config.items; i++) {
        const select = document.createElement('select');
        if (config.type === 'pos' && i === 0) {
            for (let h = 1; h <= 5; h++) {
                const opt = document.createElement('option');
                opt.value = h;
                opt.textContent = `Position ${h}`;
                select.appendChild(opt);
            }
        } else {
            allItems.forEach(item => {
                const opt = document.createElement('option');
                opt.value = JSON.stringify(item);
                opt.textContent = item.text;
                select.appendChild(opt);
            });
        }
        itemSelectsContainer.appendChild(select);
    }
}

relSelect.onchange = renderClueBuilder;

addClueBtn.onclick = () => {
    const rel = relSelect.value;
    const selects = itemSelectsContainer.querySelectorAll('select');
    const rawVals = Array.from(selects).map(s => s.value);
    
    let text = '';
    let itemData = [];

    // Parse item data
    rawVals.forEach((v, idx) => {
        if (rel === 'position' && idx === 0) {
            itemData.push({ type: 'house', val: parseInt(v) });
        } else {
            itemData.push(JSON.parse(v));
        }
    });

    const vNames = itemData.map(d => d.text || d.val);

    if (rel === 'same') text = `${vNames[0]} goes with ${vNames[1]}`;
    else if (rel === 'next') text = `${vNames[0]} is next to ${vNames[1]}`;
    else if (rel === 'left-of') text = `${vNames[0]} is to the left of ${vNames[1]}`;
    else if (rel === 'right-of') text = `${vNames[0]} is to the right of ${vNames[1]}`;
    else if (rel === 'between') text = `${vNames[0]} is between ${vNames[1]} and ${vNames[2]}`;
    else if (rel === 'position') text = `${vNames[1]} is in Position ${vNames[0]}`;
    else if (rel === 'left-end') text = `${vNames[0]} is at the left end`;
    else if (rel === 'right-end') text = `${vNames[0]} is at the right end`;
    else if (rel === 'ends') text = `${vNames[0]} is at one of the ends`;

    state.clues.push({ text, rel, itemData });
    saveState();
    renderCluesList();
};

function renderCluesList() {
    cluesList.innerHTML = '';
    state.clues.forEach((clue, idx) => {
        const li = document.createElement('li');
        li.textContent = clue.text;
        const del = document.createElement('button');
        del.className = 'del-clue';
        del.textContent = 'X';
        del.onclick = () => {
            state.clues.splice(idx, 1);
            saveState();
            renderCluesList();
        };
        li.appendChild(del);
        cluesList.appendChild(li);
    });
}

// --- Clue Satisfaction Logic ---
function getConfirmedPos(catIdx, valIdx) {
    for (let h = 0; h < MAX_POSITIONS; h++) {
        const elimList = state.puzzleGrid[catIdx][h];
        const catVals = state.categories[catIdx].values;
        const activeCount = catVals.filter((v, i) => v && v.trim() !== '' && !elimList.includes(i)).length;
        if (activeCount === 1 && !elimList.includes(valIdx)) {
            return h;
        }
    }
    return null;
}

function checkClueSatisfied(clue) {
    const positions = clue.itemData.map(d => {
        if (d.type === 'house') return d.val - 1; // 0-indexed
        return getConfirmedPos(d.catIdx, d.valIdx);
    });

    // If any required position is missing, it's not satisfied
    if (positions.some(p => p === null)) return false;

    const [p1, p2, p3] = positions;

    switch (clue.rel) {
        case 'same': return p1 === p2;
        case 'next': return Math.abs(p1 - p2) === 1;
        case 'left-of': return p1 === p2 - 1;
        case 'right-of': return p1 === p2 + 1;
        case 'between': return (p2 === p1 - 1 && p3 === p1 + 1) || (p3 === p1 - 1 && p2 === p1 + 1);
        case 'position': return p1 === p2; // p1 is target pos, p2 is item pos
        case 'left-end': return p1 === 0;
        case 'right-end': return p1 === 4;
        case 'ends': return p1 === 0 || p1 === 4;
        default: return false;
    }
}

function renderSolveClues() {
    solveCluesDisplay.innerHTML = '';
    if (state.clues.length === 0) {
        solveCluesDisplay.innerHTML = '<div class="solve-clue-item" style="color:#888;">No clues added yet.</div>';
        return;
    }
    state.clues.forEach(clue => {
        const div = document.createElement('div');
        div.className = 'solve-clue-item';
        
        const isSatisfied = checkClueSatisfied(clue);
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'clue-checkbox';
        checkbox.checked = isSatisfied;
        checkbox.disabled = true; // Not user-interactable
        div.appendChild(checkbox);

        const textSpan = document.createElement('span');
        textSpan.textContent = clue.text;
        div.appendChild(textSpan);

        if (isSatisfied) {
            div.classList.add('clue-satisfied');
        }
        solveCluesDisplay.appendChild(div);
    });
}

// --- Solving View ---
function renderPuzzle() {
    gridBody.innerHTML = '';
    state.categories.forEach((cat, catIdx) => {
        if (!cat.values.some(v => v && v.trim())) return;
        const tr = document.createElement('tr');
        tr.className = 'zebra-stripe';
        for (let h = 0; h < MAX_POSITIONS; h++) {
            const td = document.createElement('td');
            const container = document.createElement('div');
            container.className = 'candidates-container';
            const elimList = state.puzzleGrid[catIdx][h];
            
            const activeIndices = cat.values
                .map((v, i) => (v && v.trim() !== '' && !elimList.includes(i) ? i : -1))
                .filter(i => i !== -1);

            cat.values.forEach((val, vIdx) => {
                if (!val || val.trim() === '') return;
                const span = document.createElement('span');
                span.className = 'candidate';
                span.textContent = val;
                if (elimList.includes(vIdx)) span.classList.add('eliminated');
                else if (activeIndices.length === 1) span.classList.add('confirmed');
                span.onclick = () => {
                    pushToHistory();
                    if (elimList.includes(vIdx)) state.puzzleGrid[catIdx][h] = elimList.filter(idx => idx !== vIdx);
                    else state.puzzleGrid[catIdx][h].push(vIdx);
                    saveState();
                    renderPuzzle();
                    renderSolveClues(); // Update clue highlights too
                };
                container.appendChild(span);
            });
            td.appendChild(container);
            tr.appendChild(td);
        }
        gridBody.appendChild(tr);
    });
}

function pushToHistory() {
    state.history.push(JSON.parse(JSON.stringify(state.puzzleGrid)));
    state.redoStack = [];
}

// --- Init ---
loadState();
showSetupBtn.onclick = () => switchView('setup');
showCluesBtn.onclick = () => switchView('clues');
showSolveBtn.onclick = () => switchView('solve');
document.getElementById('save-setup').onclick = () => switchView('clues');
document.getElementById('start-solving-btn').onclick = () => switchView('solve');

document.getElementById('reset-btn').onclick = () => {
    if (confirm('Reset grid? (Setup and Clues are kept)')) {
        pushToHistory();
        state.puzzleGrid = Array(MAX_CATEGORIES).fill(0).map(() => Array(MAX_POSITIONS).fill(0).map(() => []));
        saveState();
        renderPuzzle();
        renderSolveClues();
    }
};

document.getElementById('undo-btn').onclick = () => {
    if (state.history.length > 0) {
        state.redoStack.push(JSON.parse(JSON.stringify(state.puzzleGrid)));
        state.puzzleGrid = state.history.pop();
        saveState();
        renderPuzzle();
        renderSolveClues();
    }
};

document.getElementById('redo-btn').onclick = () => {
    if (state.redoStack.length > 0) {
        state.history.push(JSON.parse(JSON.stringify(state.puzzleGrid)));
        state.puzzleGrid = state.redoStack.pop();
        saveState();
        renderPuzzle();
        renderSolveClues();
    }
};

switchView(state.currentView);
