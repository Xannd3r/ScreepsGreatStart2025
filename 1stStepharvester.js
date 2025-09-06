// role.harvester.js
function setWorking(creep) {
  if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
    creep.memory.working = false;
    creep.say('🔄 harvest');
  }
  if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
    creep.memory.working = true;
    creep.say('🚚 deliver');
  }
}

module.exports = {
  run(creep) {
    setWorking(creep);

    if (creep.memory.working) {
      // Fill spawn/extensions/tower first; fallback to controller if full
      const targets = creep.room.find(FIND_STRUCTURES, {
        filter: s =>
          (s.structureType === STRUCTURE_SPAWN ||
           s.structureType === STRUCTURE_EXTENSION ||
           s.structureType === STRUCTURE_TOWER) &&
          s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
      });

      if (targets.length) {
        if (creep.transfer(targets[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffaa00' } });
        }
      } else {
        // Nothing to fill? Help upgrade.
        if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
          creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
        }
      }
    } else {
      // Harvest assigned source if possible
      let source = null;

      if (creep.memory.sourceId) {
        source = Game.getObjectById(creep.memory.sourceId);
      }

      if (!source) {
        // Fallback: pick closest and remember it
        source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
        if (source) creep.memory.sourceId = source.id;
      }

      if (source) {
        const res = creep.harvest(source);
        if (res === ERR_NOT_IN_RANGE) {
          creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
        } else if (res === ERR_NOT_ENOUGH_RESOURCES) {
          // Source is empty this tick—go stand on it like a patient statue
          creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
      } else {
        // Truly nothing found? Pout near spawn.
        creep.moveTo(creep.room.find(FIND_MY_SPAWNS)[0] || creep.room.controller);
      }
    }
  }
};
