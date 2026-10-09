import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export function MathStatement({ statement }) {
  if (!statement) return null;

  return (
    <div
      id="problem-statement"
      className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 mb-6 text-slate-100 shadow-lg"
    >
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-indigo-400">
        <span>Enunciado del Ejercicio</span>
      </div>
      <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed overflow-x-auto">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {statement}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export default MathStatement;
