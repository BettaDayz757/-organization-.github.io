// BettaDayZ PBBG Game Engine
class BettaDayZGame {
    constructor() {
        this.player = {
            name: 'Criminal',
            level: 1,
            xp: 0,
            xpToNext: 100,
            health: 100,
            maxHealth: 100,
            energy: 100,
            maxEnergy: 100,
            money: 100,
            reputation: 0,
            strength: 10,
            agility: 10,
            intelligence: 10,
            equipment: {
                weapon: null,
                armor: null
            },
            inventory: []
        };

        this.dungeonFloor = 0;
        this.gameTime = 0;
        this.eventHistory = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateUI();
        this.startAutoSave();
        this.checkForSavedGame();
    }

    checkForSavedGame() {
        const saved = localStorage.getItem('bettadayz_save');
        if (saved) {
            const load = confirm('Found a saved game! Would you like to load it?');
            if (load) {
                this.loadGame();
            }
        }
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    // Update UI
    updateUI() {
        // Player stats
        document.getElementById('player-name').textContent = this.player.name;
        document.getElementById('player-level').textContent = this.player.level;
        document.getElementById('player-xp').textContent = this.player.xp;
        document.getElementById('player-xp-max').textContent = this.player.xpToNext;
        
        // Health and Energy bars
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        const energyPercent = (this.player.energy / this.player.maxEnergy) * 100;
        document.getElementById('health-bar').style.width = healthPercent + '%';
        document.getElementById('energy-bar').style.width = energyPercent + '%';
        document.getElementById('health-value').textContent = Math.floor(this.player.health);
        document.getElementById('energy-value').textContent = Math.floor(this.player.energy);
        
        // Other stats
        document.getElementById('player-money').textContent = '$' + this.player.money;
        document.getElementById('player-reputation').textContent = this.player.reputation;
        document.getElementById('player-strength').textContent = this.player.strength;
        document.getElementById('player-agility').textContent = this.player.agility;
        document.getElementById('player-intelligence').textContent = this.player.intelligence;
        
        // Equipment
        document.getElementById('equipped-weapon').textContent = 
            this.player.equipment.weapon ? this.player.equipment.weapon.name : 'None';
        document.getElementById('equipped-armor').textContent = 
            this.player.equipment.armor ? this.player.equipment.armor.name : 'None';
        
        // Dungeon floor
        document.getElementById('dungeon-floor').textContent = this.dungeonFloor;
        
        // Inventory
        this.updateInventory();
    }

    updateInventory() {
        const inventoryContent = document.getElementById('inventory-content');
        if (this.player.inventory.length === 0) {
            inventoryContent.innerHTML = '<p>Your inventory is empty.</p>';
        } else {
            inventoryContent.innerHTML = this.player.inventory.map((item, index) => `
                <div class="inventory-item">
                    <div class="item-name">${item.icon || '📦'} ${item.name}</div>
                    <div class="item-stats">${item.stats}</div>
                    <button onclick="game.equipItem(${index})">Equip</button>
                    <button onclick="game.sellItem(${index})">Sell ($${Math.floor(item.value * 0.5)})</button>
                </div>
            `).join('');
        }
    }

    // Message system
    addMessage(text, type = 'normal') {
        const messagesDiv = document.getElementById('messages');
        const messageEl = document.createElement('p');
        messageEl.className = `message ${type}`;
        messageEl.textContent = text;
        messagesDiv.appendChild(messageEl);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        
        // Keep only last 20 messages
        const messages = messagesDiv.querySelectorAll('.message');
        if (messages.length > 20) {
            messages[0].remove();
        }
    }

    addEvent(text) {
        this.eventHistory.unshift(text);
        if (this.eventHistory.length > 10) {
            this.eventHistory.pop();
        }
        
        const eventsDiv = document.getElementById('events-list');
        eventsDiv.innerHTML = this.eventHistory.map(event => 
            `<p class="event">${event}</p>`
        ).join('');
    }

    // Life Activities
    rest() {
        this.addMessage('You take a rest...', 'normal');
        this.player.health = Math.min(this.player.health + 30, this.player.maxHealth);
        this.player.energy = Math.min(this.player.energy + 50, this.player.maxEnergy);
        this.gameTime += 1;
        this.addMessage(`You feel refreshed! Health and energy restored.`, 'success');
        this.addEvent('Rested');
        this.updateUI();
    }

    work() {
        if (this.player.energy < 20) {
            this.addMessage('Not enough energy to work!', 'error');
            return;
        }
        
        this.player.energy -= 20;
        const earnings = Math.floor(30 + Math.random() * 40 + this.player.intelligence * 2);
        this.player.money += earnings;
        this.gainXP(5);
        this.addMessage(`You worked hard and earned $${earnings}!`, 'success');
        this.addEvent(`Worked for $${earnings}`);
        this.updateUI();
    }

    train(stat) {
        if (this.player.energy < 15) {
            this.addMessage('Not enough energy to train!', 'error');
            return;
        }
        
        if (this.player.money < 50) {
            this.addMessage('Not enough money to train! Cost: $50', 'error');
            return;
        }
        
        this.player.energy -= 15;
        this.player.money -= 50;
        
        const increase = Math.floor(1 + Math.random() * 2);
        this.player[stat] += increase;
        this.gainXP(10);
        
        const statNames = {
            strength: 'Strength',
            agility: 'Agility',
            intelligence: 'Intelligence'
        };
        
        this.addMessage(`${statNames[stat]} increased by ${increase}!`, 'success');
        this.addEvent(`Trained ${statNames[stat]}`);
        this.updateUI();
    }

    socialize() {
        if (this.player.energy < 10) {
            this.addMessage('Not enough energy to socialize!', 'error');
            return;
        }
        
        if (this.player.money < 25) {
            this.addMessage('Not enough money to socialize! Cost: $25', 'error');
            return;
        }
        
        this.player.energy -= 10;
        this.player.money -= 25;
        const repGain = Math.floor(1 + Math.random() * 3);
        this.player.reputation += repGain;
        this.gainXP(8);
        
        this.addMessage(`You made some connections! Reputation +${repGain}`, 'success');
        this.addEvent('Socialized');
        this.updateUI();
    }

    // Crime Activities
    commitCrime(crimeType) {
        const crimes = {
            pickpocket: {
                name: 'Pickpocket',
                energy: 10,
                minReward: 20,
                maxReward: 50,
                riskLevel: 0.1,
                xp: 5,
                repCost: 1
            },
            mugging: {
                name: 'Mugging',
                energy: 15,
                minReward: 50,
                maxReward: 150,
                riskLevel: 0.2,
                xp: 15,
                repCost: 2,
                reqLevel: 2
            },
            burglary: {
                name: 'Burglary',
                energy: 20,
                minReward: 100,
                maxReward: 300,
                riskLevel: 0.25,
                xp: 25,
                repCost: 3,
                reqLevel: 3
            },
            carjacking: {
                name: 'Carjacking',
                energy: 25,
                minReward: 200,
                maxReward: 500,
                riskLevel: 0.3,
                xp: 40,
                repCost: 4,
                reqLevel: 5
            },
            bankheist: {
                name: 'Bank Heist',
                energy: 40,
                minReward: 1000,
                maxReward: 3000,
                riskLevel: 0.4,
                xp: 100,
                repCost: 5,
                reqLevel: 10
            },
            blackmarket: {
                name: 'Black Market',
                energy: 30,
                minReward: 500,
                maxReward: 1500,
                riskLevel: 0.35,
                xp: 60,
                repCost: 4,
                reqLevel: 7
            }
        };

        const crime = crimes[crimeType];
        
        if (crime.reqLevel && this.player.level < crime.reqLevel) {
            this.addMessage(`You need to be level ${crime.reqLevel} to attempt ${crime.name}!`, 'error');
            return;
        }
        
        if (this.player.energy < crime.energy) {
            this.addMessage('Not enough energy for this crime!', 'error');
            return;
        }

        this.player.energy -= crime.energy;

        // Success calculation based on agility and intelligence
        const successBonus = (this.player.agility + this.player.intelligence) / 100;
        const successChance = (1 - crime.riskLevel) + successBonus;
        
        if (Math.random() < successChance) {
            const reward = Math.floor(crime.minReward + Math.random() * (crime.maxReward - crime.minReward));
            this.player.money += reward;
            this.player.reputation -= crime.repCost;
            this.gainXP(crime.xp);
            
            this.addMessage(`${crime.name} successful! You got away with $${reward}!`, 'success');
            this.addEvent(`Successful ${crime.name}`);
        } else {
            const damage = Math.floor(10 + Math.random() * 20);
            this.player.health -= damage;
            this.player.reputation -= crime.repCost * 2;
            
            this.addMessage(`${crime.name} failed! You took ${damage} damage and lost reputation!`, 'error');
            this.addEvent(`Failed ${crime.name}`);
            
            if (this.player.health <= 0) {
                this.handleDeath();
            }
        }

        this.updateUI();
    }

    // Dungeon System
    exploreDungeon(difficulty) {
        const dungeons = {
            easy: { energy: 20, enemyLevel: 1, reward: 50, xp: 30 },
            medium: { energy: 30, enemyLevel: 3, reward: 150, xp: 60 },
            hard: { energy: 40, enemyLevel: 5, reward: 300, xp: 120 }
        };

        const dungeon = dungeons[difficulty];

        if (this.player.energy < dungeon.energy) {
            this.addMessage('Not enough energy to explore this dungeon!', 'error');
            return;
        }

        this.player.energy -= dungeon.energy;
        this.addMessage(`Entering ${difficulty} dungeon...`, 'normal');

        // Combat calculation
        const playerPower = this.player.strength + this.player.agility + 
            (this.player.equipment.weapon ? this.player.equipment.weapon.damage : 0);
        const enemyPower = dungeon.enemyLevel * 15 + Math.random() * 20;
        const defense = this.player.equipment.armor ? this.player.equipment.armor.defense : 0;

        if (playerPower > enemyPower) {
            // Victory
            const treasureBonus = Math.floor(Math.random() * 100);
            const totalReward = dungeon.reward + treasureBonus;
            this.player.money += totalReward;
            this.gainXP(dungeon.xp);
            this.dungeonFloor++;
            
            // Chance for loot
            if (Math.random() < 0.3) {
                this.findLoot();
            }
            
            this.addMessage(`Victory! You found $${totalReward} and gained ${dungeon.xp} XP!`, 'success');
            this.addEvent(`Conquered ${difficulty} dungeon`);
        } else {
            // Defeat
            const damage = Math.max(5, Math.floor((enemyPower - playerPower) - defense));
            this.player.health -= damage;
            this.addMessage(`Defeated! You took ${damage} damage!`, 'error');
            this.addEvent(`Defeated in ${difficulty} dungeon`);
            
            if (this.player.health <= 0) {
                this.handleDeath();
            }
        }

        this.updateUI();
    }

    findLoot() {
        const lootTypes = [
            { type: 'weapon', name: 'Rusty Sword', icon: '⚔️', damage: 8, value: 150 },
            { type: 'weapon', name: 'Iron Axe', icon: '🪓', damage: 12, value: 250 },
            { type: 'weapon', name: 'Steel Blade', icon: '🗡️', damage: 18, value: 400 },
            { type: 'armor', name: 'Leather Armor', icon: '🦺', defense: 8, value: 150 },
            { type: 'armor', name: 'Chain Mail', icon: '🛡️', defense: 15, value: 300 },
            { type: 'armor', name: 'Plate Armor', icon: '⚔️', defense: 25, value: 500 }
        ];

        const loot = lootTypes[Math.floor(Math.random() * lootTypes.length)];
        const item = {
            type: loot.type,
            name: loot.name,
            icon: loot.icon,
            stats: loot.type === 'weapon' ? `+${loot.damage} Damage` : `+${loot.defense} Defense`,
            damage: loot.damage,
            defense: loot.defense,
            value: loot.value
        };

        this.player.inventory.push(item);
        this.addMessage(`Found ${loot.icon} ${loot.name}!`, 'success');
    }

    // Shop System
    buyItem(type, name, price, stat) {
        if (this.player.money < price) {
            this.addMessage('Not enough money!', 'error');
            return;
        }

        const icons = {
            knife: '🗡️', pistol: '🔫', sword: '⚔️', katana: '🔪',
            leather: '👕', kevlar: '🦺', bodyarmor: '🛡️', tactical: '⚔️'
        };

        const item = {
            type: type,
            name: name.charAt(0).toUpperCase() + name.slice(1),
            icon: icons[name] || '📦',
            stats: type === 'weapon' ? `+${stat} Damage` : `+${stat} Defense`,
            damage: type === 'weapon' ? stat : 0,
            defense: type === 'armor' ? stat : 0,
            value: price
        };

        this.player.money -= price;
        this.player.inventory.push(item);
        
        this.addMessage(`Purchased ${item.icon} ${item.name} for $${price}!`, 'success');
        this.addEvent(`Bought ${item.name}`);
        this.updateUI();
    }

    equipItem(index) {
        const item = this.player.inventory[index];
        
        if (this.player.equipment[item.type]) {
            // Unequip current item back to inventory
            this.player.inventory.push(this.player.equipment[item.type]);
        }
        
        this.player.equipment[item.type] = item;
        this.player.inventory.splice(index, 1);
        
        this.addMessage(`Equipped ${item.icon} ${item.name}!`, 'success');
        this.updateUI();
    }

    sellItem(index) {
        const item = this.player.inventory[index];
        const sellPrice = Math.floor(item.value * 0.5);
        
        this.player.money += sellPrice;
        this.player.inventory.splice(index, 1);
        
        this.addMessage(`Sold ${item.name} for $${sellPrice}!`, 'success');
        this.updateUI();
    }

    // XP and Leveling
    gainXP(amount) {
        this.player.xp += amount;
        
        while (this.player.xp >= this.player.xpToNext) {
            this.levelUp();
        }
    }

    levelUp() {
        this.player.level++;
        this.player.xp -= this.player.xpToNext;
        this.player.xpToNext = Math.floor(this.player.xpToNext * 1.5);
        
        // Level up bonuses
        this.player.maxHealth += 10;
        this.player.maxEnergy += 10;
        this.player.health = this.player.maxHealth;
        this.player.energy = this.player.maxEnergy;
        this.player.strength += 2;
        this.player.agility += 2;
        this.player.intelligence += 2;
        
        this.addMessage(`🎉 LEVEL UP! You are now level ${this.player.level}!`, 'success');
        this.addEvent(`Reached level ${this.player.level}`);
    }

    handleDeath() {
        this.player.health = this.player.maxHealth;
        this.player.energy = this.player.maxEnergy;
        const moneyLost = Math.floor(this.player.money * 0.3);
        this.player.money -= moneyLost;
        
        this.addMessage(`💀 You died! Lost $${moneyLost} and were sent to the hospital.`, 'error');
        this.addEvent('Died and hospitalized');
    }

    // Save/Load System
    saveGame() {
        const saveData = {
            player: this.player,
            dungeonFloor: this.dungeonFloor,
            gameTime: this.gameTime,
            eventHistory: this.eventHistory,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('bettadayz_save', JSON.stringify(saveData));
        this.addMessage('Game saved successfully!', 'success');
    }

    loadGame() {
        const saved = localStorage.getItem('bettadayz_save');
        
        if (saved) {
            try {
                const saveData = JSON.parse(saved);
                this.player = saveData.player;
                this.dungeonFloor = saveData.dungeonFloor || 0;
                this.gameTime = saveData.gameTime || 0;
                this.eventHistory = saveData.eventHistory || [];
                
                this.updateUI();
                this.addMessage('Game loaded successfully!', 'success');
                this.addEvent('Game loaded');
            } catch (e) {
                this.addMessage('Failed to load game!', 'error');
            }
        } else {
            this.addMessage('No saved game found!', 'error');
        }
    }

    resetGame() {
        if (confirm('Are you sure you want to start a new game? All progress will be lost!')) {
            localStorage.removeItem('bettadayz_save');
            location.reload();
        }
    }

    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            this.saveGame();
        }, 60000); // Auto-save every minute
    }

    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    // Help Modal
    showHelp() {
        const helpContent = `
            <h2>🎮 BettaDayZ - Game Guide</h2>
            
            <h3>Overview</h3>
            <p>BettaDayZ is a persistent browser-based game where you build a criminal empire while exploring dangerous dungeons and managing your life.</p>
            
            <h3>Game Tabs</h3>
            <ul>
                <li><strong>Life:</strong> Rest, work, train skills, and socialize to build your character</li>
                <li><strong>Crime:</strong> Commit various crimes to earn money and reputation</li>
                <li><strong>Dungeon:</strong> Explore dungeons to fight enemies and find treasure</li>
                <li><strong>Shop:</strong> Buy weapons and armor to increase your power</li>
                <li><strong>Inventory:</strong> Manage items you've purchased or found</li>
            </ul>
            
            <h3>Stats</h3>
            <ul>
                <li><strong>Health:</strong> Your life points. Reaching 0 causes death and money loss</li>
                <li><strong>Energy:</strong> Required for most actions. Restore with rest</li>
                <li><strong>Money:</strong> Used to buy items and train skills</li>
                <li><strong>Reputation:</strong> Earned through socializing, lost through crime</li>
                <li><strong>Strength:</strong> Increases combat power</li>
                <li><strong>Agility:</strong> Improves crime success and combat</li>
                <li><strong>Intelligence:</strong> Boosts work earnings and crime success</li>
            </ul>
            
            <h3>Tips for Success</h3>
            <ul>
                <li>Balance legal work and crime to maintain income</li>
                <li>Train regularly to increase your stats</li>
                <li>Buy equipment before attempting difficult dungeons</li>
                <li>Rest when energy is low to avoid being ineffective</li>
                <li>Start with small crimes and work up to bigger heists</li>
                <li>Save your game regularly (auto-saves every minute)</li>
            </ul>
            
            <h3>Crime Risk</h3>
            <p>Higher reward crimes have higher risk of failure. Failure causes damage and reputation loss. Success depends on your Agility and Intelligence stats.</p>
            
            <h3>Dungeons</h3>
            <p>Dungeons reward experience and money. Your combat power depends on Strength, Agility, and equipment. Armor reduces damage taken.</p>
            
            <h3>Leveling Up</h3>
            <p>Gain XP through activities. Leveling increases all stats, max health, and max energy.</p>
        `;
        
        this.showModal(helpContent);
    }

    showModal(content) {
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = content;
        modal.style.display = 'block';
    }

    closeModal() {
        document.getElementById('modal').style.display = 'none';
    }
}

// Initialize game when page loads
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new BettaDayZGame();
});

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        game.closeModal();
    }
});
