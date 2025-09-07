function setWorking(creep) {
  if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
    creep.memory.working = false;
    creep.say('🔄 energy');
  }
  if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
    creep.memory.working = true;
    creep.say('⚡ upgrade');
  }
}

module.exports = {
  run(creep) {
    setWorking(creep);

    if (creep.memory.working) {
      if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
      }
    } else {
      // Prefer container if available; else harvest
      const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
      });
      if (container) {
        if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
      } else {
        const src = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
        if (src && creep.harvest(src) === ERR_NOT_IN_RANGE) {
          creep.moveTo(src, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
      }
    }
  }
};
