import React from 'react';
import { Shield, BookOpen, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="text-white font-bold text-base">AI Cricket Laws Assistant</span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              A high-precision, source-grounded Retrieval-Augmented Generation (RAG) assistant for cricket laws, ICC playing conditions, and umpiring decisions. Every factual law claim is validated against official rulebooks.
            </p>
            <div className="text-[11px] text-slate-500">
              Rule interpretation disclaimer: This system provides source-grounded guidance based on written laws and official playing conditions. Match umpires hold final discretionary authority on the field of play.
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Approved Sources</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a 
                  href="https://www.lords.org/mcc/the-laws-of-cricket" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-emerald-400 flex items-center space-x-1.5 transition-colors"
                >
                  <span>MCC Laws of Cricket</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a 
                  href="https://www.icc-cricket.com/about/cricket/rules-and-regulations/playing-conditions" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-emerald-400 flex items-center space-x-1.5 transition-colors"
                >
                  <span>ICC Playing Conditions</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a 
                  href="https://www.icc-cricket.com/news/key-documents-x8506" 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-emerald-400 flex items-center space-x-1.5 transition-colors"
                >
                  <span>ICC Key Regulations</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Capabilities</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Evidence-grounded RAG</li>
              <li>Traceable Clause Citations</li>
              <li>Match Scenario Reasoning</li>
              <li>Dynamic Law Quizzes</li>
              <li>Vector & Lexical Hybrid Search</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} AI Cricket Laws Assistant. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 font-mono text-[11px]">Strict Citation & Versioning Pipeline Enabled</p>
        </div>
      </div>
    </footer>
  );
}
