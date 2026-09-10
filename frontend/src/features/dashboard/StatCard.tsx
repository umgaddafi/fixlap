import { ArrowUpRight, type LucideIcon } from 'lucide-react';
export default function StatCard({ icon: Icon, label, value, note, tone, onClick }: {
  icon: LucideIcon; label: string; value: string; note: string; tone: string; onClick?: () => void;
}) {
  return <button className="staff-stat" onClick={onClick}><div className="staff-stat-top"><span className={`staff-stat-icon ${tone}`}><Icon size={20}/></span><ArrowUpRight size={17}/></div><span className="staff-stat-label">{label}</span><strong>{value}</strong><span className={`staff-stat-note ${tone}`}>{note}</span></button>;
}
