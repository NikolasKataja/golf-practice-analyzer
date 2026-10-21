import { useState, } from 'react'

function App() {
  const [message, setMessage] = useState('Connection not tested yet')

  async function testConnection() {
    setMessage('Testing connection...')

    try {
      const response = await fetch('/api/weatherforecast')

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setMessage(`Connection successful! Backend returned ${data.length} weather forecasts`)
    } catch {
      setMessage('Connection failed')
    }
  }
  return (
    <main>
      <h1>Golf Practice Analyzer</h1>
      <button onClick={testConnection}>Test Connection</button>
      <p>{message}</p>
    </main>
  )
}

export default App