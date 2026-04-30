import { store, TraceNode } from "@why-run/core"

interface PanelOptions {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
  shortcut?: string
  theme?: "dark" | "light"
}

let panelElement: HTMLDivElement | null = null
let isVisible = false
let currentFilter = ""

// Duration color coding (heatmap)
function getDurationColor(duration: number | undefined): string {
  if (!duration) return "#6e6e6e" // Gray for no duration
  if (duration < 1) return "#4ade80" // Green - fast
  if (duration < 10) return "#facc15" // Yellow - medium
  if (duration < 100) return "#fb923c" // Orange - slow
  return "#ef4444" // Red - hot path
}

// Status indicator
function getStatusIndicator(node: TraceNode): string {
  if (node.status === "error") return "🔴"
  if (node.status === "success") return "🟢"
  return "⚪"
}

function createPanelHTML(): string {
  return `
    <div class="why-run-panel-header">
      <span>Why Run</span>
      <div class="why-run-header-actions">
        <button class="why-run-stats-btn" title="Show Statistics">📊</button>
        <button class="why-run-export-btn" title="Export Traces">💾</button>
        <button class="why-run-close">×</button>
      </div>
    </div>
    <div class="why-run-panel-content">
      <div class="why-run-search-row">
        <input type="text" class="why-run-search" placeholder="Filter by name..." />
        <span class="why-run-count"></span>
      </div>
      <div class="why-run-legend">
        <span class="why-run-legend-item"><span class="why-run-dot" style="background:#4ade80"></span>&lt;1ms</span>
        <span class="why-run-legend-item"><span class="why-run-dot" style="background:#facc15"></span>1-10ms</span>
        <span class="why-run-legend-item"><span class="why-run-dot" style="background:#fb923c"></span>10-100ms</span>
        <span class="why-run-legend-item"><span class="why-run-dot" style="background:#ef4444"></span>&gt;100ms</span>
        <span class="why-run-legend-item">🔴 Error</span>
      </div>
      <div class="why-run-list"></div>
      <div class="why-run-detail"></div>
      <div class="why-run-stats" style="display:none"></div>
    </div>
  `
}

function formatDuration(duration: number | undefined): string {
  if (!duration) return ""
  if (duration < 0.01) return "<0.01ms"
  if (duration < 1) return `${duration.toFixed(2)}ms`
  if (duration < 1000) return `${duration.toFixed(1)}ms`
  return `${(duration / 1000).toFixed(2)}s`
}

function formatTimestamp(timestamp: number | undefined): string {
  if (!timestamp) return ""
  // Handle both Date.now() (ms) and performance.now() (ms but may be large)
  const date = new Date(timestamp > 1000000000000 ? timestamp : Date.now())
  return date.toLocaleTimeString()
}

function renderChain(node: TraceNode): string {
  const chain = store.getChain(node.id)
  return chain
    .map(
      (n, i) => `
    <div class="why-run-chain-item" style="padding-left: ${i * 16}px">
      <span class="why-run-arrow" style="opacity: ${i > 0 ? 1 : 0}">←</span>
      <span class="why-run-status">${getStatusIndicator(n)}</span>
      <span class="why-run-name" data-id="${n.id}">${n.name}</span>
      <span class="why-run-duration" style="color: ${getDurationColor(n.duration)}">${formatDuration(n.duration)}</span>
      ${n.error ? `<span class="why-run-error" title="${n.error}">⚠️</span>` : ""}
    </div>
  `
    )
    .join("")
}

function renderList(filter = ""): void {
  const listEl = panelElement?.querySelector(".why-run-list")
  const countEl = panelElement?.querySelector(".why-run-count")
  if (!listEl) return

  const nodes = store
    .getAll()
    .filter((n) => n.name.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 50)

  if (countEl) {
    countEl.textContent = `${nodes.length}/${store.getAll().length}`
  }

  // Group parallel calls (same parent + close timestamp)
  const grouped = groupParallelCalls(nodes)

  listEl.innerHTML = grouped
    .map((item) => {
      if (item.type === "batch") {
        if (!item.nodes) return ""
        return `
          <div class="why-run-batch-header" data-parent="${item.parentId}">
            <span class="why-run-batch-toggle">▼</span>
            <span class="why-run-batch-label">${item.count} parallel calls</span>
            <span class="why-run-batch-time">${formatTimestamp(item.timestamp)}</span>
          </div>
          <div class="why-run-batch-items">
            ${item.nodes
              .map(
                (node) => `
              <div class="why-run-list-item why-run-list-item-batched" data-id="${node.id}">
                <span class="why-run-status">${getStatusIndicator(node)}</span>
                <span class="why-run-list-name">${node.name}</span>
                <span class="why-run-list-duration" style="color: ${getDurationColor(node.duration)}">${formatDuration(node.duration)}</span>
                ${node.error ? `<span class="why-run-error-icon" title="${node.error}">⚠️</span>` : ""}
              </div>
            `
              )
              .join("")}
          </div>
        `
      }
      if (!item.node) return ""
      return `
        <div class="why-run-list-item" data-id="${item.node.id}">
          <span class="why-run-status">${getStatusIndicator(item.node)}</span>
          <span class="why-run-list-name">${item.node.name}</span>
          <span class="why-run-list-duration" style="color: ${getDurationColor(item.node.duration)}">${formatDuration(item.node.duration)}</span>
          <span class="why-run-list-time">${formatTimestamp(item.node.timestamp)}</span>
          ${item.node.error ? `<span class="why-run-error-icon" title="${item.node.error}">⚠️</span>` : ""}
        </div>
      `
    })
    .join("")

  // Add click handlers
  listEl.querySelectorAll(".why-run-list-item").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-id")
      if (id) showDetail(id)
    })
  })

  // Add batch toggle handlers
  listEl.querySelectorAll(".why-run-batch-header").forEach((el) => {
    el.addEventListener("click", () => {
      const headerEl = el as HTMLElement
      const items = headerEl.nextElementSibling as HTMLElement
      const toggle = headerEl.querySelector(".why-run-batch-toggle")
      if (items && toggle) {
        const isHidden = items.style.display === "none"
        items.style.display = isHidden ? "block" : "none"
        toggle.textContent = isHidden ? "▼" : "▶"
      }
    })
  })
}

interface GroupedItem {
  type: "single" | "batch"
  node?: TraceNode
  nodes?: TraceNode[]
  parentId?: string
  timestamp?: number
  count?: number
}

function groupParallelCalls(nodes: TraceNode[]): GroupedItem[] {
  const result: GroupedItem[] = []
  const processed = new Set<string>()
  const BATCH_WINDOW_MS = 5 // Consider calls within 5ms as parallel

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (processed.has(node.id)) continue

    // Find other nodes with same parent and close timestamp
    const batch = nodes.filter(
      (n) =>
        n.id !== node.id &&
        n.parentId === node.parentId &&
        Math.abs(n.timestamp - node.timestamp) < BATCH_WINDOW_MS
    )

    if (batch.length > 0) {
      // This is a batch
      batch.push(node)
      batch.forEach((n) => processed.add(n.id))
      result.push({
        type: "batch",
        nodes: batch.sort((a, b) => (b.duration || 0) - (a.duration || 0)),
        parentId: node.parentId || "root",
        timestamp: node.timestamp,
        count: batch.length,
      })
    } else {
      result.push({ type: "single", node })
    }
  }

  return result
}

function showDetail(nodeId: string): void {
  const detailEl = panelElement?.querySelector(".why-run-detail") as HTMLElement | null
  const statsEl = panelElement?.querySelector(".why-run-stats") as HTMLElement | null
  if (!detailEl) return

  // Hide stats, show detail
  if (statsEl) statsEl.style.display = "none"
  detailEl.style.display = "block"

  const node = store.get(nodeId)
  if (!node) return

  detailEl.innerHTML = `
    <h3>Why Chain</h3>
    ${renderChain(node)}
    ${node.error ? `<div class="why-run-error-detail"><strong>Error:</strong> ${node.error}</div>` : ""}
  `
}

function showStats(): void {
  const detailEl = panelElement?.querySelector(".why-run-detail") as HTMLElement | null
  const statsEl = panelElement?.querySelector(".why-run-stats") as HTMLElement | null
  if (!statsEl) return

  // Hide detail, show stats
  if (detailEl) detailEl.style.display = "none"
  statsEl.style.display = "block"

  const s = store.getStats()

  statsEl.innerHTML = `
    <h3>Store Statistics</h3>
    <div class="why-run-stats-grid">
      <div class="why-run-stat">
        <span class="why-run-stat-value">${s.size}</span>
        <span class="why-run-stat-label">Nodes Stored</span>
      </div>
      <div class="why-run-stat">
        <span class="why-run-stat-value">${s.maxSize}</span>
        <span class="why-run-stat-label">Max Size</span>
      </div>
      <div class="why-run-stat">
        <span class="why-run-stat-value">${s.utilization}%</span>
        <span class="why-run-stat-label">Utilization</span>
      </div>
      <div class="why-run-stat">
        <span class="why-run-stat-value">${s.totalAdded}</span>
        <span class="why-run-stat-label">Total Added</span>
      </div>
      <div class="why-run-stat">
        <span class="why-run-stat-value" style="color:#4ade80">${s.successCount}</span>
        <span class="why-run-stat-label">Success</span>
      </div>
      <div class="why-run-stat">
        <span class="why-run-stat-value" style="color:#ef4444">${s.errorCount}</span>
        <span class="why-run-stat-label">Errors</span>
      </div>
      <div class="why-run-stat">
        <span class="why-run-stat-value">${s.pendingCount}</span>
        <span class="why-run-stat-label">Pending</span>
      </div>
      <div class="why-run-stat">
        <span class="why-run-stat-value">${s.evictionCount}</span>
        <span class="why-run-stat-label">Evicted</span>
      </div>
    </div>
    <div class="why-run-stats-actions">
      <button class="why-run-export-json">Export JSON</button>
      <button class="why-run-clear">Clear All</button>
    </div>
  `

  // Add export handler
  statsEl.querySelector(".why-run-export-json")?.addEventListener("click", () => {
    const data = store.export()
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `why-run-traces-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  })

  // Add clear handler
  statsEl.querySelector(".why-run-clear")?.addEventListener("click", () => {
    store.nodes.clear()
    renderList(currentFilter)
    showStats() // Refresh
  })
}

function injectStyles(): void {
  if (document.getElementById("why-run-styles")) return

  const styles = document.createElement("style")
  styles.id = "why-run-styles"
  styles.textContent = `
    .why-run-panel {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
      font-size: 13px;
      color: #d4d4d4;
    }
    .why-run-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #333;
      background: #252526;
      border-radius: 8px 8px 0 0;
    }
    .why-run-header-actions {
      display: flex;
      gap: 8px;
    }
    .why-run-panel-header button {
      background: #333;
      border: none;
      color: #d4d4d4;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 14px;
      line-height: 1;
    }
    .why-run-panel-header button:hover {
      background: #444;
    }
    .why-run-close {
      font-size: 18px !important;
      padding: 2px 6px !important;
    }
    .why-run-panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .why-run-search-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .why-run-search {
      flex: 1;
      padding: 6px 10px;
      border: 1px solid #333;
      border-radius: 4px;
      background: #252526;
      color: #d4d4d4;
      font-size: 13px;
    }
    .why-run-count {
      color: #6e6e6e;
      font-size: 11px;
    }
    .why-run-legend {
      display: flex;
      gap: 12px;
      font-size: 11px;
      color: #6e6e6e;
      padding: 4px 0;
      border-bottom: 1px solid #333;
    }
    .why-run-legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .why-run-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }
    .why-run-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .why-run-list-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .why-run-list-item:hover {
      background: #2a2d2e;
    }
    .why-run-list-item-batched {
      padding-left: 24px;
    }
    .why-run-status {
      font-size: 10px;
    }
    .why-run-list-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .why-run-list-duration {
      font-size: 11px;
      font-variant-numeric: tabular-nums;
    }
    .why-run-list-time {
      font-size: 11px;
      color: #6e6e6e;
    }
    .why-run-batch-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      background: #252526;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      color: #9cdcfe;
    }
    .why-run-batch-header:hover {
      background: #2a2d2e;
    }
    .why-run-batch-toggle {
      font-size: 10px;
    }
    .why-run-batch-label {
      flex: 1;
    }
    .why-run-batch-time {
      font-size: 11px;
      color: #6e6e6e;
    }
    .why-run-batch-items {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .why-run-detail {
      padding: 12px;
      background: #252526;
      border-radius: 4px;
      min-height: 100px;
    }
    .why-run-detail h3 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #9cdcfe;
    }
    .why-run-chain-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
      font-size: 12px;
    }
    .why-run-arrow {
      color: #6e6e6e;
    }
    .why-run-duration {
      font-size: 11px;
      font-variant-numeric: tabular-nums;
      margin-left: auto;
    }
    .why-run-error {
      color: #ef4444;
    }
    .why-run-error-icon {
      font-size: 11px;
    }
    .why-run-error-detail {
      margin-top: 12px;
      padding: 8px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid #ef4444;
      border-radius: 4px;
      color: #ef4444;
      font-size: 12px;
    }
    .why-run-stats {
      padding: 12px;
      background: #252526;
      border-radius: 4px;
    }
    .why-run-stats h3 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #9cdcfe;
    }
    .why-run-stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    .why-run-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px;
      background: #1e1e1e;
      border-radius: 4px;
    }
    .why-run-stat-value {
      font-size: 18px;
      font-weight: bold;
      color: #d4d4d4;
    }
    .why-run-stat-label {
      font-size: 10px;
      color: #6e6e6e;
      text-transform: uppercase;
    }
    .why-run-stats-actions {
      display: flex;
      gap: 8px;
    }
    .why-run-stats-actions button {
      flex: 1;
      padding: 8px;
      background: #0e639c;
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
      font-size: 12px;
    }
    .why-run-stats-actions button:hover {
      background: #1177bb;
    }
    .why-run-stats-actions .why-run-clear {
      background: #ef4444;
    }
    .why-run-stats-actions .why-run-clear:hover {
      background: #f87171;
    }
  `
  document.head.appendChild(styles)
}

export function openPanel(options: PanelOptions = {}): void {
  // Inject styles on first open
  injectStyles()

  if (panelElement) {
    panelElement.style.display = "block"
    isVisible = true
    renderList(currentFilter)
    return
  }

  const position = options.position || "bottom-right"
  const positionStyles: Record<string, string> = {
    "bottom-right": "bottom: 20px; right: 20px;",
    "bottom-left": "bottom: 20px; left: 20px;",
    "top-right": "top: 20px; right: 20px;",
    "top-left": "top: 20px; left: 20px;",
  }

  panelElement = document.createElement("div")
  panelElement.className = "why-run-panel"
  panelElement.innerHTML = createPanelHTML()
  panelElement.style.cssText = `
    position: fixed;
    ${positionStyles[position]}
    width: 420px;
    height: 520px;
    background: #1e1e1e;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    display: flex;
    flex-direction: column;
    z-index: 999999;
  `

  document.body.appendChild(panelElement)
  isVisible = true

  // Event handlers
  panelElement.querySelector(".why-run-close")?.addEventListener("click", closePanel)

  panelElement.querySelector(".why-run-stats-btn")?.addEventListener("click", showStats)

  panelElement.querySelector(".why-run-export-btn")?.addEventListener("click", () => {
    const data = store.export()
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `why-run-traces-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  })

  const searchEl = panelElement.querySelector(".why-run-search") as HTMLInputElement
  searchEl?.addEventListener("input", (e) => {
    currentFilter = (e.target as HTMLInputElement).value
    renderList(currentFilter)
  })

  renderList()
}

export function closePanel(): void {
  if (panelElement) {
    panelElement.style.display = "none"
    isVisible = false
  }
}

export function togglePanel(options?: PanelOptions): void {
  if (isVisible) {
    closePanel()
  } else {
    openPanel(options)
  }
}

export function initPanel(options: PanelOptions = {}): void {
  const shortcut = options.shortcut || "ctrl+shift+w"

  document.addEventListener("keydown", (e) => {
    const keys = shortcut.toLowerCase().split("+")
    const ctrl = keys.includes("ctrl")
    const shift = keys.includes("shift")
    const key = keys.find((k) => !["ctrl", "shift", "alt", "meta"].includes(k))

    if (
      e.ctrlKey === ctrl &&
      e.shiftKey === shift &&
      e.key.toLowerCase() === key
    ) {
      e.preventDefault()
      togglePanel(options)
    }
  })

  // Expose to window for debugging
  ;(window as any).whyRun = {
    open: () => openPanel(options),
    close: closePanel,
    toggle: () => togglePanel(options),
    store,
    stats: () => store.getStats(),
  }
}
