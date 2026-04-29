import React from "react"
import ReactDOM from "react-dom/client"
import { trace } from "@why-run/core"
import { initPanel } from "@why-run/panel"
import { useTracedCallback } from "@why-run/react"

import "@why-run/panel/style.css"

// Initialize the panel
initPanel({ position: "bottom-right", shortcut: "ctrl+shift+w" })

// Example traced functions
const fetchUser = trace("fetchUser", async (id: number) => {
  await new Promise((resolve) => setTimeout(resolve, 100))
  return { id, name: `User ${id}` }
})

const updateState = trace("updateState", (setUser: (u: any) => void, user: any) => {
  setUser(user)
})

function App() {
  const [userId, setUserId] = React.useState("")
  const [user, setUser] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)

  const handleFetch = useTracedCallback(
    "handleFetch",
    async () => {
      if (!userId) return
      setLoading(true)
      const data = await fetchUser(parseInt(userId))
      updateState(setUser, data)
      setLoading(false)
    },
    [userId]
  )

  return (
    <div style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1>Why Run Demo</h1>
      <p>Type a user ID and click "Fetch User". Then press Ctrl+Shift+W to open the trace panel.</p>

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <input
          type="number"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter user ID"
          style={{ padding: "8px 12px", fontSize: 16 }}
        />
        <button onClick={handleFetch} disabled={loading} style={{ padding: "8px 16px", fontSize: 16 }}>
          {loading ? "Loading..." : "Fetch User"}
        </button>
      </div>

      {user && (
        <div style={{ marginTop: 20, padding: 20, background: "#f5f5f5", borderRadius: 8 }}>
          <h3>User Data</h3>
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>
      )}

      <div style={{ marginTop: 40, padding: 20, background: "#e8f4f8", borderRadius: 8 }}>
        <h3>Instructions</h3>
        <ol>
          <li>Enter a number (e.g., 123) and click "Fetch User"</li>
          <li>Press <kbd>Ctrl+Shift+W</kbd> to open the trace panel</li>
          <li>Click on any function in the list to see the "why chain"</li>
        </ol>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
