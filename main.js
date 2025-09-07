// main.js — balanced spawns + tidy brain (harvesters only)
const roleHarvester = require('role.harvester');
const roleUpgrader  = require('role.upgrader');
const roleBuilder   = require('role.builder');
const towerLogic    = require('structure.tower');

const SPAWN_NAME = 'Spawn1';

function cleanupMemory() {
  for (const name in Memory.creeps) {
    if (!Game.creeps[name]) delete Memory.creeps[name];
  }
}

function countRoles() {
  return _.countBy(Object.values(Game.creeps), c => c.memory.role);
}

/** Current economy: 4 harvesters, 2 upgraders, up to 1 builders */
function desiredCounts(room) {
  const buildSites = room.find(FIND_CONSTRUCTION_SITES).length;
  const targets = { harvester: 4, upgrader: 2, builder: 0 };
  if (buildSites) targets.builder = 2;       // only if something to build
  if (room.controller && room.controller.level <= 7) targets.upgrader = 2; // early push
  return targets;
}

/** move:          50 energy
    work:          100 energy
    attack:        80 energy
    carry:         100 energy
    heal:          250 energy
    range_attack:  150 energy
    tough:         10 energy
    claim:         600 energy
    */
function bestWorkerBody(energy) {
  const body = [];
  const block = [WORK, WORK, CARRY, MOVE, MOVE, MOVE];
  const costPer = 300;
  while (energy >= costPer && body.length + block.length <= 50) {
    body.push(...block);
    energy -= costPer;
  }
  return body.length ? body : [WORK, WORK, CARRY, MOVE, MOVE, MOVE];
}

/** Evenly assign creeps to sources for a given role */
function assignSourceBalanced(room, role) {
  const sources = room.find(FIND_SOURCES);
  if (!sources.length) return undefined;

  const counts = {};
  for (const s of sources) counts[s.id] = 0;

  for (const c of Object.values(Game.creeps)) {
    if (c.memory.role === role && c.memory.sourceId && counts.hasOwnProperty(c.memory.sourceId)) {
      counts[c.memory.sourceId]++;
    }
  }

  let chosen = sources[0], min = Infinity;
  for (const s of sources) {
    const n = counts[s.id] || 0;
    if (n < min) { chosen = s; min = n; }
  }
  return chosen.id;
}

/** Spawn logic — prioritizes harvesters, then upgraders, then builders */
function trySpawn(room) {
  const counts  = countRoles();
  const targets = desiredCounts(room);

  // Priority order
  const prio = { harvester: 1, upgrader: 2, builder: 3 };
  const rolesInOrder = Object.keys(targets).sort((a, b) => (prio[a] || 99) - (prio[b] || 99));

  for (const role of rolesInOrder) {
    const have = counts[role] || 0;
    const want = targets[role];
    if (have >= want) continue;

    const available = room.energyAvailable;
    const body = bestWorkerBody(available);
    const name = `${role}-${Game.time}`;

    const memory = { role, working: false };
    if (role === 'harvester') {
      memory.sourceId = assignSourceBalanced(room, 'harvester');
    }

    const res = Game.spawns[SPAWN_NAME].spawnCreep(body, name, { memory });
    if (res === OK) {
      console.log(`Spawning ${name} (${role}) parts=${body.length} energy=${available} src=${memory.sourceId || '-'}`);
    }
    break; // only one spawn attempt per tick
  }
}

module.exports.loop = function () {
  const spawn = Game.spawns[SPAWN_NAME];
  if (!spawn) return console.log('No spawn named', SPAWN_NAME, '— update SPAWN_NAME in main.js');

  const room = spawn.room;

  cleanupMemory();
  trySpawn(room);
  towerLogic.run(room);

  for (const name in Game.creeps) {
    const creep = Game.creeps[name];
    switch (creep.memory.role) {
      case 'harvester': roleHarvester.run(creep); break;
      case 'upgrader':  roleUpgrader.run(creep);  break;
      case 'builder':   roleBuilder.run(creep);   break;
      default:          roleUpgrader.run(creep);
    }
  }

  if (spawn.spawning) {
    const spawningCreep = Game.creeps[spawn.spawning.name];
    room.visual.text('🧪 ' + spawningCreep.memory.role, spawn.pos.x + 1, spawn.pos.y, { align: 'left', opacity: 0.8 });
  }
};
