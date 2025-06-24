let units = [];
let army = [];

const armySelect = document.getElementById('armySelect');
const unitSelect = document.getElementById('unitSelect');
const addUnitBtn = document.getElementById('addUnitBtn');
const armyList = document.getElementById('armyList');
const totalPointsEl = document.getElementById('totalPoints');
const unitSelectorContainer = document.getElementById('unitSelectorContainer');

function updateTotal() {
  const total = army.reduce((sum, u) => sum + u.cost, 0);
  totalPointsEl.textContent = total;
}

function renderArmy() {
  armyList.innerHTML = '';
  army.forEach((unit, index) => {
    const li = document.createElement('li');
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

function loadArmy(armyId) {
  fetch(`armies/${armyId}.json`)
    .then(res => res.json())
    .then(data => {
      units = data.units;
      unitSelectorContainer.classList.remove('hidden');
      unitSelect.innerHTML = '';
      units.forEach(unit => {
        const opt = document.createElement('option');
        opt.value = unit.name;
        opt.textContent = `${unit.name} (${unit.cost} pts)`;
        unitSelect.appendChild(opt);
      });
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

addUnitBtn.addEventListener('click', () => {
  const selectedName = unitSelect.value;
  const unit = units.find(u => u.name === selectedName);
  if (unit) {
    const existing = army.find(u => u.name === unit.name);
    if (existing) {
      existing.count++;
    } else {
      army.push({ ...unit, count: 1 });
    }
    renderArmy();
    updateTotal();
  }
});
