let units = [];
let army = [];

const armySelect = document.getElementById('armySelect');
const armyList = document.getElementById('armyList');
const totalPointsEl = document.getElementById('totalPoints');
const unitSelectorContainer = document.getElementById('unitSelectorContainer');
const unitButtonsContainer = document.getElementById('unitButtonsContainer');
const targetPointsInput = document.getElementById('targetPoints');
const validationMessages = document.getElementById('validationMessages');

function getPointBlocks() {
  const targetPoints = parseInt(targetPointsInput.value, 10);
  return Math.ceil(targetPoints / 1000);
}

function updateTotal() {
  const total = army.reduce((sum, u) => sum + (u.cost * u.count), 0);
  totalPointsEl.textContent = total;
  validateArmy();
}

function renderArmy() {
  armyList.innerHTML = '';
  army.forEach((unit, index) => {
    const li = document.createElement('li');
    li.className = 'flex justify-between items-center p-2 bg-white rounded shadow-sm text-sm';
    li.textContent = `${unit.name} x${unit.count} - ${unit.cost * unit.count} pts`;
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '🗑️';
    removeBtn.className = 'ml-2 text-red-500 hover:text-red-700';
    removeBtn.onclick = () => {
      if (unit.count > 1) {
        unit.count--;
      } else {
        army.splice(index, 1);
      }
      renderArmy();
      updateTotal();
    };
    li.appendChild(removeBtn);
    armyList.appendChild(li);
  });
}

function validateArmy() {
  const pointBlocks = getPointBlocks();
  const messages = [];

  units.forEach(unit => {
    if (!unit.restrictions) return;

    const selected = army.find(u => u.name === unit.name);
    const count = selected ? selected.count : 0;

    const r = unit.restrictions;
    if (r.min && count < r.min) {
      messages.push(`${unit.name} : minimum requis ${r.min}`);
    }
    if (r.max && count > r.max) {
      messages.push(`${unit.name} : maximum autorisé ${r.max}`);
    }
    if (r.minPer1000 && count < r.minPer1000 * pointBlocks) {
      messages.push(`${unit.name} : minimum ${r.minPer1000} par 1000 pts requis (actuellement ${count})`);
    }
    if (r.maxPer1000 && count > r.maxPer1000 * pointBlocks) {
      messages.push(`${unit.name} : maximum ${r.maxPer1000} par 1000 pts dépassé (actuellement ${count})`);
    }
  });

  validationMessages.innerHTML = '';
  if (messages.length > 0) {
    messages.forEach(msg => {
      const div = document.createElement('div');
      div.textContent = msg;
      div.className = 'text-sm text-red-600';
      validationMessages.appendChild(div);
    });
  }
}

function createUnitButtons(units) {
  unitButtonsContainer.innerHTML = '';
  units.forEach(unit => {
    const btn = document.createElement('button');
    btn.className = 'bg-gray-100 hover:bg-blue-200 border rounded p-2 text-left shadow';
    btn.innerHTML = `<strong>${unit.name}</strong><br><span class="text-sm">${unit.cost} pts</span>`;
    btn.onclick = () => addUnitByName(unit.name);
    unitButtonsContainer.appendChild(btn);
  });
}

function addUnitByName(name) {
  const unit = units.find(u => u.name === name);
  if (!unit) return;

  const restriction = unit.restrictions;
  const pointBlocks = getPointBlocks();
  const existing = army.find(u => u.name === unit.name);
  const currentCount = existing ? existing.count : 0;

  if (restriction) {
    if (restriction.perArmy && existing && currentCount >= restriction.max) {
      alert(`${unit.name} ne peut être sélectionné qu'une seule fois.`);
      return;
    }
    if (restriction.maxPer1000 && currentCount >= restriction.maxPer1000 * pointBlocks) {
      alert(`${unit.name} est limité à ${restriction.maxPer1000} par tranche de 1000 pts.`);
      return;
    }
    if (restriction.max && currentCount >= restriction.max) {
      alert(`${unit.name} est limité à ${restriction.max} exemplaires.`);
      return;
    }
  }

  if (existing) {
    existing.count++;
  } else {
    army.push({ ...unit, count: 1 });
  }

  renderArmy();
  updateTotal();
}

function loadArmy(armyId) {
  fetch(`armies/${armyId}.json`)
    .then(res => res.json())
    .then(data => {
      units = data.units;
      unitSelectorContainer.classList.remove('hidden');
      createUnitButtons(units);
      army = [];
      renderArmy();
      updateTotal();
    })
    .catch(err => {
      alert('Erreur de chargement de la liste d’armée.');
      console.error(err);
    });
}

armySelect.addEventListener('change', () => {
  const selectedArmy = armySelect.value;
  if (selectedArmy) {
    loadArmy(selectedArmy);
  } else {
    unitSelectorContainer.classList.add('hidden');
    units = [];
    army = [];
    renderArmy();
    updateTotal();
  }
});
