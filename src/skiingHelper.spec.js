import * as skiingHelper from "./skiingHelper";
import R from "ramda";
import {
  x,
  y,
  skiMap,
  rootIndices,
  initializedDag,
  filledDag
} from "./__testdaga__/inputs";

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

test("initDag()", () => {
  expect(skiingHelper.initDag(rootIndices)).toEqual(initializedDag);
});

test("fillDagFromSkiMap()", () => {
  const dag = R.clone(initializedDag);

  Object.keys(dag).forEach(index => {
    skiingHelper.fillDagFromSkiMap(dag, index, skiMap, x, y);
  });

  expect(dag).toMatchSnapshot();

  Object.keys(dag).forEach(_index => {
    const index = parseInt(_index, 10);
    const fromNodeElevation = skiMap[index];
    expect(!!fromNodeElevation || fromNodeElevation === 0).toBe(true);
    if (dag[index].length) {
      dag[index].forEach(index => {
        const toNodeElevation = skiMap[index];
        expect(!!toNodeElevation || toNodeElevation === 0).toBe(true);
        expect(fromNodeElevation > toNodeElevation).toBe(true);
      });
    }
  });
});

describe("getTopologicallySortedOrder()", () => {
  test("getTopologicallySortedOrder()", () => {
    const topologicallySortedOrder = skiingHelper.getTopologicallySortedOrder(
      filledDag,
      rootIndices
    );

    expect(topologicallySortedOrder).toMatchSnapshot();
  });

  test("getTopologicallySortedOrder([1], ...)", () => {
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
    const topologicallySortedOrder = skiingHelper.getTopologicallySortedOrder(
      dag,
      [1]
    );
    expect(topologicallySortedOrder).toMatchSnapshot();
  });
});

describe("findMaxDistanceAndPaths()", () => {
  test("findMaxDistanceAndPaths(1, ...)", () => {
    const topologicallySortedOrder = skiingHelper.getTopologicallySortedOrder(
      filledDag,
      [1, 6, 8, 13, 15]
    );

    expect(
      skiingHelper.findMaxDistanceAndPaths(
        1,
        filledDag,
        topologicallySortedOrder,
        skiMap
      )
    ).toMatchSnapshot();
  });

  test("findMaxDistanceAndPaths(6, ...)", () => {
    const topologicallySortedOrder = skiingHelper.getTopologicallySortedOrder(
      filledDag,
      [1, 6, 8, 13, 15]
    );

    expect(
      skiingHelper.findMaxDistanceAndPaths(
        6,
        filledDag,
        topologicallySortedOrder,
        skiMap
      )
    ).toMatchSnapshot();
  });
});

test("getFullPath()", () => {
  const fromNodes = [
    undefined,
    undefined,
    6,
    2,
    5,
    6,
    undefined,
    6,
    undefined,
    5,
    9,
    undefined,
    undefined,
    undefined,
    10,
    undefined
  ];
  const fullPathOfIndex6 = skiingHelper.getFullPath(14, fromNodes, 6);
  expect(fullPathOfIndex6).toEqual([6, 5, 9, 10, 14]);
});

test("getLongestSteepestPath()", () => {
  expect(
    skiingHelper.getLongestSteepestPath({ skiMap, x, y })
  ).toMatchSnapshot();
});
