// src/components/Pagination.tsx
interface Props {
  page: number;
  limit: number;
  total: number;
  onPage: (page: number) => void;
}

export default function Pagination({ page, limit, total, onPage }: Props) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) {
    return (
      <div className="text-xs text-slate-500 mt-3">
        {total} record{total === 1 ? "" : "s"}
      </div>
    );
  }
  const from = (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);
  return (
    <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
      <div className="text-xs text-slate-500">
        Showing {from}–{to} of {total}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="btn-secondary px-3 py-1.5"
        >
          Prev
        </button>
        <span className="text-sm px-2">
          Page {page} / {pages}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          className="btn-secondary px-3 py-1.5"
        >
          Next
        </button>
      </div>
    </div>
  );
}
