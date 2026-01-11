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
  let completed = [];
  let gantt = [];

  procList = procList.map(p => ({ ...p }));

  while (completed.length < procList.length) {
    let available = procList.filter(
      p => p.arrival <= time && !completed.includes(p)
    );

    if (available.length === 0) {
      time++;
      continue;
    }

    let shortest = available.reduce((a, b) =>
      a.burst < b.burst ? a : b
    );

    let start = time;
    time += shortest.burst;
    shortest.completion = time;

    completed.push(shortest);
    gantt.push({ pid: shortest.pid, start, end: time });
  }

  return gantt;
}


function roundRobin(procList, quantum) {
  let time = 0;
  let gantt = [];

  procList = procList.map(p => ({
    ...p,
    remaining: p.burst
  }));

  let queue = [];
  let arrived = [...procList];

  while (queue.length || arrived.length) {
    arrived
      .filter(p => p.arrival <= time)
      .forEach(p => {
        queue.push(p);
        arrived = arrived.filter(x => x !== p);
      });

    if (queue.length === 0) {
      time++;
      continue;
    }

    let p = queue.shift();
    let exec = Math.min(quantum, p.remaining);

    gantt.push({ pid: p.pid, start: time, end: time + exec });

    time += exec;
    p.remaining -= exec;

    arrived
      .filter(p => p.arrival <= time)
      .forEach(p => {
        queue.push(p);
        arrived = arrived.filter(x => x !== p);
      });

    if (p.remaining > 0) queue.push(p);
    else p.completion = time;
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

  document.getElementById("results").innerHTML = `
    <strong>Average Waiting Time:</strong> ${(totalWT / procList.length).toFixed(2)}<br>
    <strong>Average Turnaround Time:</strong> ${(totalTAT / procList.length).toFixed(2)}
  `;
}


// ---------- GANTT CHART ----------

function drawGantt(gantt) {
  const container = document.getElementById("gantt");
  container.innerHTML = "";

  const totalTime = gantt[gantt.length - 1].end;

  gantt.forEach(g => {
    const width = ((g.end - g.start) / totalTime) * 100;

    const block = document.createElement("div");
    block.className = "block";
    block.style.width = width + "%";
    block.style.background = colorForPID(g.pid);
    block.innerText = `${g.pid} (${g.start}-${g.end})`;

    container.appendChild(block);
  });
}

function colorForPID(pid) {
  const colors = {
    P1: "#4f81bd",
    P2: "#c0504d",
    P3: "#9bbb59",
    P4: "#8064a2"
  };
  return colors[pid] || "#555";
}
