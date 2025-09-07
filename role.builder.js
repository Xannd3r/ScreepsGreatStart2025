function setWorking(creep) {
  if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
    creep.memory.working = false;
    creep.say('🔄 energy');
  }
  if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
    creep.memory.working = true;
    creep.say('🚧 build');
  }
}

module.exports = {
  run(creep) {
    setWorking(creep);

    if (creep.memory.working) {
      const site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
      if (site) {
        if (creep.build(site) === ERR_NOT_IN_RANGE) {
          creep.moveTo(site, { visualizePathStyle: { stroke: '#ffffff' } });
        }
      } else {
        // Nothing to build? Repair something small, then upgrade.
        const fix = creep.pos.findClosestByPath(FIND_STRUCTURES, {
          filter: s =>
            s.hits < s.hitsMax &&
            s.structureType !== STRUCTURE_WALL &&
            s.structureType !== STRUCTURE_RAMPART
        });
        if (fix) {
          if (creep.repair(fix) === ERR_NOT_IN_RANGE) {
            creep.moveTo(fix);
          }
        } else if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
          creep.moveTo(creep.room.controller);
        }
      }
    } else {
      const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
      });
      if (container) {
        if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) creep.moveTo(container);
      } else {
        const src = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
        if (src && creep.harvest(src) === ERR_NOT_IN_RANGE) creep.moveTo(src);
      }
    }
  }
};
