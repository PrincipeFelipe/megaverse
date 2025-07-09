/**
 * Script para crear una versión alternativa con mayor contraste
 */

// Opción 1: Cards con fondo blanco y bordes coloridos
const AlternativeCard1 = `
<Card className="bg-white border-l-4 border-l-blue-500 shadow-lg">
  <div className="p-6">
    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">{title}</h3>
    <p className="text-3xl lg:text-4xl font-black text-gray-900 mb-1">{value}</p>
    {subtitle && <p className="text-sm font-semibold text-gray-700">{subtitle}</p>}
  </div>
</Card>
`;

// Opción 2: Cards con fondos sólidos más oscuros
const AlternativeCard2 = `
// Para Total recaudado
className="bg-slate-200 border-slate-400 text-slate-900"

// Para Cuotas normales  
className="bg-emerald-200 border-emerald-400 text-emerald-900"

// Para Cuotas mantenimiento
className="bg-violet-200 border-violet-400 text-violet-900"

// Para Cuotas de entrada
className="bg-amber-200 border-amber-400 text-amber-900"
`;

// Opción 3: Cards completamente rediseñadas
const AlternativeCard3 = `
<div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
  <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
  <div className="p-6">
    <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">{title}</h3>
    <p className="text-4xl font-black text-gray-900 mb-2">{value}</p>
    {subtitle && <p className="text-sm font-medium text-gray-600">{subtitle}</p>}
  </div>
</div>
`;

console.log('Alternativas de diseño preparadas');
