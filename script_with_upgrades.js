let units = [];
let army = [];
let magicItems = [];
let selectedMagicItems = [];
let targetPoints = 2000;

const armySelect = document.getElementById('armySelect');
const armyList = document.getElementById('armyList');
const totalPointsEl = document.getElementById('totalPoints');
const unitSelectorContainer = document.getElementById('unitSelectorContainer');
const unitButtonsContainer = document.getElementById('unitButtonsContainer');
const targetPointsInput = document.getElementById('targetPoints');
const validationMessages = document.getElementById('validationMessages');
const magicItemsContainer = document.getElementById('magicItemsContainer');
const magicItemsButtonsContainer = document.getElementById('magicItemsButtonsContainer');

document.addEventListener("DOMContentLoaded", () => {
  armySelect.addEventListener("change", loadArmy);
  targetPointsInput.addEventListener("input", updateTargetPoints);
  updateTotal();

  // Masquer initialement le conteneur objets magiques
  magicItemsContainer.style.display = 'none';

  const toggleMagicItemsBtn = document.getElementById('toggleMagicItemsBtn');

  toggleMagicItemsBtn.addEventListener('click', () => {
    if (magicItemsContainer.style.display === 'none') {
      magicItemsContainer.style.display = 'block';
      toggleMagicItemsBtn.textContent = 'Masquer les objets magiques';
    } else {
      magicItemsContainer.style.display = 'none';
      toggleMagicItemsBtn.textContent = 'Afficher les objets magiques';
    }
  });
});

function updateTargetPoints() {
  targetPoints = parseInt(targetPointsInput.value, 10) || 0;
  updateTotal();
}

function getPointBlocks() {
  return Math.floor(targetPoints / 1000); // Tranches complètes uniquement
}

function updateTotal() {
  const armyTotal = army.reduce((sum, u) => sum + (u.cost * u.count), 0);
  const magicTotal = selectedMagicItems.reduce((sum, i) => sum + (i.cost * i.count), 0);
  const total = armyTotal + magicTotal;
  totalPointsEl.textContent = total;
  validateArmy();
}

function renderArmy() {
  armyList.innerHTML = '';

  // Affiche unités
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

  // Affiche objets magiques
  selectedMagicItems.forEach((item, index) => {
    const li = document.createElement('li');
    li.textContent = `${item.name} x${item.count} - ${item.cost * item.count} pts`;
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '🗑️';
    removeBtn.className = 'ml-2 text-red-500 hover:text-red-700';
    removeBtn.onclick = () => {
      if (item.count > 1) {
        item.count--;
      } else {
        selectedMagicItems.splice(index, 1);
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

  // Restrictions par groupe
  const groupCounts = {};
  const groupLimits = {};

  army.forEach(unit => {
    const r = unit.restrictions;
    if (r && r.groupId) {
      if (!groupCounts[r.groupId]) {
        groupCounts[r.groupId] = 0;
        groupLimits[r.groupId] = r.maxPer1000;
      }
      groupCounts[r.groupId] += unit.count;
    }
  });

  for (const [groupId, count] of Object.entries(groupCounts)) {
    const limit = groupLimits[groupId] * pointBlocks;
    if (count > limit) {
      messages.push(`Groupe ${groupId} : maximum ${limit} unités autorisées (actuellement ${count})`);
    }
  }

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

function createUnitButtons() {
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

function createMagicItemButtons() {
  magicItemsButtonsContainer.innerHTML = '';
  magicItems.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'bg-yellow-100 hover:bg-yellow-200 border rounded p-2 shadow';
    btn.innerHTML = `<strong>${item.name}</strong><br><span class="text-sm">${item.cost} pts</span>`;
    btn.onclick = () => addMagicItem(item.name);
    magicItemsButtonsContainer.appendChild(btn);
  });
  // On ne force plus d'affichage ici, c'est géré par le bouton toggle
}

function addMagicItem(name) {
  const item = magicItems.find(i => i.name === name);
  if (!item) return;

  const pointBlocks = getPointBlocks();
  const existing = selectedMagicItems.find(i => i.name === name);
  const currentCount = existing ? existing.count : 0;

  const restriction = item.restrictions || {};
  if (restriction.perArmy && existing) {
    alert(`${item.name} ne peut être sélectionné qu'une seule fois.`);
    return;
  }
  if (restriction.maxPer1000 && currentCount >= restriction.maxPer1000 * pointBlocks) {
    alert(`${item.name} est limité à ${restriction.maxPer1000} par 1000 pts.`);
    return;
  }

  if (existing) {
    existing.count++;
  } else {
    selectedMagicItems.push({ ...item, count: 1
