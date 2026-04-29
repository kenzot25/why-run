import { store, TraceNode } from "@why-run/core"

interface PanelOptions {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
  shortcut?: string
}

let panelElement: HTMLDivElement | null = null
let isVisible = false

function createPanelHTML(): string {
  return `
    <div class="why-run-panel-header">
      <span>Why Run</span>
      <button class="why-run-close">×</button>
    </div>
    <div class="why-run-panel-content">
      <input type="text" class="why-run-search" placeholder="Filter by name..." />
      <div class="why-run-list"></div>
      <div class="why-run-detail"></div>
    </div>
  `
}

function renderChain(node: TraceNode): string {
  const chain = store.getChain(node.id)
  return chain
    .map(
      (n, i) => `
    <div class="why-run-chain-item" style="padding-left: ${i * 16}px">
      <span class="why-run-arrow" style="opacity: ${i > 0 ? 1 : 0}">←</span>
      <span class="why-run-name" data-id="${n.id}">${n.name}</span>
      <span class="why-run-duration" style="opacity: ${n.duration ? 1 : 0}">${n.duration}ms</span>
    </div>
  `
    )
    .join("")
}

function renderList(filter = ""): void {
  const listEl = panelElement?.querySelector(".why-run-list")
  if (!listEl) return

  const nodes = store
    .getAll()
    .filter((n) => n.name.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 50)

  listEl.innerHTML = nodes
    .map(
      (node) => `
      <div class="why-run-list-item" data-id="${node.id}">
        <span class="why-run-list-name">${node.name}</span>
        <span class="why-run-list-time">${new Date(node.timestamp).toLocaleTimeString()}</span>
      </div>
    `
    )
    .join("")

  listEl.querySelectorAll(".why-run-list-item").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-id")
      if (id) showDetail(id)
    })
  })
}

function showDetail(nodeId: string): void {
  const detailEl = panelElement?.querySelector(".why-run-detail")
  if (!detailEl) return

  const node = store.get(nodeId)
  if (!node) return

  detailEl.innerHTML = `
    <h3>Why Chain</h3>
    ${renderChain(node)}
  `
}

export function openPanel(options: PanelOptions = {}): void {
  if (panelElement) {
    panelElement.style.display = "block"
    isVisible = true
    renderList()
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
    width: 400px;
    height: 500px;
    background: #1e1e1e;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    display: flex;
    flex-direction: column;
    font-family: monospace;
    font-size: 13px;
    color: #d4d4d4;
    z-index: 999999;
  `

  document.body.appendChild(panelElement)
  isVisible = true

  panelElement.querySelector(".why-run-close")?.addEventListener("click", closePanel)

  const searchEl = panelElement.querySelector(".why-run-search") as HTMLInputElement
  searchEl?.addEventListener("input", (e) => {
    renderList((e.target as HTMLInputElement).value)
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
  }
}
