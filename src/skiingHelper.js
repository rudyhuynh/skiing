import R from "ramda";
import { logOneLine } from "./logUtils";

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

  console.log(
    `Found ${rootIndices.length} root. Finding longest paths in each roots...`
  );

  const longestPathsInEachRoots = rootIndices.map(
    getLongestPathsFromRoot(skiMap, x, y)
  );

  console.log(
    `Found ${longestPathsInEachRoots.length} longest paths in ${
      rootIndices.length
    } roots`
  );

  const longestPaths = getLongestPathsOfAllRoots(longestPathsInEachRoots);

  console.log(`Found ${longestPaths.length} longest paths`);
  console.log("longest paths", longestPaths);
  const steepestPaths = getSteepestPaths(longestPaths, skiMap);
  // find steepest path from longest paths

  console.log("steepest path", steepestPaths);

  return steepestPaths;
}

const getLongestPathsFromRoot = (skiMap, x, y) => (
  rootIndex,
  _,
  rootIndices
) => {
  logOneLine(
    `${_ + 1}/${rootIndices.length} (${Math.round(
      (_ + 1) / rootIndices.length * 100
    )}%)`
  );
  const dag = { [rootIndex]: [] };

  fillDagFromSkiMap(dag, rootIndex, skiMap, x, y);

  const topologicallySortedOrder = getTopologicallySortedOrder(dag, rootIndex);

  const maxDistanceAndPaths = findMaxDistanceAndPathsOfRootIndex(
    rootIndex,
    dag,
    topologicallySortedOrder
  );

  return maxDistanceAndPaths;
};

export function getSteepestPaths(longestPaths, skiMap) {
  const paths = longestPaths.map(({ maxDistance, path }) => {
    return {
      drop: skiMap[path[0]] - skiMap[path[path.length - 1]],
      path,
      maxDistance
    };
  });

  const maxDrop = max(paths.map(path => path.drop));
  return paths
    .filter(({ drop }) => {
      return drop === maxDrop;
    })
    .map(({ drop, maxDistance, path }) => {
      return {
        drop,
        maxDistance,
        pathLength: path.length,
        pathIndices: path,
        pathValues: path.map(pathIndex => skiMap[pathIndex])
      };
    });
}

export function getLongestPathsOfAllRoots(longestPathsByEachRoots) {
  const maxDistance = max(
    longestPathsByEachRoots.map(item => item.maxDistance)
  );
  const pathsWithMaxDistance = longestPathsByEachRoots.filter(
    item => item.maxDistance === maxDistance
  );
  //flatten the paths
  return R.chain(maxDistancePaths => {
    return maxDistancePaths.paths.map(path => {
      return {
        maxDistance: maxDistancePaths.maxDistance,
        path
      };
    });
  }, pathsWithMaxDistance);
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
 * https://www.geeksforgeeks.org/find-longest-path-directed-acyclic-graph/
 */
export function findMaxDistanceAndPathsOfRootIndex(
  nodeIndex,
  dag,
  tso,
  getEdge
) {
  // TODO -
  const distances = tso.reduce(
    (acc, skiMapNodeIndex) =>
      Object.assign({}, acc, {
        [skiMapNodeIndex]: skiMapNodeIndex === nodeIndex ? 0 : -Infinity
      }),
    {}
  );
  let fromNodes = tso.reduce(
    (acc, skiMapNodeIndex) =>
      Object.assign({}, acc, {
        [skiMapNodeIndex]: null
      }),
    {}
  );
  tso.forEach(nodeIndex => {
    dag[nodeIndex].forEach(adjNodeIndex => {
      const nextDist =
        distances[nodeIndex] + (getEdge ? getEdge(nodeIndex, adjNodeIndex) : 1);
      if (distances[adjNodeIndex] < nextDist) {
        distances[adjNodeIndex] = nextDist;
        fromNodes[adjNodeIndex] = nodeIndex;
      }
    });
  });

  const maxDistance = max(Object.values(distances));

  const paths = getFullPaths(fromNodes, nodeIndex);

  const pathsOfMaxDistance = Object.keys(paths)
    .map(_index => {
      const index = parseInt(_index, 10);
      if (distances[index] === maxDistance) return paths[index];
      return null;
    })
    .filter(path => path);

  const result = {
    maxDistance,
    paths: pathsOfMaxDistance
  };
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
  return (
    Object.keys(fromNodes)
      .map(currentNodeIndex => {
        // get full path from 'startNodeIndex' to current node
        const fullPath = getFullPath(
          parseInt(currentNodeIndex, 10),
          fromNodes,
          startNodeIndex
        );
        return [currentNodeIndex, fullPath];
      })
      // combine array into an object:
      .reduce(
        (acc, val) =>
          Object.assign({}, acc, {
            [val[0]]: val[1]
          }),
        {}
      )
  );
}

/**
 * Kahn's algorithm
 * Returns an array of indices
 */
export function getTopologicallySortedOrder(_dag, rootIndex) {
  const dag = Object.assign({}, _dag);
  const L = [];
  const S = [rootIndex];

  while (S.length) {
    //logOneLine(`[getTSO()]S.length=${S.length}, L.length=${L.length}`);
    const n = S.pop();
    L.push(n);
    const adjacentNodeIndices = dag[n];
    dag[n] = [];
    adjacentNodeIndices.forEach((nodeIndex, i) => {
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
