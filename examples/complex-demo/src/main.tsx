import React, { useState, useEffect, useRef } from "react"
import ReactDOM from "react-dom/client"
import { trace } from "@why-run/core"
import { initPanel } from "@why-run/panel"
import { useTracedCallback } from "@why-run/react"

import "@why-run/panel/style.css"

// Initialize the panel
initPanel({ position: "bottom-right", shortcut: "ctrl+shift+w" })

// =============================================================================
// MOCK API LAYER - Simulates a real backend with delays and occasional errors
// =============================================================================

const mockApiCall = trace(
  "mockApiCall",
  async <T,>(endpoint: string, data: T, delay: number, shouldFail = false) => {
    await new Promise((resolve) => setTimeout(resolve, delay))
    if (shouldFail) throw new Error(`API Error: ${endpoint} failed`)
    return { endpoint, data, timestamp: Date.now() }
  }
)

// =============================================================================
// DATA SERVICE LAYER - Multiple parallel async operations
// =============================================================================

const fetchUserProfile = trace("fetchUserProfile", async (userId: string) => {
  const result = await mockApiCall(`/users/${userId}`, { userId }, 150)
  return { ...result, type: "profile" }
})

const fetchUserSettings = trace("fetchUserSettings", async (userId: string) => {
  const result = await mockApiCall(`/users/${userId}/settings`, { userId }, 200)
  return { ...result, preferences: { theme: "dark", notifications: true } }
})

const fetchUserPermissions = trace(
  "fetchUserPermissions",
  async (userId: string) => {
    const result = await mockApiCall(
      `/users/${userId}/permissions`,
      { userId },
      100
    )
    return { ...result, permissions: ["read", "write", "delete"] }
  }
)

const fetchUserActivity = trace("fetchUserActivity", async (userId: string) => {
  // Parallel nested calls - simulating activity feed aggregation
  const [posts, comments, likes] = await Promise.all([
    mockApiCall(`/users/${userId}/posts`, {}, 180),
    mockApiCall(`/users/${userId}/comments`, {}, 120),
    mockApiCall(`/users/${userId}/likes`, {}, 90),
  ])
  return { posts: 42, comments: 128, likes: 567, details: { posts, comments, likes } }
})

// DEEP CHAIN: Level 1 -> Level 2 -> Level 3 -> Level 4 -> Level 5
const fetchDashboardAnalytics = trace(
  "fetchDashboardAnalytics",
  async (userId: string) => {
    // This triggers a 5-level deep async chain
    const sessionData = await analyzeSessionData(userId)
    const engagement = await calculateEngagementMetrics(sessionData)
    const predictions = await generatePredictions(engagement)
    const recommendations = await buildRecommendations(predictions)
    return recommendations
  }
)

// Level 2
const analyzeSessionData = trace("analyzeSessionData", async (userId: string) => {
  const raw = await fetchRawSessionLogs(userId)
  const processed = await processSessionBatch(raw)
  return { userId, sessions: processed, count: processed.length }
})

// Level 3
const processSessionBatch = trace("processSessionBatch", async (logs: any[]) => {
  const validated = await validateSessionLogs(logs)
  const enriched = await enrichSessionMetadata(validated)
  return enriched.map((log: any) => ({ ...log, processed: true }))
})

// Level 4
const enrichSessionMetadata = trace(
  "enrichSessionMetadata",
  async (logs: any[]) => {
    const geos = await batchGeolocationLookup(logs)
    const devices = await batchDeviceDetection(logs)
    return logs.map((log, i) => ({
      ...log,
      geo: geos[i],
      device: devices[i],
      enriched: true,
    }))
  }
)

// Level 5 - Deepest
const batchGeolocationLookup = trace(
  "batchGeolocationLookup",
  async (logs: any[]) => {
    await new Promise((r) => setTimeout(r, 50))
    return logs.map(() => ({ country: "US", region: "CA", city: "SF" }))
  }
)

const batchDeviceDetection = trace("batchDeviceDetection", async (logs: any[]) => {
  await new Promise((r) => setTimeout(r, 50))
  return logs.map(() => ({ type: "mobile", os: "iOS", browser: "Safari" }))
})

// Level 4 continuation
const calculateEngagementMetrics = trace(
  "calculateEngagementMetrics",
  async (sessionData: any) => {
    const scores = await computeEngagementScores(sessionData.sessions)
    const trends = await analyzeTrends(scores)
    return { ...sessionData, scores, trends }
  }
)

const computeEngagementScores = trace(
  "computeEngagementScores",
  async (sessions: any[]) => {
    await new Promise((r) => setTimeout(r, 60))
    return sessions.map((s) => ({
      sessionId: s.id,
      score: Math.random() * 100,
      category: Math.random() > 0.5 ? "high" : "low",
    }))
  }
)

const analyzeTrends = trace("analyzeTrends", async (scores: any[]) => {
  await new Promise((r) => setTimeout(r, 40))
  const avg = scores.reduce((a, b) => a + b.score, 0) / scores.length
  return { average: avg, direction: avg > 50 ? "up" : "down", change: Math.random() }
})

// Level 3 -> Level 5 continuation
const generatePredictions = trace("generatePredictions", async (data: any) => {
  const modelA = await runMLModelA(data)
  const modelB = await runMLModelB(data)
  const combined = await combineModelResults([modelA, modelB])
  return { ...data, predictions: combined }
})

const runMLModelA = trace("runMLModelA", async (_data: any) => {
  await new Promise((r) => setTimeout(r, 100))
  return { model: "A", confidence: 0.85, prediction: "growth" }
})

const runMLModelB = trace("runMLModelB", async (_data: any) => {
  await new Promise((r) => setTimeout(r, 120))
  return { model: "B", confidence: 0.72, prediction: "stable" }
})

const combineModelResults = trace("combineModelResults", async (results: any[]) => {
  await new Promise((r) => setTimeout(r, 30))
  const avgConfidence = results.reduce((a, b) => a + b.confidence, 0) / results.length
  return { ensemble: true, confidence: avgConfidence, results }
})

// Level 2 -> Level 5 continuation
const buildRecommendations = trace("buildRecommendations", async (data: any) => {
  const candidates = await fetchRecommendationCandidates(data)
  const ranked = await rankRecommendations(candidates, data.predictions)
  return { ...data, recommendations: ranked.slice(0, 5) }
})

const fetchRecommendationCandidates = trace(
  "fetchRecommendationCandidates",
  async (_data: any) => {
    await new Promise((r) => setTimeout(r, 80))
    return ["feature_1", "feature_2", "feature_3", "feature_4", "feature_5"]
  }
)

const rankRecommendations = trace(
  "rankRecommendations",
  async (candidates: string[], _predictions: any) => {
    await new Promise((r) => setTimeout(r, 50))
    return candidates.sort(() => Math.random() - 0.5)
  }
)

// More Level 2 functions
const fetchRawSessionLogs = trace("fetchRawSessionLogs", async (userId: string) => {
  await new Promise((r) => setTimeout(r, 100))
  return Array.from({ length: 10 }, (_, i) => ({
    id: `session_${i}`,
    userId,
    timestamp: Date.now() - i * 86400000,
    duration: Math.random() * 3600,
  }))
})

const validateSessionLogs = trace("validateSessionLogs", async (logs: any[]) => {
  await new Promise((r) => setTimeout(r, 40))
  return logs.filter((log) => log.duration > 0)
})

// =============================================================================
// STATE MANAGEMENT - Complex reducer-like pattern with side effects
// =============================================================================

const validateInput = trace("validateInput", (value: string, rules: any) => {
  const errors: string[] = []
  if (rules.required && !value) errors.push("Required field")
  if (rules.minLength && value.length < rules.minLength)
    errors.push(`Min length is ${rules.minLength}`)
  if (rules.pattern && !rules.pattern.test(value)) errors.push("Invalid format")
  return errors
})

const transformData = trace("transformData", (data: any, transformers: any[]) => {
  return transformers.reduce((acc, transformer) => {
    if (transformer.type === "map") {
      return acc.map(transformer.fn)
    }
    if (transformer.type === "filter") {
      return acc.filter(transformer.fn)
    }
    if (transformer.type === "sort") {
      return [...acc].sort(transformer.fn)
    }
    return acc
  }, data)
})

// =============================================================================
// ERROR HANDLING - Chains that might fail
// =============================================================================

const flakyNetworkCall = trace(
  "flakyNetworkCall",
  async (attempt: number, failUntilAttempt = 2) => {
    await new Promise((r) => setTimeout(r, 100))
    if (attempt <= failUntilAttempt) {
      throw new Error(`Network error on attempt ${attempt}`)
    }
    return { success: true, attempt }
  }
)

const retryWithBackoff = trace(
  "retryWithBackoff",
  async (operation: () => Promise<any>, maxRetries = 3) => {
    for (let i = 1; i <= maxRetries; i++) {
      try {
        const result = await operation()
        return { result, attempts: i }
      } catch (err) {
        if (i === maxRetries) throw err
        await new Promise((r) => setTimeout(r, 100 * Math.pow(2, i)))
      }
    }
  }
)

// =============================================================================
// RACE CONDITIONS & CONCURRENT OPERATIONS
// =============================================================================

const fetchWithTimeout = trace(
  "fetchWithTimeout",
  async <T,>(
    promise: Promise<T>,
    timeoutMs: number,
    label: string
  ): Promise<T> => {
    const timeout = new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs)
    )
    return Promise.race([promise, timeout])
  }
)

const fetchMultipleSources = trace(
  "fetchMultipleSources",
  async (query: string) => {
    const sources = [
      { name: "api-a", delay: 150 },
      { name: "api-b", delay: 200 },
      { name: "api-c", delay: 100 },
    ]

    const results = await Promise.allSettled(
      sources.map(async (source) => {
        const call = mockApiCall(source.name, { query }, source.delay)
        return fetchWithTimeout(call, 180, source.name)
      })
    )

    return results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
      .map((r) => r.value)
  }
)

// =============================================================================
// EVENT HANDLING - Deep event propagation
// =============================================================================

const processClickEvent = trace("processClickEvent", (event: any) => {
  const synthetic = createSyntheticEvent(event)
  const normalized = normalizeEventData(synthetic)
  return dispatchToHandler(normalized)
})

const createSyntheticEvent = trace("createSyntheticEvent", (event: any) => {
  return {
    ...event,
    timestamp: Date.now(),
    isTrusted: event.isTrusted ?? true,
    _reactName: event._reactName || "onClick",
  }
})

const normalizeEventData = trace("normalizeEventData", (event: any) => {
  return {
    ...event,
    normalized: true,
    coordinates: { x: event.clientX || 0, y: event.clientY || 0 },
    target: event.target?.tagName || "unknown",
  }
})

const dispatchToHandler = trace("dispatchToHandler", (event: any) => {
  return {
    shouldProcess: true,
    event,
    handlerId: `handler_${Math.random().toString(36).slice(2, 8)}`,
  }
})

// =============================================================================
// RECURSIVE OPERATIONS
// =============================================================================

const recursiveTreeTraversal = trace(
  "recursiveTreeTraversal",
  async (node: any, depth = 0): Promise<any> => {
    if (!node.children || node.children.length === 0 || depth > 3) {
      return { ...node, processedDepth: depth }
    }

    const processedChildren = await Promise.all(
      node.children.map((child: any) => recursiveTreeTraversal(child, depth + 1))
    )

    return {
      ...node,
      processedDepth: depth,
      children: processedChildren,
      summary: `Processed ${processedChildren.length} children at depth ${depth}`,
    }
  }
)

// =============================================================================
// DEBOUNCE & THROTTLE WITH ASYNC
// =============================================================================

const createDebouncedSearch = trace(
  "createDebouncedSearch",
  (searchFn: (q: string) => Promise<any>, delay = 300) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let pendingPromise: Promise<any> | null = null

    return trace("debouncedSearch", async (query: string) => {
      if (timeoutId) clearTimeout(timeoutId)

      pendingPromise = new Promise((resolve) => {
        timeoutId = setTimeout(async () => {
          const result = await searchFn(query)
          resolve(result)
        }, delay)
      })

      return pendingPromise
    })
  }
)

const mockSearch = trace("mockSearch", async (query: string) => {
  await new Promise((r) => setTimeout(r, 200))
  return Array.from({ length: 5 }, (_, i) => ({
    id: i,
    title: `Result for "${query}" #${i}`,
    relevance: Math.random(),
  }))
})

// =============================================================================
// COMPLEX DASHBOARD COMPONENT
// =============================================================================

function ComplexDashboard() {
  const [userId, setUserId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Data states
  const [profile, setProfile] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [permissions, setPermissions] = useState<any>(null)
  const [activity, setActivity] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [searchResults, setSearchResults] = useState<any[]>([])

  // Validation
  const validateUserInput = trace("validateUserInput", (input: string) => {
    const errors = validateInput(input, {
      required: true,
      minLength: 3,
      pattern: /^[a-zA-Z0-9_-]+$/,
    })
    return errors.length === 0
  })

  // Parallel data loading
  const handleLoadUserData = useTracedCallback(
    "handleLoadUserData",
    async () => {
      if (!validateUserInput(userId)) {
        setError("Invalid user ID format")
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Parallel independent fetches
        const [profileData, settingsData, permData] = await Promise.all([
          fetchUserProfile(userId),
          fetchUserSettings(userId),
          fetchUserPermissions(userId),
        ])

        setProfile(profileData)
        setSettings(settingsData)
        setPermissions(permData)

        // Sequential dependent fetches
        const activityData = await fetchUserActivity(userId)
        setActivity(activityData)

        // Deep chain analytics
        const analyticsData = await fetchDashboardAnalytics(userId)
        setAnalytics(analyticsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    },
    [userId]
  )

  // Retry with backoff demo
  const handleRetryDemo = useTracedCallback(
    "handleRetryDemo",
    async () => {
      setLoading(true)
      setError(null)

      let attempt = 0
      const result = await retryWithBackoff(async () => {
        attempt++
        return flakyNetworkCall(attempt, 2) // Fails first 2 times
      }, 3)

      console.log("Retry result:", result)
      setLoading(false)
    },
    []
  )

  // Race condition demo
  const handleRaceDemo = useTracedCallback(
    "handleRaceDemo",
    async () => {
      setLoading(true)
      const results = await fetchMultipleSources("search-query")
      console.log("Race results:", results)
      setLoading(false)
    },
    []
  )

  // Recursive tree processing
  const handleTreeDemo = useTracedCallback(
    "handleTreeDemo",
    async () => {
      const tree = {
        id: "root",
        value: 1,
        children: [
          {
            id: "child-1",
            value: 2,
            children: [
              { id: "grandchild-1", value: 3, children: [] },
              { id: "grandchild-2", value: 4, children: [] },
            ],
          },
          {
            id: "child-2",
            value: 5,
            children: [
              {
                id: "grandchild-3",
                value: 6,
                children: [{ id: "great-grandchild-1", value: 7, children: [] }],
              },
            ],
          },
        ],
      }

      const result = await recursiveTreeTraversal(tree)
      console.log("Tree result:", result)
    },
    []
  )

  // Debounced search
  const debouncedSearchRef = useRef(createDebouncedSearch(mockSearch, 300))

  const handleSearch = useTracedCallback(
    "handleSearch",
    async (query: string) => {
      if (!query) {
        setSearchResults([])
        return
      }
      const results = await debouncedSearchRef.current(query)
      setSearchResults(results)
    },
    []
  )

  // Complex event handling
  const handleButtonClick = useTracedCallback(
    "handleButtonClick",
    (e: React.MouseEvent, action: string) => {
      const eventData = processClickEvent({
        clientX: e.clientX,
        clientY: e.clientY,
        target: e.target,
        type: e.type,
      })
      console.log(`Action: ${action}`, eventData)
    },
    []
  )

  // Transform demo
  const handleTransformDemo = useTracedCallback(
    "handleTransformDemo",
    () => {
      const rawData = [
        { id: 1, value: 10, category: "A" },
        { id: 2, value: 5, category: "B" },
        { id: 3, value: 20, category: "A" },
        { id: 4, value: 15, category: "B" },
        { id: 5, value: 8, category: "C" },
      ]

      const transformed = transformData(rawData, [
        { type: "filter", fn: (item: any) => item.value > 6 },
        { type: "map", fn: (item: any) => ({ ...item, doubled: item.value * 2 }) },
        { type: "sort", fn: (a: any, b: any) => b.value - a.value },
      ])

      console.log("Transformed:", transformed)
    },
    []
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("Dashboard unmounting - trace store will persist")
    }
  }, [])

  return (
    <div
      style={{
        padding: 40,
        fontFamily: "system-ui",
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <h1>🔍 Why Run - Complex Demo</h1>
      <p>This demo tests the tracing system with deep chains, parallel operations, and edge cases.</p>

      {error && (
        <div
          style={{
            padding: 16,
            background: "#fee2e2",
            color: "#dc2626",
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}

      {/* User ID Input Section */}
      <section style={{ marginBottom: 30 }} data-testid="user-section">
        <h2>1. User Data Loading (Parallel + Sequential)</h2>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter user ID (e.g., user_123)"
            style={{ padding: "8px 12px", fontSize: 16, flex: 1 }}
          />
          <button
            onClick={handleLoadUserData}
            disabled={loading || !userId}
            style={{ padding: "8px 16px", fontSize: 16 }}
          >
            {loading ? "Loading..." : "Load User Data"}
          </button>
        </div>
        <small>Validates input → Parallel fetch profile/settings/permissions → Sequential activity → Deep analytics chain</small>

        {(profile || settings || permissions || activity || analytics) && (
          <div
            style={{
              marginTop: 20,
              padding: 20,
              background: "#f5f5f5",
              borderRadius: 8,
              display: "grid",
              gap: 10,
            }}
          >
            {profile && (
              <div>
                <strong>Profile:</strong> {JSON.stringify(profile.data)}
              </div>
            )}
            {activity && (
              <div>
                <strong>Activity:</strong> {activity.posts} posts,{" "}
                {activity.comments} comments
              </div>
            )}
            {analytics && (
              <div>
                <strong>Analytics:</strong> {analytics.recommendations?.length}{" "}
                recommendations generated
              </div>
            )}
          </div>
        )}
      </section>

      {/* Retry Demo */}
      <section style={{ marginBottom: 30 }} data-testid="retry-section">
        <h2>2. Retry with Backoff (Error Handling)</h2>
        <button onClick={handleRetryDemo} disabled={loading} style={{ padding: "8px 16px" }}>
          Test Retry Logic (fails 2x, then succeeds)
        </button>
        <p><small>Demonstrates error recovery with exponential backoff</small></p>
      </section>

      {/* Race Condition Demo */}
      <section style={{ marginBottom: 30 }} data-testid="race-section">
        <h2>3. Race Conditions (Parallel with Timeout)</h2>
        <button onClick={handleRaceDemo} disabled={loading} style={{ padding: "8px 16px" }}>
          Test Race Conditions (3 sources, 1 will timeout)
        </button>
        <p><small>3 parallel API calls with different delays, 180ms timeout - some may fail</small></p>
      </section>

      {/* Tree Traversal Demo */}
      <section style={{ marginBottom: 30 }} data-testid="tree-section">
        <h2>4. Recursive Tree Processing</h2>
        <button onClick={handleTreeDemo} disabled={loading} style={{ padding: "8px 16px" }}>
          Process Tree (Recursive Async)
        </button>
        <p><small>Recursive async tree traversal with parallel child processing</small></p>
      </section>

      {/* Event Handling Demo */}
      <section style={{ marginBottom: 30 }} data-testid="event-section">
        <h2>5. Deep Event Processing Chain</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={(e) => handleButtonClick(e, "action-a")}
            style={{ padding: "8px 16px" }}
          >
            Action A (4-level chain)
          </button>
          <button
            onClick={(e) => handleButtonClick(e, "action-b")}
            style={{ padding: "8px 16px" }}
          >
            Action B (4-level chain)
          </button>
        </div>
        <p><small>Click → processClickEvent → createSyntheticEvent → normalizeEventData → dispatchToHandler</small></p>
      </section>

      {/* Transform Demo */}
      <section style={{ marginBottom: 30 }} data-testid="transform-section">
        <h2>6. Data Transformation Pipeline</h2>
        <button onClick={handleTransformDemo} style={{ padding: "8px 16px" }}>
          Run Transform Pipeline (filter → map → sort)
        </button>
        <p><small>Synchronous transform chain with multiple operations</small></p>
      </section>

      {/* Search with Debounce */}
      <section style={{ marginBottom: 30 }} data-testid="search-section">
        <h2>7. Debounced Async Search</h2>
        <input
          type="text"
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Type to search (300ms debounce)..."
          style={{ padding: "8px 12px", fontSize: 16, width: "100%" }}
        />
        {searchResults.length > 0 && (
          <div
            style={{
              marginTop: 10,
              padding: 16,
              background: "#f0fdf4",
              borderRadius: 8,
            }}
          >
            <strong>Results:</strong> {searchResults.length} items
            <ul style={{ margin: "8px 0", paddingLeft: 20 }}>
              {searchResults.map((r) => (
                <li key={r.id}>{r.title} (score: {r.relevance.toFixed(2)})</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Instructions */}
      <section
        style={{
          marginTop: 40,
          padding: 20,
          background: "#e8f4f8",
          borderRadius: 8,
        }}
      >
        <h3>📋 How to Use This Demo</h3>
        <ol>
          <li>Interact with any section above (click buttons, type in inputs)</li>
          <li>Press <kbd>Ctrl+Shift+W</kbd> to open the trace panel</li>
          <li>Look for deep chains (5+ levels) in the analytics section</li>
          <li>Check parallel operations - they should show same parent</li>
          <li>Try the retry demo - watch error recovery in action</li>
          <li>Race conditions show timeout handling</li>
        </ol>

        <h4>🔧 Tool Limitations to Watch For:</h4>
        <ul>
          <li>Recursive calls - check if parent chain is correct</li>
          <li>Promise.race/winner - only the resolved promise is traced</li>
          <li>Debounce - may create orphaned traces</li>
          <li>Parallel same-level calls - verify parent is correct</li>
        </ul>
      </section>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ComplexDashboard />
  </React.StrictMode>
)
