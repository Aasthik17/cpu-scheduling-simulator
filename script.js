let processes = [];
let pidCounter = 1;
let chart = null;

// ---------- UI FUNCTIONS ----------

function addProcess() {
  let arrival = prompt("Enter Arrival Time:");
  let burst = prompt("Enter Burst Time:");

  if (
    arrival === null || burst === null ||
    arrival.trim() === "" || burst.trim() === "" ||
    isNaN(arrival) || isNaN(burst) ||
    Number(arrival) < 0 || Number(burst) <= 0
  ) {
    alert("❌ Invalid input. Please enter valid numbers.");
    return;
  }

  processes.push({
    pid: "P" + pidCounter++,
    arrival: Number(arrival),
    burst: Number(burst),
    remaining: Number(burst),
    completion: 0
  });

  renderProcessTable();
}

function renderProcessTable() {
  const tbody = document.querySelector("#processTable tbody");
  tbody.innerHTML = "";

  processes.forEach(p => {
    const row = `
      <tr>
        <td>${p.pid}</td>
        <td>${p.arrival}</td>
        <td>${p.burst}</td>
      </tr>`;
    tbody.innerHTML += row;
  });
}

function resetAll() {
  processes = [];
  pidCounter = 1;
  document.getElementById("results").innerHTML = "";
  document.querySelector("#processTable tbody").innerHTML = "";
  if (chart) chart.destroy();
}

// ---------- SCHEDULING ALGORITHMS ----------

function fcfs(procList) {
  let time = 0;
  let gantt = [];

  procList.sort((a, b) => a.arrival - b.arrival);

  procList.forEach(p => {
    if (time < p.arrival) time = p.arrival;
    let start = time;
    time += p.burst;
    p.completion = time;
    gantt.push({ pid: p.pid, start, end: time });
  });

  return gantt;
}

function sjf(procList) {
  let time = 0;
  let gantt = [];

  procList.sort((a, b) => a.burst - b.burst);

  procList.forEach(p => {
    let start = time;
    time += p.burst;
    p.completion = time;
    gantt.push({ pid: p.pid, start, end: time });
  });

  return gantt;
}

function roundRobin(procList, quantum) {
  let time = 0;
  let gantt = [];
  let queue = [...procList];

  while (queue.length > 0) {
    let p = queue.shift();

    if (p.remaining > quantum) {
      gantt.push({ pid: p.pid, start: time, end: time + quantum });
      time += quantum;
      p.remaining -= quantum;
      queue.push(p);
    } else {
      gantt.push({ pid: p.pid, start: time, end: time + p.remaining });
      time += p.remaining;
      p.remaining = 0;
      p.completion = time;
    }
  }

  return gantt;
}

// ---------- SIMULATION ----------

function runSimulation() {
  if (processes.length === 0) {
    alert("❌ Add at least one process.");
    return;
  }

  // Deep copy to avoid mutation
  let procCopy = processes.map(p => ({ ...p }));

  let algo = document.getElementById("algorithm").value;
  let gantt;

  if (algo === "fcfs") {
    gantt = fcfs(procCopy);
  } else if (algo === "sjf") {
    gantt = sjf(procCopy);
  } else {
    let q = Number(document.getElementById("quantum").value);
    if (!q || q <= 0) {
      alert("❌ Enter a valid time quantum.");
      return;
    }
    gantt = roundRobin(procCopy, q);
  }

  showMetrics(procCopy);
  drawGantt(gantt);
}

// ---------- METRICS ----------

function showMetrics(procList) {
  let totalWT = 0;
  let totalTAT = 0;

  procList.forEach(p => {
    let tat = p.completion - p.arrival;
    let wt = tat - p.burst;
    totalWT += wt;
    totalTAT += tat;
  });

  let avgWT = (totalWT / procList.length).toFixed(2);
  let avgTAT = (totalTAT / procList.length).toFixed(2);

  document.getElementById("results").innerHTML =
    `Average Waiting Time: ${avgWT}<br>
     Average Turnaround Time: ${avgTAT}`;
}

// ---------- GANTT CHART ----------

function drawGantt(gantt) {
  const ctx = document.getElementById("ganttChart");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: gantt.map(g => g.pid),
      datasets: [{
        data: gantt.map(g => g.end - g.start),
        backgroundColor: "#4f81bd"
      }]
    },
    options: {
      indexAxis: "y",
      scales: {
        x: { beginAtZero: true }
      }
    }
  });
}
