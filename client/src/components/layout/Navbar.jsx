import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  MessageSquare, 
  Search, 
  HelpCircle, 
  Compass, 
  FileText, 
  Menu, 
  X,
  Activity
} from 'lucide-react';
import api from '../../services/api';

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [systemHealthy, setSystemHealthy] = useState(null);

  useEffect(() => {
    let isMounted = true;
    api.get('/health/ready')
      .then((res) => {
        if (isMounted) setSystemHealthy(res.data.status === 'ok');
      })
      .catch(() => {
        if (isMounted) setSystemHealthy(false);
      });
    return () => { isMounted = false; };
  }, []);

  const navLinks = [
    { name: 'Adjudication', path: '/chat', icon: MessageSquare },
    { name: 'Scenario Analyser', path: '/scenarios', icon: Compass },
    { name: 'Law Search', path: '/search', icon: Search },
    { name: 'Umpire Assessment', path: '/quiz', icon: HelpCircle },
    { name: 'Official Knowledge Base', path: '/admin/documents', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-emerald-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-900 flex items-center justify-center shadow-lg shadow-emerald-900/30 border border-emerald-500/30 group-hover:scale-105 transition-transform duration-200">
              <ShieldCheck className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight group-hover:text-emerald-400 transition-colors">
                  Cric<span className="text-emerald-400">Laws</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">
                  OFFICIAL DESK
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Laws of Cricket & Match Playing Conditions Reference</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* System Status Indicator & Auth Link */}
          <div className="hidden md:flex items-center space-x-3">
            <div 
              title={systemHealthy === null ? 'Checking system readiness...' : systemHealthy ? 'RAG Engine & Database Connected' : 'Database/API degraded'}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-slate-950 border border-slate-800"
            >
              <Activity className={`w-3.5 h-3.5 ${
                systemHealthy === null ? 'text-slate-500 animate-pulse' :
                systemHealthy ? 'text-emerald-400 animate-pulse' : 'text-amber-400'
              }`} />
              <span className={systemHealthy ? 'text-emerald-400' : 'text-slate-400'}>
                {systemHealthy === null ? 'SYNC' : systemHealthy ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
            
            <Link
              to="/login"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-700/80 text-white hover:bg-emerald-600 transition-colors border border-emerald-600/40"
            >
              Account
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-emerald-950 bg-slate-900/95 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-400">RAG Engine:</span>
            <span className={`text-xs font-mono font-bold ${systemHealthy ? 'text-emerald-400' : 'text-amber-400'}`}>
              {systemHealthy ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
