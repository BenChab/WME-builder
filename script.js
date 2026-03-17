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

  updateTotal();

});

function updateTargetPoints(){
  targetPoints = parseInt(targetPointsInput.value,10) || 0;
  updateTotal();
}

function getPointBlocks(){
  return Math.floor(targetPoints/1000);
}

function updateTotal(){

  const armyTotal = army.reduce((sum,unit)=>{

    let unitCost = unit.cost * unit.count;

    const upgradeCost = (unit.upgrades || []).reduce((s,up)=> s+up.cost ,0);

    return sum + unitCost + upgradeCost;

  },0);

  const magicTotal = selectedMagicItems.reduce((sum,i)=> sum + (i.cost*i.count),0);

  const total = armyTotal + magicTotal;

  totalPointsEl.textContent = total;

  breakPointEl.textContent = calculateBreakPoint();

  validateArmy();

}

function calculateBreakPoint(){

  let totalUnitsForBP = 0;

  army.forEach(unit=>{

    if(unit.countsForBP !== false){

      totalUnitsForBP += unit.count;

    }

  });

  return Math.ceil(totalUnitsForBP/2);

}

function getUnitOrder(name){
  return units.findIndex(u=>u.name===name);
}

function renderArmy(){

  armyList.innerHTML = '';

  const sortedArmy = [...army].sort(
    (a,b)=> getUnitOrder(a.name) - getUnitOrder(b.name)
  );

  sortedArmy.forEach(unit=>{

    const buttons = [];

    if(unit.upgradeOptions && unit.upgradeOptions.length){

      const upgradeBtn = document.createElement('button');
      upgradeBtn.textContent = "⚙";
      upgradeBtn.className="text-blue-500 hover:text-blue-700 ml-2";

      upgradeBtn.onclick=(event)=>{
        showUpgradeMenu(unit.id,event);
      };

      buttons.push(upgradeBtn);

    }

    createRow(
      unit.name,
      unit.count,
      unit.cost * unit.count,
      ()=>removeUnitFromArmy(unit.id),
      buttons
    );

    if(unit.upgrades){

      unit.upgrades.forEach((up,upIndex)=>{

        createRow(
          "↳ "+up.name,
          1,
          up.cost,
          ()=>{
            unit.upgrades.splice(upIndex,1);
            renderArmy();
            updateTotal();
          }
        );

      });

    }

  });

}

function createRow(name,count,cost,removeCallback,extraButtons=[]){

  const li = document.createElement('li');

  li.className="flex justify-between items-center text-sm bg-white rounded px-2 py-1 shadow";

  const left = document.createElement('div');
  left.className="flex gap-3 items-center";

  const nameEl = document.createElement('span');
  nameEl.className="font-medium w-40 truncate";
  nameEl.textContent=name;

  const countEl=document.createElement('span');
  countEl.className="w-8 text-center";
  countEl.textContent=`x${count}`;

  const costEl=document.createElement('span');
  costEl.className="w-20 text-right";
  costEl.textContent=`${cost} pts`;

  const removeBtn=document.createElement('button');
  removeBtn.textContent='🗑️';
  removeBtn.className="text-red-500 hover:text-red-700";
  removeBtn.onclick=removeCallback;

  left.appendChild(nameEl);
  left.appendChild(countEl);
  left.appendChild(costEl);

  li.appendChild(left);

  extraButtons.forEach(btn=>li.appendChild(btn));

  li.appendChild(removeBtn);

  armyList.appendChild(li);

}

function removeUnitFromArmy(unitId){

  const index = army.findIndex(u=>u.id===unitId);

  if(index===-1) return;

  if(army[index].count>1){

    army[index].count--;

  }else{

    army.splice(index,1);

  }

  renderArmy();
  updateTotal();

}

function addUnitByName(name){

  const unit = units.find(u=>u.name===name);

  if(!unit) return;

  const existing = army.find(u=>u.id===unit.id);

  if(existing){

    existing.count++;

  }else{

    army.push({
      ...unit,
      id: unit.id || unit.name,
      count:1,
      upgrades:[]
    });

  }

  renderArmy();
  updateTotal();

}

function createUnitButtons(){

  unitButtonsContainer.innerHTML='';

  units.forEach(unit=>{

    const btn=document.createElement('button');

    btn.className='bg-gray-100 hover:bg-blue-200 border rounded p-2 text-left shadow';

    btn.innerHTML=`<strong>${unit.name}</strong><br><span class="text-sm">${unit.cost} pts</span>`;

    btn.onclick=()=>addUnitByName(unit.name);

    unitButtonsContainer.appendChild(btn);

  });

}

function showUpgradeMenu(unitId,event){

  const unit = army.find(u=>u.id===unitId);

  if(!unit || !unit.upgradeOptions) return;

  removeUpgradeMenu();

  const menu=document.createElement('div');

  upgradeMenu=menu;

  menu.className="fixed bg-white border shadow p-3 rounded";

  menu.style.top=event.clientY+"px";
  menu.style.left=event.clientX+"px";

  unit.upgradeOptions.forEach(id=>{

    const upgrade = upgradeLibrary[id];

    if(!upgrade) return;

    const btn=document.createElement('button');

    btn.className="block w-full text-left hover:bg-gray-200 p-1";

    btn.textContent=`${upgrade.name} (+${upgrade.cost} pts)`;

    btn.onclick=()=>{

      addUpgrade(unitId,id);
      removeUpgradeMenu();

    };

    menu.appendChild(btn);

  });

  const close=document.createElement('button');

  close.textContent="Fermer";

  close.className="mt-2 text-red-500";

  close.onclick=removeUpgradeMenu;

  menu.appendChild(close);

  document.body.appendChild(menu);

}

function removeUpgradeMenu(){

  if(upgradeMenu){

    upgradeMenu.remove();

    upgradeMenu=null;

  }

}

function addUpgrade(unitId,upgradeId){

  const unit=army.find(u=>u.id===unitId);

  const upgrade=upgradeLibrary[upgradeId];

  if(!unit || !upgrade) return;

  unit.upgrades.push({

    id:upgradeId,
    name:upgrade.name,
    cost:upgrade.cost

  });

  renderArmy();
  updateTotal();

}

async function loadArmy(){

  removeUpgradeMenu();

  const selected=armySelect.value;

  if(!selected) return;

  try{

    const [armyRes,magicRes] = await Promise.all([

      fetch(`armies/${selected}.json`),
      fetch("armies/magic_items.json")

    ]);

    const armyData=await armyRes.json();

    magicItems=await magicRes.json();

    upgradeLibrary=armyData.upgradeLibrary || {};

    upgradeSets=armyData.upgradeSets || {};

    units=armyData.units.map(unit=>{

      const newUnit={...unit};

      if(newUnit.upgradeSet){

        newUnit.upgradeOptions=upgradeSets[newUnit.upgradeSet] || [];

      }

      return newUnit;

    });

    unitSelectorContainer.classList.remove('hidden');

    createUnitButtons();

    army=[];

    renderArmy();

    updateTotal();

  }catch(error){

    alert("Erreur de chargement des données.");

    console.error("Erreur de chargement :",error);

  }

}

function validateArmy(){

  const pointBlocks = getPointBlocks();
  const messages = [];

  units.forEach(unit => {

    if(!unit.restrictions) return;

    const selected = army.find(u => u.id === unit.id);
    const count = selected ? selected.count : 0;

    const r = unit.restrictions;

    if(r.min && count < r.min){

      messages.push(`${unit.name} : minimum requis ${r.min}`);

    }

    if(r.max && count > r.max){

      messages.push(`${unit.name} : maximum autorisé ${r.max}`);

    }

    if(r.minPer1000 && count < r.minPer1000 * pointBlocks){

      messages.push(`${unit.name} : minimum ${r.minPer1000} par 1000 pts requis`);

    }

    if(r.maxPer1000 && count > r.maxPer1000 * pointBlocks){

      messages.push(`${unit.name} : maximum ${r.maxPer1000} par 1000 pts dépassé`);

    }

  });

  validationMessages.innerHTML = '';

  messages.forEach(msg => {

    const div = document.createElement('div');

    div.textContent = msg;
    div.className = 'text-sm text-red-600';

    validationMessages.appendChild(div);

  });

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
