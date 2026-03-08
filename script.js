const CATEGORIES = ['Color', 'Nationality', 'Beverage', 'Smoke', 'Pet'];
const gridBody = document.getElementById('grid-body');
const notesArea = document.getElementById('notes-area');
const resetBtn = document.getElementById('reset-btn');

// Load data from localStorage
let gridData = JSON.parse(localStorage.getItem('zebra-notes-grid')) || {};
notesArea.value = localStorage.getItem('zebra-notes-text') || '';

// Initialize grid data if empty
CATEGORIES.forEach(cat => {
    if (!gridData[cat]) {
        gridData[cat] = ['', '', '', '', ''];
    }
});

// Build the table
function renderGrid() {
    gridBody.innerHTML = '';
    CATEGORIES.forEach(cat => {
        const tr = document.createElement('tr');
        tr.className = 'zebra-stripe';
        
        const labelTd = document.createElement('td');
        labelTd.className = 'category-label';
        labelTd.textContent = cat;
        tr.appendChild(labelTd);

        for (let i = 0; i < 5; i++) {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'cell-input';
            input.placeholder = '...';
            input.value = gridData[cat][i];
            
            input.addEventListener('input', (e) => {
                gridData[cat][i] = e.target.value;
                localStorage.setItem('zebra-notes-grid', JSON.stringify(gridData));
            });

            td.appendChild(input);
            tr.appendChild(td);
        }
        gridBody.appendChild(tr);
    });
}

// Save notes on input
notesArea.addEventListener('input', (e) => {
    localStorage.setItem('zebra-notes-text', e.target.value);
});

// Reset functionality
resetBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all notes?')) {
        gridData = {};
        CATEGORIES.forEach(cat => gridData[cat] = ['', '', '', '', '']);
        notesArea.value = '';
        localStorage.removeItem('zebra-notes-grid');
        localStorage.removeItem('zebra-notes-text');
        renderGrid();
    }
});

renderGrid();
