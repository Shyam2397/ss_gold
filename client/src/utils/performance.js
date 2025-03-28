export const metrics = {
  routeLoadTimes: new Map(),
  marks: new Map()
};

export const markRouteStart = (route) => {
  const markName = `route-${route}`;
  performance.mark(markName);
  metrics.marks.set(route, markName);
};

export const measureRouteLoad = (route) => {
  const markName = metrics.marks.get(route);
  if (markName) {
    performance.measure(`load-${route}`, markName);
    const entries = performance.getEntriesByName(`load-${route}`);
    metrics.routeLoadTimes.set(route, entries[0].duration);
  }
};
