import { useState, useEffect } from 'react'
import './App.css'

const CATEGORIES = ['Color', 'Nationality', 'Beverage', 'Smoke', 'Pet']
const HOUSES = [1, 2, 3, 4, 5]

function App() {
  const [grid, setGrid] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('zebra-notes-grid')
    const initialGrid: Record<string, string[]> = {}
    CATEGORIES.forEach(cat => {
      initialGrid[cat] = new Array(5).fill('')
    })

    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Ensure all categories exist in the parsed object
        CATEGORIES.forEach(cat => {
          if (!parsed[cat]) parsed[cat] = new Array(5).fill('')
        })
        return parsed
      } catch (e) {
        console.error('Failed to parse saved grid', e)
      }
    }
    return initialGrid
  })

  const [notes, setNotes] = useState(() => {
    return localStorage.getItem('zebra-notes-text') || ''
  })

  useEffect(() => {
    localStorage.setItem('zebra-notes-grid', JSON.stringify(grid))
  }, [grid])

  useEffect(() => {
    localStorage.setItem('zebra-notes-text', notes)
  }, [notes])

  const updateCell = (category: string, index: number, value: string) => {
    setGrid((prev) => ({
      ...prev,
      [category]: prev[category].map((v, i) => i === index ? value : v)
    }))
  }

  const resetAll = () => {
    if (window.confirm('Are you sure you want to clear all notes?')) {
      const resetGrid: Record<string, string[]> = {}
      CATEGORIES.forEach(cat => {
        resetGrid[cat] = new Array(5).fill('')
      })
      setGrid(resetGrid)
      setNotes('')
    }
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1>Zebra Notes</h1>
      </header>

      <main>
        <table className="puzzle-grid">
          <thead>
            <tr>
              <th className="category-label">Category</th>
              {HOUSES.map(h => <th key={h}>House {h}</th>)}
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map(cat => (
              <tr key={cat} className="zebra-stripe">
                <td className="category-label">{cat}</td>
                {HOUSES.map((_, i) => (
                  <td key={i}>
                    <input 
                      type="text" 
                      className="cell-input"
                      value={grid[cat][i]}
                      onChange={(e) => updateCell(cat, i, e.target.value)}
                      placeholder="..."
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <section className="notes-section">
          <label className="notes-label">Deductions & Clues</label>
          <textarea 
            placeholder="Type your clues or deductions here..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </section>

        <div className="controls">
          <button onClick={resetAll}>Clear Everything</button>
        </div>
      </main>
    </div>
  )
}

export default App
