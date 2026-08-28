/**
 * Cabinet Builder / Installer View
 * 
 * Physical hardware perspective: shows meters grouped by MeshEMS boards,
 * phase assignments, serial numbers, wiring topology.
 * 
 * Helps technicians understand:
 * - Which meters connect to which board
 * - Phase distribution (A/B/C balance)
 * - Hardware addressing and serial numbers
 * - Physical wiring paths from transformer through boards to meters
 */

export function createCabinetView(container, sim) {
  const view = document.createElement("div");
  view.className = "cabinet-view-panel";
  view.innerHTML = `
    <div class="cabinet-header">
      <h3>Cabinet Builder View</h3>
      <p class="cabinet-subtitle">Physical meter topology · boards · phases · wiring</p>
    </div>
    <div class="cabinet-controls">
      <select id="cabinet-cluster-filter">
        <option value="all">All clusters</option>
      </select>
      <select id="cabinet-feeder-filter">
        <option value="all">All feeders</option>
      </select>
      <button id="cabinet-phase-highlight" class="toggle-btn">Highlight phases</button>
      <button id="cabinet-board-view" class="toggle-btn active">Board groups</button>
    </div>
    <div class="cabinet-stats">
      <div class="stat-mini">
        <span class="stat-label">Total meters</span>
        <span class="stat-value" id="cabinet-total-meters">-</span>
      </div>
      <div class="stat-mini">
        <span class="stat-label">MeshEMS boards</span>
        <span class="stat-value" id="cabinet-total-boards">-</span>
      </div>
      <div class="stat-mini">
        <span class="stat-label">Phase A / B / C</span>
        <span class="stat-value" id="cabinet-phase-balance">-</span>
      </div>
    </div>
    <div id="cabinet-content" class="cabinet-content"></div>
  `;
  
  container.appendChild(view);
  
  let currentCluster = "all";
  let currentFeeder = "all";
  let phaseHighlight = false;
  let boardView = true;
  
  const clusterFilter = view.querySelector("#cabinet-cluster-filter");
  const feederFilter = view.querySelector("#cabinet-feeder-filter");
  const phaseBtn = view.querySelector("#cabinet-phase-highlight");
  const boardBtn = view.querySelector("#cabinet-board-view");
  const content = view.querySelector("#cabinet-content");
  
  // Populate filters
  const clusters = [...new Set(sim.houses.map(h => h.cluster))];
  clusters.forEach(cl => {
    const opt = document.createElement("option");
    opt.value = cl;
    opt.textContent = cl;
    clusterFilter.appendChild(opt);
  });
  
  const feeders = [...new Set(sim.houses.map(h => h.feederId))];
  feeders.forEach(fid => {
    const opt = document.createElement("option");
    opt.value = fid;
    opt.textContent = fid;
    feederFilter.appendChild(opt);
  });
  
  clusterFilter.addEventListener("change", () => {
    currentCluster = clusterFilter.value;
    render();
  });
  
  feederFilter.addEventListener("change", () => {
    currentFeeder = feederFilter.value;
    render();
  });
  
  phaseBtn.addEventListener("click", () => {
    phaseHighlight = !phaseHighlight;
    phaseBtn.classList.toggle("active", phaseHighlight);
    render();
  });
  
  boardBtn.addEventListener("click", () => {
    boardView = !boardView;
    boardBtn.classList.toggle("active", boardView);
    render();
  });
  
  function render() {
    const filtered = sim.houses.filter(h => {
      if (currentCluster !== "all" && h.cluster !== currentCluster) return false;
      if (currentFeeder !== "all" && h.feederId !== currentFeeder) return false;
      return true;
    });
    
    // Stats
    const phaseCount = { A: 0, B: 0, C: 0 };
    filtered.forEach(h => {
      const p = h.phase || "A";
      phaseCount[p] = (phaseCount[p] || 0) + 1;
    });
    
    const boards = [...new Set(filtered.map(h => h.boardId || "unknown"))];
    
    view.querySelector("#cabinet-total-meters").textContent = filtered.length;
    view.querySelector("#cabinet-total-boards").textContent = boards.length;
    view.querySelector("#cabinet-phase-balance").textContent = 
      `${phaseCount.A} / ${phaseCount.B} / ${phaseCount.C}`;
    
    if (boardView) {
      renderBoardGroups(filtered);
    } else {
      renderMeterList(filtered);
    }
  }
  
  function renderBoardGroups(houses) {
    const byBoard = {};
    houses.forEach(h => {
      const bid = h.boardId || "unknown";
      if (!byBoard[bid]) byBoard[bid] = [];
      byBoard[bid].push(h);
    });
    
    const boards = Object.keys(byBoard).sort();
    
    let html = '<div class="board-groups">';
    boards.forEach(bid => {
      const meters = byBoard[bid];
      const phaseCount = { A: 0, B: 0, C: 0 };
      meters.forEach(m => {
        const p = m.phase || "A";
        phaseCount[p] = (phaseCount[p] || 0) + 1;
      });
      
      html += `
        <div class="board-group">
          <div class="board-group-header">
            <h4>${bid}</h4>
            <span class="board-meta">${meters.length} meters · Phases: A=${phaseCount.A} B=${phaseCount.B} C=${phaseCount.C}</span>
          </div>
          <div class="board-meters">
      `;
      
      meters.forEach(m => {
        const phaseColor = { A: "#e6c84a", B: "#3d8bfd", C: "#9b4dca" }[m.phase || "A"];
        const style = phaseHighlight ? `border-left: 4px solid ${phaseColor}` : "";
        
        html += `
          <div class="meter-card" style="${style}" data-house-id="${m.id}">
            <div class="meter-card-header">
              <span class="meter-name">${m.name}</span>
              <span class="meter-serial">${m.serial}</span>
            </div>
            <div class="meter-card-body">
              <span class="meter-field"><b>Phase:</b> ${m.phase || "A"}</span>
              <span class="meter-field"><b>Limit:</b> ${m.loadLimitW || 400} W</span>
              <span class="meter-field"><b>Cluster:</b> ${m.cluster}</span>
              <span class="meter-field"><b>Feeder:</b> ${m.feederId}</span>
            </div>
          </div>
        `;
      });
      
      html += `
          </div>
        </div>
      `;
    });
    html += '</div>';
    
    content.innerHTML = html;
    
    // Add click handlers
    content.querySelectorAll(".meter-card").forEach(card => {
      card.addEventListener("click", () => {
        const hid = card.dataset.houseId;
        // Emit event for 3D view to highlight this meter
        const event = new CustomEvent("cabinet-meter-select", { detail: { houseId: hid } });
        document.dispatchEvent(event);
      });
    });
  }
  
  function renderMeterList(houses) {
    let html = '<div class="meter-list"><table><thead><tr>';
    html += '<th>Serial</th><th>Name</th><th>Phase</th><th>Board</th><th>Limit (W)</th><th>Cluster</th><th>Feeder</th>';
    html += '</tr></thead><tbody>';
    
    houses.forEach(h => {
      const phaseColor = { A: "#e6c84a", B: "#3d8bfd", C: "#9b4dca" }[h.phase || "A"];
      const style = phaseHighlight ? `color: ${phaseColor}; font-weight: 600;` : "";
      
      html += `
        <tr data-house-id="${h.id}">
          <td><code>${h.serial}</code></td>
          <td>${h.name}</td>
          <td style="${style}">${h.phase || "A"}</td>
          <td>${h.boardId || "—"}</td>
          <td>${h.loadLimitW || 400}</td>
          <td>${h.cluster}</td>
          <td>${h.feederId}</td>
        </tr>
      `;
    });
    
    html += '</tbody></table></div>';
    content.innerHTML = html;
    
    content.querySelectorAll("tr[data-house-id]").forEach(row => {
      row.addEventListener("click", () => {
        const hid = row.dataset.houseId;
        const event = new CustomEvent("cabinet-meter-select", { detail: { houseId: hid } });
        document.dispatchEvent(event);
      });
    });
  }
  
  render();
  
  return {
    update: render,
    destroy: () => view.remove()
  };
}
