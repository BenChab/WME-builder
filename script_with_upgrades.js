
// == Warmaster Army Builder with Upgrades and Restrictions ==

let armyData = null;
let magicItems = [];
let selectedArmy = null;
let currentArmy = [];
let targetPoints = 2000;

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("armySelect").addEventListener("change", loadArmy);
    document.getElementById("targetPoints").addEventListener("input", updateTargetPoints);
    updateTotal();
});

function updateTargetPoints() {
    targetPoints = parseInt(document.getElementById("targetPoints").value, 10) || 0;
    updateTotal();
}

async function loadArmy() {
    const selected = document.getElementById("armySelect").value;
    if (!selected) return;

    try {
        const [armyRes, magicRes] = await Promise.all([
            fetch(`data/${selected}.json`),
            fetch("data/magic_items.json")
        ]);

        armyData = await armyRes.json();
        magicItems = await magicRes.json();
        selectedArmy = selected;
        currentArmy = [];
        document.getElementById("unitButtonsContainer").innerHTML = "";
        displayUnits();
    } catch (error) {
        console.error("Erreur de chargement :", error);
    }
}
