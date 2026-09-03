'use strict';

function workUnitDeclarations(ids) {
  return [...new Set(ids)].flatMap((id) => {
    if (!/^[A-Za-z0-9._:-]{1,120}$/.test(id)) throw new Error(`invalid fixture work-unit id: ${id}`);
    return ['', `## Work Unit ${id}`, ''];
  });
}

module.exports = { workUnitDeclarations };
