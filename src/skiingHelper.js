import R from "ramda";

const max = R.reduce(R.max, -Infinity);

export function parseToSkiMap(responseText) {
  const values = responseText.split(/[\s]/g).map(value => parseInt(value, 10));

  return {
    x: values[0],
    y: values[1],
    skiMap: values.slice(2, values.length - 1)
  };
}

/**
 * Get longest steepest path from the map to ski
 * @param Array skiMap
 * @param Number x
 * @param Number y
 */
export function getLongestSteepestPath({ x, y, skiMap }) {
  // find the roots, which have no lower elevation in surroundings
  const rootIndices = getRootIndices(skiMap, x, y);

  console.log(`Found ${rootIndices.length} roots`);

  console.log("Initiating a Directed Acyclic Graph from roots...");

  // initiate a Directed Acyclic Graph (DAG) with roots only
  const dag = initDag(rootIndices);

  console.log("DAG initiated:", dag);
  console.log("Filling DAG...");

  // fill the graph
  Object.keys(dag).forEach((rootIndex, i) => {
    console.log(`\tFilling dag from root ${i}/${rootIndices.length}`);
    fillDagFromSkiMap(dag, rootIndex, skiMap, x, y);
  });

  console.log("1 root of Directed Acyclic Graph", dag[rootIndices[0]]);

  // Topological Sorting
  const topologicallySortedOrder = getTopologicallySortedOrder(
    dag,
    rootIndices
  );

  console.log(
    "first 100 Topology Sorted Order",
    topologicallySortedOrder.slice(0, 100)
  );

  // find longest path from each root
  const longestPathsInEachRoots = getLongestPathsByEachRoots(
    rootIndices,
    dag,
    topologicallySortedOrder,
    skiMap
  );

  console.log("longest paths in each roots", longestPathsInEachRoots);

  const longestPaths = getMaxDistanceFromRoots(longestPathsInEachRoots);

  console.log("longest paths", longestPaths);

  const steepestPaths = getSteepestPaths(longestPaths, skiMap);
  // find steepest path from longest paths

  console.log("steepest path", steepestPaths);

  return steepestPaths;
}

/**
 * 
 * longestPaths = [ {
        "fromNodeIndex": 0,
        "toNodeIndex": 5,
        "maxDist": 5,
        "path": [
          0,
          2,
          3,
          4,
          5
        ]
      }]
 */
export function getSteepestPaths(longestPaths, skiMap) {
  const paths = R.chain(path => {
    return path.paths;
  }, longestPaths).map(path => {
    return {
      steep: skiMap[path[0]] - skiMap[path[path.length - 1]],
      path
    };
  });

  const maxSteep = max(paths.map(path => path.steep));
  return paths
    .filter(path => {
      return path.steep === maxSteep;
    })
    .map(path => {
      return {
        drop: path.steep,
        pathLength: path.path.length,
        pathIndex: path.path,
        pathValue: path.path.map(pathIndex => skiMap[pathIndex])
      };
    });
}

export function getMaxDistanceFromRoots(longestPathsByEachRoots) {
  const maxDistance = max(
    longestPathsByEachRoots.map(item => item.maxDistance)
  );
  return longestPathsByEachRoots.filter(
    item => item.maxDistance === maxDistance
  );
}

/**
 *
 * @param {*} rootIndices
 * @param {*} dag
 * @param {*} topologicallySortedOrder
 */
export function getLongestPathsByEachRoots(
  rootIndices,
  dag,
  topologicallySortedOrder,
  skiMap
) {
  let i = 0;
  return R.chain(rootIndex => {
    console.log(
      `${i++}/${rootIndices.length -
        1}. Finding max distance and paths for skiMap[${rootIndex}]=${
        skiMap[rootIndex]
      }`
    );
    return findMaxDistanceAndPaths(
      rootIndex,
      dag,
      topologicallySortedOrder,
      skiMap
    );
  }, rootIndices);
}

/**
 * Get indices of all roots, which have no lower elevation in surroundings
 * @param Array skiMap
 * @param Number x
 * @param Number y
 */
export function getRootIndices(skiMap, x, y) {
  return skiMap.map((_, i) => i).filter(index => {
    return hasNoIncommingPath(index, skiMap, x, y);
  });
}

/**
 * Initiate a Directed Acyclic Graph (DAG) with roots only
 * @param Array rootIndices
 */
export function initDag(rootIndices) {
  return rootIndices.reduce((acc, val, i) => {
    console.log(`\t[initDag]Handling root indices ${i}/${rootIndices.length}`);
    return Object.assign({}, acc, { [val]: [] });
  }, {});
}

/**
 * https://www.geeksforgeeks.org/find-longest-path-directed-acyclic-graph/
 */

export function findMaxDistanceAndPaths(
  nodeIndex,
  dag,
  topologicallySortedOrder,
  skiMap,
  getEdge
) {
  const distances = skiMap.map(
    (_, skiMapNodeIndex) => (skiMapNodeIndex === nodeIndex ? 0 : -Infinity)
  );
  let fromNodes = skiMap.map((_, skiMapNodeIndex) => undefined);
  topologicallySortedOrder.forEach(nodeIndex => {
    dag[nodeIndex].forEach(adjNodeIndex => {
      const nextDist =
        distances[nodeIndex] + (getEdge ? getEdge(nodeIndex, adjNodeIndex) : 1);
      if (distances[adjNodeIndex] < nextDist) {
        distances[adjNodeIndex] = nextDist;
        fromNodes[adjNodeIndex] = nodeIndex;
      }
    });
  });

  const maxDistance = max(distances);
  const paths = getFullPaths(fromNodes, nodeIndex);
  const pathsOfMaxDistance = paths
    .map((path, index) => {
      if (distances[index] === maxDistance) return path;
      return null;
    })
    .filter(path => path);

  const result = {
    maxDistance,
    paths: pathsOfMaxDistance
  };
  console.log("\tfound max distance and path:", result);
  return result;
}

const MAX_LOOP = 10000;
export function getFullPath(toNodeIndex, fromNodes, startNodeIndex) {
  if (!fromNodes[toNodeIndex]) return [];
  let fullPath = [toNodeIndex];
  let flag = 0;
  while (fullPath[0] !== startNodeIndex && flag++ < MAX_LOOP) {
    fullPath = [fromNodes[fullPath[0]], ...fullPath];
  }
  return fullPath;
}

export function getFullPaths(fromNodes, startNodeIndex) {
  return fromNodes.map((fromNode, toNodeIndex) => {
    const fullPath = getFullPath(toNodeIndex, fromNodes, startNodeIndex);
    return fullPath;
  });
}

/**
 * Kahn's algorithm
 */
export function getTopologicallySortedOrder(_dag, rootIndices) {
  const dag = Object.assign({}, _dag);
  const L = [];
  const S = [...rootIndices];

  while (S.length) {
    console.log(`[getTSO()]S.length=${S.length}, L.length=${L.length}/1000000`);
    const n = S.pop();
    L.push(n);
    const adjacentNodeIndices = dag[n];
    dag[n] = [];
    adjacentNodeIndices.forEach((nodeIndex, i) => {
      console.log(
        `\t[getTSO()]Handling adjacent node index ${i}/${
          adjacentNodeIndices.length
        }`
      );
      if (!hasIncommingEdgeInDag(nodeIndex, dag)) {
        S.push(nodeIndex);
      }
    });
  }
  return L;
}

function hasIncommingEdgeInDag(nodeIndex, dag) {
  return !!Object.values(dag).find(nodeIndices =>
    nodeIndices.includes(nodeIndex)
  );
}

export function fillDagFromSkiMap(dag, _index, skiMap, x, y) {
  const index = parseInt(_index, 10);
  const surroundings = getNewsSurroundings(index, skiMap, x, y);
  const skiableSurroundings = surroundings.filter(s => s[1] < skiMap[index]);
  const skiableSurroundingIndices = skiableSurroundings.map(s => s[0]);

  dag[index] = skiableSurroundingIndices;
  if (dag[index].length) {
    dag[index].forEach(index => {
      fillDagFromSkiMap(dag, index, skiMap, x, y);
    });
  }
}

export function hasNoIncommingPath(index, skiMap, x, y) {
  const surroundings = getNewsSurroundings(index, skiMap, x, y);
  return surroundings
    .map(s => s[1])
    .every(surroundingElevation => surroundingElevation <= skiMap[index]);
}

/**
 * Get North, South, East, West Surroundings
 * @param Number index
 * @param Array skiMap
 * @param Number x
 * @param Number y
 */
export function getNewsSurroundings(index, skiMap, x, y) {
  let result;
  if (isLeftEdge(index, x, y) && isTopEdge(index, x)) {
    result = [[index + 1, skiMap[index + 1]], [index + x, skiMap[index + x]]];
  } else if (isTopEdge(index, x) && isRightEdge(index, x, y)) {
    result = [[index - 1, skiMap[index - 1]], [index + x, skiMap[index + x]]];
  } else if (isBottomEdge(index, x, y) && isRightEdge(index, x, y)) {
    result = [[index - x, skiMap[index - x]], [index - 1, skiMap[index - 1]]];
  } else if (isBottomEdge(index, x, y) && isLeftEdge(index, x, y)) {
    result = [[index - x, skiMap[index - x]], [index + 1, skiMap[index + 1]]];
  } else if (isTopEdge(index, x)) {
    result = [
      [index - 1, skiMap[index - 1]],
      [index + 1, skiMap[index + 1]],
      [index + x, skiMap[index + x]]
    ];
  } else if (isRightEdge(index, x, y)) {
    result = [
      [index - x, skiMap[index - x]],
      [index - 1, skiMap[index - 1]],
      [index + x, skiMap[index + x]]
    ];
  } else if (isBottomEdge(index, x, y)) {
    result = [
      [index - x, skiMap[index - x]],
      [index - 1, skiMap[index - 1]],
      [index + 1, skiMap[index + 1]]
    ];
  } else if (isLeftEdge(index, x, y)) {
    result = [
      [index - x, skiMap[index - x]],
      [index + 1, skiMap[index + 1]],
      [index + x, skiMap[index + x]]
    ];
  } else {
    result = [
      [index - x, skiMap[index - x]],
      [index - 1, skiMap[index - 1]],
      [index + 1, skiMap[index + 1]],
      [index + x, skiMap[index + x]]
    ];
  }

  return result;
}

function isLeftEdge(index, x, y) {
  // 0 + k*4 (k = 0, 1, 2, ..., y - 1)
  return index % x === 0 && 0 <= index && index <= (y - 1) * 4;
}
function isTopEdge(index, x) {
  return 0 <= index && index < x;
}
function isRightEdge(index, x, y) {
  // (k+1)x - 1 (k = 0, 1, 2, ..., y-1)
  return index % x === x - 1 && x - 1 <= index && index <= x * y - 1;
}
function isBottomEdge(index, x, y) {
  // 0 + (y-1)x , 1 + (y-1)x, ..., (x-1) + (y-1)x
  return (y - 1) * x <= index && index <= x * y - 1;
}
