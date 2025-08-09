export default function ResponsiveContainer({ children }: { children: React.ReactNode }) {
  return <div className="container mx-auto px-4">{children}</div>;
}