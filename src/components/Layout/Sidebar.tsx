import React from 'react';
import { 
  LayoutDashboard, 
  HardDrive, 
  KeyRound, 
  Headphones, 
  Beaker, 
  Cpu, 
  Package, 
  Users, 
  Upload, 
  Settings, 
  FileText, 
  ShoppingCart,
  ChevronLeft,
  AlertTriangle,
  Shield,
  Calendar,
  DollarSign,
  BarChart3,
  Database,
  Link
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'assets', label: 'Assets', icon: HardDrive },
  { id: 'licenses', label: 'Licenses', icon: KeyRound },
  { id: 'accessories', label: 'Accessories', icon: Headphones },
  { id: 'consumables', label: 'Consumables', icon: Beaker },
  { id: 'components', label: 'Components', icon: Cpu },
  { id: 'people', label: 'People', icon: Users },
  { id: 'requestable-items', label: 'Requestable Items', icon: ShoppingCart },
  { id: 'predefined-kits', label: 'Predefined Kits', icon: Package },
  { id: 'alerts', label: 'Alerts & Notifications', icon: AlertTriangle },
  { id: 'compliance', label: 'Compliance & Audits', icon: Shield },
  { id: 'maintenance', label: 'Maintenance & Repairs', icon: Calendar },
  { id: 'financial', label: 'Financial Management', icon: DollarSign },
  { id: 'analytics', label: 'Analytics & Insights', icon: BarChart3 },
  { id: 'integrations', label: 'Integrations', icon: Link },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'import', label: 'Import', icon: Upload },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeSection, onSectionChange, isOpen, onToggle }: SidebarProps) {
  return (
    <div className={`bg-slate-800 text-white transition-all duration-300 ${isOpen ? 'w-64' : 'w-16'} min-h-screen flex flex-col fixed left-0 top-0 z-40 shadow-lg`}>
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        {isOpen && <h1 className="text-xl font-bold">AssetFlow</h1>}
        <button
          onClick={onToggle}
          className="p-2 hover:bg-slate-700 rounded-md transition-colors duration-200"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${isOpen ? '' : 'rotate-180'}`} />
        </button>
      </div>
      
      <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center px-4 py-3 text-left hover:bg-slate-700 transition-all duration-200 group ${
                isActive ? 'bg-slate-700 border-r-4 border-blue-500 text-blue-300' : 'text-slate-300 hover:text-white'
              }`}
              title={isOpen ? '' : item.label}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
                isActive ? 'text-blue-300' : 'text-slate-400 group-hover:text-white'
              }`} />
              {isOpen && (
                <span className={`ml-3 transition-colors duration-200 ${
                  isActive ? 'text-blue-300' : 'text-slate-300 group-hover:text-white'
                }`}>
                  {item.label}
                </span>
              )}
              {!isOpen && isActive && (
                <div className="absolute left-16 bg-slate-700 text-white px-2 py-1 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>
      
      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-700">
        {isOpen ? (
          <div className="text-xs text-slate-400 text-center">
            <p>AssetFlow v2.0</p>
            <p>© 2025 IT Management</p>
          </div>
        ) : (
          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center mx-auto">
            <Database className="w-4 h-4 text-slate-400" />
          </div>
        )}
      </div>
    </div>
  );
}