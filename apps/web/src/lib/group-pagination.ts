export type GroupPage = { page: number; size: number; pages: number; start: number; end: number };

export function groupPage(total: number, size: number, page: number): GroupPage {
  const capacity = Math.max(1, Math.floor(size));
  const pages = Math.max(1, Math.ceil(total / capacity));
  const current = Math.max(0, Math.min(page, pages - 1));
  return {
    page: current,
    size: capacity,
    pages,
    start: current * capacity,
    end: Math.min(total, (current + 1) * capacity),
  };
}

export function fitGroupPage(
  previous: GroupPage,
  total: number,
  height: number,
  rowHeight: number,
  reserved: number,
  anchor: number,
): GroupPage {
  const size = Math.max(1, Math.floor((height - reserved) / rowHeight));
  const visibleAnchor = anchor >= previous.start && anchor < previous.end;
  const first = visibleAnchor ? anchor : previous.start;
  return groupPage(total, size, size === previous.size ? previous.page : Math.floor(first / size));
}
