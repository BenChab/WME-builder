let units = [];
let army = [];
let magicItems = [];
let selectedMagicItems = [];
let targetPoints = 2000;
let upgradeLibrary = {};
let upgradeSets = {};
let upgradeMenu = null;

const armySelect = document.getElementById('armySelect');
const armyList = document.getElementById('armyList');
const totalPointsEl = document.getElementById('totalPoints');
const unitSelectorContainer = document.getElementById('unitSelectorContainer');
const unitButtonsContainer = document.getElementById('unitButtonsContainer');
const targetPointsInput = document.getElementById('targetPoints');
const validationMessages = document.getElementById('validationMessages');
const magicItemsContainer = document.getElementById('magicItemsContainer');
const magicItemsButtonsContainer = document.getElementById('magicItemsButtonsContainer');
const breakPointEl = document.getElementById('breakPoint');

document.addEventListener("DOMContentLoaded", () => {
  armySelect.addEventListener("change", loadArmy);
  targetPointsInput.addEventListener("input", updateTargetPoints);
  updateTotal();

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

// Fonction qui retourne l'ordre des unités dans le tableau en fonction de leur nom
function getUnitOrder(name) {
  return units.findIndex(u => u.name === name);
}

function updateTargetPoints() {
  targetPoints = parseInt(targetPointsInput.value, 10) || 0;
  updateTotal();
}

function getPointBlocks() {
  return Math.floor(targetPoints / 1000); // Tranches complètes uniquement
}

function updateTotal() {
  const armyTotal = army.reduce((sum, unit) => {
    let unitCost = unit.cost * unit.count;
    const upgradeCost = (unit.upgrades || []).reduce((s, up) => s + up.cost, 0);
    return sum + unitCost + upgradeCost;
  }, 0);

  const magicTotal = selectedMagicItems.reduce((sum, i) => sum + (i.cost * i.count), 0);
  const total = armyTotal + magicTotal;

  totalPointsEl.textContent = total;

  const bp = calculateBreakPoint();
  breakPointEl.textContent = bp;

  validateArmy();
}

function calculateBreakPoint() {
  let totalUnitsForBP = 0;

  army.forEach(unit => {
    const countsForBP = unit.countsForBP !== false;
    if (countsForBP) {
      totalUnitsForBP += unit.count;
    }
  });

  return Math.ceil(totalUnitsForBP / 2);
}

function renderArmy() {
  armyList.innerHTML = ''; // Vider la liste à chaque fois

  const sortedArmy = [...army].sort(
    (a, b) => getUnitOrder(a.name) - getUnitOrder(b.name)
  );

  sortedArmy.forEach(unit => {
    const buttons = [];

    if (unit.upgradeOptions && unit.upgradeOptions.length > 0) {
      const upgradeBtn = document.createElement('button');
      upgradeBtn.textContent = "⚙";
      upgradeBtn.className = "text-blue-500 hover:text-blue-700 ml-2";
      upgradeBtn.onclick = (event) => {
        showUpgradeMenu(unit.id, event); // Appeler la popup d'amélioration
      };

      buttons.push(upgradeBtn);
    }

    createRow(
      unit.name,
      unit.count,
      unit.cost * unit.count,
      () => {
        removeUnitFromArmy(unit.id);  // Supprimer l'unité de l'armée
        renderArmy();  // Redessiner l'armée après suppression
        updateTotal();
      },
      buttons
    );

    if (unit.upgrades && unit.upgrades.length > 0) {
      unit.upgrades.forEach((up, upIndex) => {
        createRow(
          "↳ " + up.name,
          1,
          up.cost,
          () => {
            unit.upgrades.splice(upIndex, 1);
            renderArmy();
            updateTotal();
          }
        );
      });
    }
  });

  selectedMagicItems.forEach((item, index) => {
    createRow(
      item.name,
      item.count,
      item.cost * item.count,
      () => {
        if (item.count > 1) {
          item.count--;
        } else {
          selectedMagicItems.splice(index, 1);
        }
        renderArmy();
        updateTotal();
      }
    );
  });
}

function createRow(name, count, cost, removeCallback, extraButtons = []) {
  const li = document.createElement('li');
  li.className = "flex justify-between items-center text-sm bg-white rounded px-2 py-1 shadow";

  const left = document.createElement('div');
  left.className = "flex gap-3 items-center";

  const nameEl = document.createElement('span');
  nameEl.className = "font-medium w-40 truncate";
  nameEl.textContent = name;

  const countEl = document.createElement('span');
  countEl.className = "w-8 text-center";
  countEl.textContent = `x${count}`;

  const costEl = document.createElement('span');
  costEl.className = "w-20 text-right";
  costEl.textContent = `${cost} pts`;

  const removeBtn = document.createElement('button');
  removeBtn.textContent = '🗑️';
  removeBtn.className = "text-red-500 hover:text-red-700";
  removeBtn.onclick = removeCallback;

  left.appendChild(nameEl);
  left.appendChild(countEl);
  left.appendChild(costEl);

  li.appendChild(left);
  extraButtons.forEach(btn => li.appendChild(btn));
  li.appendChild(removeBtn);

  armyList.appendChild(li);
}

function showUpgradeMenu(unitId, event) {
  const unit = army.find(u => u.id === unitId);

  if (!unit.upgradeOptions) return;

  // Si la popup est déjà ouverte, on la ferme avant d'en ouvrir une nouvelle
  if (upgradeMenu) {
    upgradeMenu.remove();
    upgradeMenu = null;
  }

  // Créer une nouvelle popup
  const menu = document.createElement('div');
  upgradeMenu = menu;
  menu.className = "fixed bg-white border shadow p-3 rounded";
  menu.style.top = event.clientY + "px";
  menu.style.left = event.clientX + "px";

  unit.upgradeOptions.forEach(id => {
    const upgrade = upgradeLibrary[id];

    if (!upgrade) return;

    const btn = document.createElement('button');
    btn.className = "block w-full text-left hover:bg-gray-200 p-1";
    btn.textContent = `${upgrade.name} (+${upgrade.cost} pts)`;

    btn.onclick = () => {
      addUpgrade(unitId, id);
      document.body.removeChild(menu);  // Fermer la popup après ajout
      upgradeMenu = null;  // Réinitialiser la popup
    };

    menu.appendChild(btn);
  });

  const close = document.createElement('button');
  close.textContent = "Fermer";
  close.className = "mt-2 text-red-500";

  close.onclick = () => {
    document.body.removeChild(menu); // Fermer la popup
    upgradeMenu = null; // Réinitialiser la popup
  };

  menu.appendChild(close);

  document.body.appendChild(menu);

  // On supprime tout d'abord l'ancien écouteur, puis on le réajoute.
  setTimeout(() => {
    document.removeEventListener("click", closeUpgradeMenuOutside);  // Supprimer l'ancien gestionnaire
    document.addEventListener("click", closeUpgradeMenuOutside);  // Réajouter un nouveau gestionnaire
  }, 0);
}

function closeUpgradeMenuOutside(event) {
  if (!upgradeMenu) return;

  if (!upgradeMenu.contains(event.target)) {
    upgradeMenu.remove();
    upgradeMenu = null;
    document.removeEventListener("click", closeUpgradeMenuOutside);
  }
}

function addUpgrade(unitId, upgradeId) {
  const unit = army.find(u => u.id === unitId);
  const upgrade = upgradeLibrary[upgradeId];

  if (!upgrade) return;

  const restriction = upgrade.restrictions || {};

  if (!unit.upgrades) {
    unit.upgrades = [];
  }

  if (restriction.perArmy) {
    const existingUpgrade = unit.upgrades.find(up => up.id === upgradeId);
    if (existingUpgrade) {
      alert(`${upgrade.name} est déjà sélectionné pour cette unité.`);
      return;
    }
  }

  unit.upgrades.push({
    id: upgradeId,
    name: upgrade.name,
    cost: upgrade.cost
  });

  renderArmy();
  updateTotal();
}

function removeUnitFromArmy(unitId) {
  const unitIndex = army.findIndex(u => u.id === unitId);
  if (unitIndex !== -1) {
    army.splice(unitIndex, 1);  // Supprimer l'unité
    renderArmy();  // Redessiner l'armée
    updateTotal();  // Mettre à jour le total
  }
}

function addUnitByName(name) {
  const unit = units.find(u => u.name === name);
  if (!unit) return;

  const restriction = unit.restrictions;
  const pointBlocks = getPointBlocks();
  const existing = army.find(u => u.id === unit.id);
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
    existing.count++; // Augmenter le nombre d'unités existantes
  } else {
    army.push({ ...unit, count: 1 }); // Ajouter une nouvelle unité si elle n'existe pas
  }

  renderArmy(); // Mettre à jour l'affichage de l'armée
  updateTotal(); // Mettre à jour les points
}

function createUnitButtons() {
  unitButtonsContainer.innerHTML = ''; // Vider le conteneur avant d'ajouter les nouveaux boutons
  units.forEach(unit => {
    const btn = document.createElement('button');
    btn.className = 'bg-gray-100 hover:bg-blue-200 border rounded p-2 text-left shadow';
    btn.innerHTML = `<strong>${unit.name}</strong><br><span class="text-sm">${unit.cost} pts</span>`;
    btn.onclick = () => addUnitByName(unit.name); // Ajouter l'unité au clic
    unitButtonsContainer.appendChild(btn);
  });
}

async function loadArmy() {
  if (upgradeMenu) {
    upgradeMenu.remove();
    upgradeMenu = null;
  }

  const selected = armySelect.value;
  if (!selected) return;

  try {
    const [armyRes, magicRes] = await Promise.all([
      fetch(`armies/${selected}.json`),
      fetch("armies/magic_items.json")
    ]);

    const armyData = await armyRes.json();
    magicItems = await magicRes.json();

    createMagicItemButtons();
    selectedMagicItems = [];

    upgradeLibrary = armyData.upgradeLibrary || {};
    upgradeSets = armyData.upgradeSets || {};

    units = armyData.units.map(unit => {
      const newUnit = { ...unit };

      if (newUnit.upgradeSet) {
        newUnit.upgradeOptions = upgradeSets[newUnit.upgradeSet] || [];
      }

      return newUnit;
    });

    unitSelectorContainer.classList.remove('hidden');
    createUnitButtons();
    army = [];
    renderArmy();
    updateTotal();
  } catch (error) {
    alert("Erreur de chargement des données.");
    console.error("Erreur de chargement :", error);
  }
}

function validateArmy() {
  const pointBlocks = getPointBlocks();
  const messages = [];

  army.forEach(unit => {
    if (!unit.restrictions) return;

    const selected = army.find(u => u.id === unit.id);
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
