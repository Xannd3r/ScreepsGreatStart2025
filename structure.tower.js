module.exports = {
  run(room) {
    const towers = room.find(FIND_MY_STRUCTURES, { filter: s => s.structureType === STRUCTURE_TOWER });
    for (const t of towers) {
      // 1) Hostiles
      const hostile = t.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
      if (hostile) { t.attack(hostile); continue; }

      // 2) Heal wounded
      const wounded = t.pos.findClosestByRange(FIND_MY_CREEPS, { filter: c => c.hits < c.hitsMax });
      if (wounded) { t.heal(wounded); continue; }

      // 3) Light repairs (avoid dumping all energy into walls)
      const target = t.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: s =>
          s.hits < s.hitsMax &&
          s.structureType !== STRUCTURE_WALL &&
          s.structureType !== STRUCTURE_RAMPART
      });
      if (target) t.repair(target);
    }
  }
};
