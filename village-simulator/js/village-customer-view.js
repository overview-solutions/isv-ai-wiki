/**
 * Customer Meter View / Interface
 * 
 * Individual household perspective: shows what the end customer sees/experiences
 * - Current credit balance and consumption
 * - Payment history and when next payment needed
 * - How to interpret meter readings
 * - Disconnection/reconnection events
 * - Energy usage breakdown by appliance type
 * 
 * Educational tool for customers to understand prepaid metering.
 */

export function createCustomerView(container, sim, currentMin) {
  const view = document.createElement("div");
  view.className = "customer-view-panel";
  view.innerHTML = `
    <div class="customer-header">
      <h3>Customer Meter Interface</h3>
      <p class="customer-subtitle">What the household sees · prepaid meter journey</p>
    </div>
    <div class="customer-select">
      <label>Select household:</label>
      <select id="customer-house-select">
        <option value="">Choose a customer...</option>
      </select>
    </div>
    <div id="customer-detail" class="customer-detail" style="display: none;">
      <div class="customer-identity">
        <h4 id="customer-name">-</h4>
        <span id="customer-serial" class="serial-badge">-</span>
        <span id="customer-status" class="status-badge">-</span>
      </div>
      
      <div class="customer-credit-section">
        <div class="credit-balance-display">
          <div class="balance-label">Current Credit</div>
          <div class="balance-value" id="customer-balance">-</div>
          <div class="balance-warning" id="customer-balance-warning" style="display: none;">
            ⚠️ Low balance - add credit soon
          </div>
        </div>
        <div class="credit-info">
          <div class="info-row">
            <span>Tariff rate:</span>
            <strong id="customer-tariff">-</strong>
          </div>
          <div class="info-row">
            <span>Current usage:</span>
            <strong id="customer-power">-</strong>
          </div>
          <div class="info-row">
            <span>Est. remaining:</span>
            <strong id="customer-runtime">-</strong>
          </div>
        </div>
      </div>
      
      <div class="customer-usage-section">
        <h5>Energy Usage (This Slot)</h5>
        <div id="customer-usage-breakdown" class="usage-breakdown"></div>
        <div class="usage-meter">
          <div class="usage-meter-label">
            <span>Load capacity</span>
            <span id="customer-capacity-pct">-</span>
          </div>
          <div class="usage-meter-bar">
            <div id="customer-capacity-fill" class="usage-meter-fill"></div>
          </div>
          <div class="usage-meter-limit">
            <span>Limit: <strong id="customer-limit">-</strong></span>
          </div>
        </div>
      </div>
      
      <div class="customer-payment-section">
        <h5>Payment Options</h5>
        <div class="payment-methods">
          <div class="payment-method">
            <div class="method-icon">🏪</div>
            <div class="method-info">
              <strong>Kiosk / Agent</strong>
              <span>Visit vendor with cash</span>
            </div>
          </div>
          <div class="payment-method">
            <div class="method-icon">📱</div>
            <div class="method-info">
              <strong>Mobile Money</strong>
              <span>Send payment via phone</span>
            </div>
          </div>
          <div class="payment-method">
            <div class="method-icon">⌨️</div>
            <div class="method-info">
              <strong>Keypad (CIU)</strong>
              <span>Enter token at meter</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="customer-history-section">
        <h5>Recent Activity</h5>
        <div id="customer-timeline" class="customer-timeline"></div>
      </div>
      
      <div class="customer-help-section">
        <h5>How to Read Your Meter</h5>
        <div class="help-content">
          <div class="help-item">
            <strong>🟢 Green light / relay on:</strong>
            <span>You have credit and power is flowing</span>
          </div>
          <div class="help-item">
            <strong>🔴 Red light / relay off:</strong>
            <span>Credit depleted or overload - add payment or reduce load</span>
          </div>
          <div class="help-item">
            <strong>⚡ Power reading:</strong>
            <span>Shows current watts (W) being consumed</span>
          </div>
          <div class="help-item">
            <strong>💰 Balance display:</strong>
            <span>Remaining credit in local currency units</span>
          </div>
          <div class="help-item">
            <strong>⚠️ Warnings:</strong>
            <span>Low balance alert when below threshold (${sim.summary?.tariff || 200}/kWh tariff)</span>
          </div>
        </div>
      </div>
    </div>
  `;
  
  container.appendChild(view);
  
  const select = view.querySelector("#customer-house-select");
  const detail = view.querySelector("#customer-detail");
  let selectedHouse = null;
  
  // Populate house select
  sim.houses.forEach(h => {
    const opt = document.createElement("option");
    opt.value = h.id;
    opt.textContent = `${h.name} (${h.serial}) - ${h.cluster}`;
    select.appendChild(opt);
  });
  
  select.addEventListener("change", () => {
    selectedHouse = sim.houses.find(h => h.id === select.value);
    if (selectedHouse) {
      detail.style.display = "block";
      update(currentMin);
      
      // Emit event for 3D view
      const event = new CustomEvent("customer-meter-select", { detail: { houseId: selectedHouse.id } });
      document.dispatchEvent(event);
    } else {
      detail.style.display = "none";
    }
  });
  
  function update(min) {
    if (!selectedHouse) return;
    
    // Find current reading for this house at this minute
    const reading = sim.readings.find(r => r.houseId === selectedHouse.id && r.min === min);
    if (!reading) return;
    
    // Get events for this house
    const houseEvents = sim.events.filter(e => 
      e.houseId === selectedHouse.id && e.min <= min
    ).sort((a, b) => b.min - a.min);
    
    // Update identity
    view.querySelector("#customer-name").textContent = selectedHouse.name;
    view.querySelector("#customer-serial").textContent = selectedHouse.serial;
    
    const statusBadge = view.querySelector("#customer-status");
    if (reading.feederOut) {
      statusBadge.textContent = "⚠️ Outage";
      statusBadge.className = "status-badge status-outage";
    } else if (reading.on) {
      statusBadge.textContent = "🟢 Connected";
      statusBadge.className = "status-badge status-on";
    } else {
      statusBadge.textContent = "🔴 Disconnected";
      statusBadge.className = "status-badge status-off";
    }
    
    // Update credit
    const balance = Math.round(reading.wallet);
    view.querySelector("#customer-balance").textContent = `${balance} units`;
    
    const warning = view.querySelector("#customer-balance-warning");
    const lowThreshold = 50; // From sim LOW_BALANCE
    if (balance > 0 && balance <= lowThreshold) {
      warning.style.display = "block";
    } else {
      warning.style.display = "none";
    }
    
    // Update tariff and usage
    const tariff = sim.summary?.tariff || 200;
    view.querySelector("#customer-tariff").textContent = `${tariff} units/kWh`;
    view.querySelector("#customer-power").textContent = `${Math.round(reading.powerW)} W`;
    
    // Estimate runtime
    let runtime = "-";
    if (reading.powerW > 0 && balance > 0) {
      const hours = (balance / tariff) / (reading.powerW / 1000);
      if (hours < 1) {
        runtime = `${Math.round(hours * 60)} min`;
      } else if (hours < 24) {
        runtime = `${hours.toFixed(1)} hours`;
      } else {
        runtime = `${(hours / 24).toFixed(1)} days`;
      }
    }
    view.querySelector("#customer-runtime").textContent = runtime;
    
    // Usage breakdown
    const mix = reading.mix || {};
    let breakdownHtml = "";
    if (Object.keys(mix).length > 0) {
      const total = Object.values(mix).reduce((s, w) => s + w, 0);
      Object.entries(mix).forEach(([type, watts]) => {
        const pct = total > 0 ? Math.round((watts / total) * 100) : 0;
        const color = getLoadColor(type);
        breakdownHtml += `
          <div class="usage-item">
            <div class="usage-icon" style="background: ${color};"></div>
            <span class="usage-label">${type}</span>
            <span class="usage-value">${Math.round(watts)} W (${pct}%)</span>
          </div>
        `;
      });
    } else {
      breakdownHtml = '<div class="usage-empty">No active loads</div>';
    }
    view.querySelector("#customer-usage-breakdown").innerHTML = breakdownHtml;
    
    // Capacity meter
    const capacity = reading.capacity || 0;
    const capacityPct = Math.round(capacity * 100);
    view.querySelector("#customer-capacity-pct").textContent = `${capacityPct}%`;
    
    const fill = view.querySelector("#customer-capacity-fill");
    fill.style.width = `${Math.min(100, capacityPct)}%`;
    
    if (capacity >= 1.0) {
      fill.style.background = "#b42318"; // Red - at limit
    } else if (capacity >= 0.8) {
      fill.style.background = "#c9a227"; // Amber - warning
    } else {
      fill.style.background = "#3b6d11"; // Green - safe
    }
    
    view.querySelector("#customer-limit").textContent = `${reading.loadLimitW || 400} W`;
    
    // Timeline
    let timelineHtml = "";
    const recentEvents = houseEvents.slice(0, 10);
    if (recentEvents.length > 0) {
      recentEvents.forEach(e => {
        const icon = getEventIcon(e.kind);
        const time = formatTime(e.min);
        const msg = getEventMessage(e);
        timelineHtml += `
          <div class="timeline-event event-${e.kind}">
            <div class="timeline-icon">${icon}</div>
            <div class="timeline-content">
              <div class="timeline-time">${time}</div>
              <div class="timeline-msg">${msg}</div>
            </div>
          </div>
        `;
      });
    } else {
      timelineHtml = '<div class="timeline-empty">No recent activity</div>';
    }
    view.querySelector("#customer-timeline").innerHTML = timelineHtml;
  }
  
  function getLoadColor(type) {
    const colors = {
      lighting: "#e6c84a",
      heating: "#c0392b",
      fridge: "#0f9b8e",
      ict: "#3d8bfd",
      laundry: "#5b8def",
      cooking: "#ba7517",
      pump: "#2b6cb0",
      ag: "#6a994e",
      tools: "#9b4dca",
      productive: "#9b4dca",
      idle: "#3a3a38"
    };
    return colors[type] || "#8a8a82";
  }
  
  function getEventIcon(kind) {
    const icons = {
      pay: "💰",
      credit: "💳",
      disconnect: "🔴",
      reconnect: "🟢",
      overload: "⚡",
      cap_warn: "⚠️",
      pf_warn: "⚡",
      sms: "📱",
      outage: "🔌",
      lastbreath: "📡",
      off: "🔴"
    };
    return icons[kind] || "•";
  }
  
  function getEventMessage(e) {
    switch (e.kind) {
      case "pay":
        return `Added ${e.amount} units via ${e.via || "vendor"}`;
      case "credit":
        return `Balance updated: ${Math.round(e.wallet)} units`;
      case "disconnect":
        return "Meter disconnected - credit depleted";
      case "reconnect":
        return "Meter reconnected - power restored";
      case "overload":
        return "Disconnected due to overload - reduce appliances";
      case "cap_warn":
        const pct = e.capacity ? Math.round(e.capacity * 100) : 0;
        return `Warning: ${pct}% of capacity`;
      case "pf_warn":
        return `Low power factor detected (${e.pf?.toFixed(2) || "-"})`;
      case "sms":
        return "Low balance SMS sent";
      case "outage":
        return "Grid outage in your area";
      case "lastbreath":
        return "Outage alert sent to operator";
      case "off":
        return "Started day with no credit";
      default:
        return e.note || e.kind;
    }
  }
  
  function formatTime(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  
  return {
    update,
    destroy: () => view.remove(),
    selectHouse: (houseId) => {
      select.value = houseId;
      select.dispatchEvent(new Event("change"));
    }
  };
}
