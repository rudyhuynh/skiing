import * as skiingHelper from "./skiingHelper";
//import R from "ramda";
import { x, y, skiMap, rootIndices } from "./__testdaga__/inputs";

test("getNewsSurroundings()", () => {
  //top left
  expect(skiingHelper.getNewsSurroundings(0, skiMap, x, y)).toEqual([
    [1, 8],
    [4, 2]
  ]);
  //top right
  expect(skiingHelper.getNewsSurroundings(3, skiMap, x, y)).toEqual([
    [2, 7],
    [7, 3]
  ]);
  // bottom right
  expect(skiingHelper.getNewsSurroundings(15, skiMap, x, y)).toEqual([
    [11, 5],
    [14, 1]
  ]);
  // bottom left
  expect(skiingHelper.getNewsSurroundings(12, skiMap, x, y)).toEqual([
    [8, 6],
    [13, 4]
  ]);
  // top
  expect(skiingHelper.getNewsSurroundings(1, skiMap, x, y)).toEqual([
    [0, 4],
    [2, 7],
    [5, 5]
  ]);
  // right
  expect(skiingHelper.getNewsSurroundings(7, skiMap, x, y)).toEqual([
    [3, 3],
    [6, 9],
    [11, 5]
  ]);
  // bottom
  expect(skiingHelper.getNewsSurroundings(13, skiMap, x, y)).toEqual([
    [9, 3],
    [12, 4],
    [14, 1]
  ]);
  // left
  expect(skiingHelper.getNewsSurroundings(4, skiMap, x, y)).toEqual([
    [0, 4],
    [5, 5],
    [8, 6]
  ]);
  // mid
  expect(skiingHelper.getNewsSurroundings(5, skiMap, x, y)).toEqual([
    [1, 8],
    [4, 2],
    [6, 9],
    [9, 3]
  ]);
});

test("hasNoIncommingPath()", () => {
  expect(skiingHelper.hasNoIncommingPath(13, skiMap, x, y)).toBe(true);
});

test("getRootIndices()", () => {
  expect(skiingHelper.getRootIndices(skiMap, x, y)).toEqual(rootIndices);
});

test("fillDagFromSkiMap()", () => {
  const aRootIndex = 1;
  const dag = { [aRootIndex]: [] };
  const expectedDag = {
    1: [0, 2, 5],
    0: [4],
    2: [3],
    5: [4, 9],
    4: [],
    3: [],
    9: [10],
    10: [14],
    14: []
  };

  skiingHelper.fillDagFromSkiMap(dag, aRootIndex, skiMap, x, y);

  expect(dag).toEqual(expectedDag);
});

describe("getTopologicallySortedOrder()", () => {
  test("getTopologicallySortedOrder(dag, 1)", () => {
    const dag = {
      1: [0, 2, 5],
      0: [4],
      2: [3],
      5: [4, 9],
      4: [],
      3: [],
      9: [10],
      10: [14],
      14: []
    };
    const expectedTopologySortedOrder = [1, 5, 9, 10, 14, 2, 3, 0, 4];

    const topologicallySortedOrder = skiingHelper.getTopologicallySortedOrder(
      dag,
      1
    );
    expect(topologicallySortedOrder).toEqual(expectedTopologySortedOrder);
  });
});

describe("findMaxDistanceAndPathsOfRootIndex()", () => {
  test("findMaxDistanceAndPathsOfRootIndex(1, ...)", () => {
    const dag = {
      1: [0, 2, 5],
      0: [4],
      2: [3],
      5: [4, 9],
      4: [],
      3: [],
      9: [10],
      10: [14],
      14: []
    };
    const tso = [1, 5, 9, 10, 14, 2, 3, 0, 4];

    expect(
      skiingHelper.findMaxDistanceAndPathsOfRootIndex(1, dag, tso)
    ).toMatchSnapshot();
  });
});

test("getFullPath()", () => {
  const startNodeIndex = 1;
  const fromNodes = {
    1: null,
    5: 1,
    9: 5,
    10: 9,
    14: 10,
    2: null,
    3: null,
    0: null,
    4: null
  };
  const fullPathOfIndex1 = skiingHelper.getFullPath(
    14,
    fromNodes,
    startNodeIndex
  );
  expect(fullPathOfIndex1).toEqual([1, 5, 9, 10, 14]);
});

test("getFullPaths()", () => {
  const fromNodes = {
    1: null,
    5: 1,
    9: 5,
    10: 9,
    14: 10,
    2: null,
    3: null,
    0: null,
    4: null
  };
  const expected = {
    1: [],
    5: [1, 5],
    9: [1, 5, 9],
    10: [1, 5, 9, 10],
    14: [1, 5, 9, 10, 14],
    2: [],
    3: [],
    0: [],
    4: []
  };
  const fullPaths = skiingHelper.getFullPaths(fromNodes, 1);
  expect(fullPaths).toEqual(expected);
});

test("getLongestSteepestPath()", () => {
  expect(
    skiingHelper.getLongestSteepestPath({ skiMap, x, y })
  ).toMatchSnapshot();
});

test("getSteepestPaths()", () => {
  const longestPaths = [
    { maxDistance: 4, path: [1, 5, 9, 10, 14] },
    { maxDistance: 4, path: [6, 5, 9, 10, 14] }
  ];
  const expected = [
    {
      maxDistance: 4,
      drop: 8,
      pathLength: 5,
      pathIndices: [6, 5, 9, 10, 14],
      pathValues: [9, 5, 3, 2, 1]
    }
  ];

  expect(skiingHelper.getSteepestPaths(longestPaths, skiMap)).toEqual(expected);
});
