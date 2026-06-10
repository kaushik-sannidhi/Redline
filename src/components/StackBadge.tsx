export function StackBadge({ stack }: { stack: string[] }) {
  if (!stack.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {stack.map((item) => (
        <span className="rounded border border-line bg-white px-3 py-1 text-sm font-semibold text-gray-700" key={item}>
          {item}
        </span>
      ))}
    </div>
  );
}
