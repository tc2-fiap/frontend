interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
}

export function Skeleton({ width = '100%', height = 14, radius }: SkeletonProps) {
  return <span className="skeleton" style={{ width, height, borderRadius: radius }} />;
}

export function SkeletonGameCard() {
  return (
    <div className="card game-card">
      <span className="skeleton skeleton-cover" />
      <Skeleton width="70%" height={18} />
      <div style={{ marginTop: 8 }}>
        <Skeleton width="50%" />
      </div>
      <div style={{ marginTop: 8 }}>
        <Skeleton width="35%" />
      </div>
      <div style={{ marginTop: 12 }}>
        <Skeleton width="100%" height={36} radius="var(--radius)" />
      </div>
    </div>
  );
}

interface SkeletonTableRowsProps {
  rows: number;
  columns: number;
}

export function SkeletonTableRows({ rows, columns }: SkeletonTableRowsProps) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex}>
              <Skeleton width={colIndex === 0 ? '60%' : '80%'} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

interface SkeletonCardProps {
  lines: number;
}

export function SkeletonCard({ lines }: SkeletonCardProps) {
  const widths = ['90%', '75%', '60%', '85%', '50%'];
  return (
    <div className="card">
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} style={{ marginBottom: index === lines - 1 ? 0 : 10 }}>
          <Skeleton width={widths[index % widths.length]} />
        </div>
      ))}
    </div>
  );
}
