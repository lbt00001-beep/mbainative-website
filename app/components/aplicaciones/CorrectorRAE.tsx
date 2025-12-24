'use client';

import { useState, useCallback, useRef } from 'react';
import mammoth from 'mammoth';

interface Correccion {
    id: number;
    tipo: string;
    categoria: string;
    original: string;
    sugerido: string;
    explicacion: string;
    aprobada: boolean;
}

// Reglas ortotipográficas RAE simplificadas
const REGLAS_RAE = {
    // Comillas: convertir rectas a latinas
    comillas: {
        patron: /"([^"]+)"/g,
        reemplazo: '«$1»',
        explicacion: 'RAE recomienda comillas latinas («») en español',
        categoria: 'Comillas'
    },

    // Mayúsculas incorrectas en días y meses
    mayusculas_dias: {
        patron: /\b(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)\b/g,
        reemplazo: (match: string) => match.toLowerCase(),
        explicacion: 'Los días de la semana se escriben en minúscula',
        categoria: 'Mayúsculas'
    },

    mayusculas_meses: {
        patron: /\b(Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre)\b/g,
        reemplazo: (match: string) => match.toLowerCase(),
        explicacion: 'Los meses se escriben en minúscula',
        categoria: 'Mayúsculas'
    },

    // Espacios antes de signos de puntuación
    espacio_antes_punto: {
        patron: / +\./g,
        reemplazo: '.',
        explicacion: 'No debe haber espacio antes del punto',
        categoria: 'Puntuación'
    },

    espacio_antes_coma: {
        patron: / +,/g,
        reemplazo: ',',
        explicacion: 'No debe haber espacio antes de la coma',
        categoria: 'Puntuación'
    },

    // Doble espacio
    doble_espacio: {
        patron: /  +/g,
        reemplazo: ' ',
        explicacion: 'No debe haber espacios dobles',
        categoria: 'Espaciado'
    },

    // Puntos suspensivos
    puntos_suspensivos: {
        patron: /\.{3,}/g,
        reemplazo: '…',
        explicacion: 'Usar el carácter de puntos suspensivos (…) en lugar de tres puntos',
        categoria: 'Puntuación'
    },

    // Raya de diálogo
    guion_dialogo: {
        patron: /^- /gm,
        reemplazo: '— ',
        explicacion: 'Los diálogos usan raya (—), no guion (-)',
        categoria: 'Rayas'
    },

    // Números con comas
    numero_con_coma: {
        patron: /(\d+),(\d{3})\b/g,
        reemplazo: '$1.$2',
        explicacion: 'En español se usa punto como separador de miles',
        categoria: 'Números'
    }
};

function analizarTexto(texto: string): Correccion[] {
    const correcciones: Correccion[] = [];
    let id = 0;

    for (const [nombre, regla] of Object.entries(REGLAS_RAE)) {
        const matches = texto.matchAll(regla.patron);

        for (const match of matches) {
            const original = match[0];
            const sugerido = typeof regla.reemplazo === 'function'
                ? regla.reemplazo(original)
                : original.replace(regla.patron, regla.reemplazo);

            if (original !== sugerido) {
                correcciones.push({
                    id: id++,
                    tipo: nombre,
                    categoria: regla.categoria,
                    original,
                    sugerido,
                    explicacion: regla.explicacion,
                    aprobada: true
                });
            }
        }
    }

    return correcciones;
}

function aplicarCorrecciones(texto: string, correcciones: Correccion[]): string {
    let resultado = texto;

    // Aplicar solo las correcciones aprobadas
    const aprobadas = correcciones.filter(c => c.aprobada);

    for (const corr of aprobadas) {
        resultado = resultado.replace(corr.original, corr.sugerido);
    }

    return resultado;
}

export default function CorrectorRAE() {
    const [textoOriginal, setTextoOriginal] = useState('');
    const [nombreArchivo, setNombreArchivo] = useState('');
    const [correcciones, setCorrecciones] = useState<Correccion[]>([]);
    const [textoCorregido, setTextoCorregido] = useState('');
    const [paso, setPaso] = useState<'input' | 'review' | 'result'>('input');
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.docx')) {
            setError('Por favor, selecciona un archivo .docx');
            return;
        }

        setCargando(true);
        setError('');
        setNombreArchivo(file.name);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            setTextoOriginal(result.value);
            setCargando(false);
        } catch (err) {
            console.error('Error al leer el archivo:', err);
            setError('Error al leer el archivo. Asegúrate de que sea un archivo .docx válido.');
            setCargando(false);
        }
    };

    const handleAnalizar = useCallback(() => {
        const nuevasCorrecciones = analizarTexto(textoOriginal);
        setCorrecciones(nuevasCorrecciones);
        setPaso('review');
    }, [textoOriginal]);

    const handleToggleCorreccion = (id: number) => {
        setCorrecciones(prev =>
            prev.map(c => c.id === id ? { ...c, aprobada: !c.aprobada } : c)
        );
    };

    const handleAplicar = () => {
        const resultado = aplicarCorrecciones(textoOriginal, correcciones);
        setTextoCorregido(resultado);
        setPaso('result');
    };

    const handleReset = () => {
        setTextoOriginal('');
        setNombreArchivo('');
        setCorrecciones([]);
        setTextoCorregido('');
        setPaso('input');
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCopiar = async () => {
        await navigator.clipboard.writeText(textoCorregido);
    };

    const handleDescargarTxt = () => {
        const blob = new Blob([textoCorregido], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo ? nombreArchivo.replace('.docx', '_corregido.txt') : 'texto_corregido.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Agrupar correcciones por categoría
    const correccionesPorCategoria = correcciones.reduce((acc, corr) => {
        if (!acc[corr.categoria]) acc[corr.categoria] = [];
        acc[corr.categoria].push(corr);
        return acc;
    }, {} as Record<string, Correccion[]>);

    return (
        <div className="max-w-4xl mx-auto">
            {/* Paso 1: Input */}
            {paso === 'input' && (
                <div className="space-y-6">
                    {/* Opción de subir archivo */}
                    <div className="bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-[--accent] transition-colors">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".docx"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                        />
                        <label
                            htmlFor="file-upload"
                            className="cursor-pointer flex flex-col items-center gap-4"
                        >
                            <div className="text-5xl">📄</div>
                            <div>
                                <p className="text-lg font-semibold">Sube un archivo .docx</p>
                                <p className="text-gray-400 text-sm">Haz clic aquí o arrastra tu archivo</p>
                            </div>
                            {cargando && (
                                <div className="flex items-center gap-2 text-[--accent]">
                                    <div className="animate-spin">⏳</div>
                                    <span>Cargando archivo...</span>
                                </div>
                            )}
                            {nombreArchivo && !cargando && (
                                <div className="flex items-center gap-2 text-green-400">
                                    <span>✓</span>
                                    <span>{nombreArchivo}</span>
                                </div>
                            )}
                        </label>
                    </div>

                    {error && (
                        <div className="bg-red-600/20 text-red-400 p-4 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-gray-700"></div>
                        <span className="text-gray-500">o escribe tu texto</span>
                        <div className="flex-1 h-px bg-gray-700"></div>
                    </div>

                    <div>
                        <textarea
                            value={textoOriginal}
                            onChange={(e) => setTextoOriginal(e.target.value)}
                            placeholder='Ejemplo: El Lunes de Enero dijo "hola" ...'
                            className="w-full h-48 p-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-[--accent] focus:outline-none resize-none"
                        />
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={handleAnalizar}
                            disabled={!textoOriginal.trim()}
                            className="bg-[--accent] hover:bg-[--accent]/90 disabled:opacity-50 disabled:cursor-not-allowed text-[--primary] font-bold py-3 px-8 rounded-lg transition-colors"
                        >
                            🔍 Analizar Texto
                        </button>
                    </div>

                    <div className="bg-gray-800/50 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Reglas aplicadas:</h3>
                        <ul className="text-sm text-gray-400 grid grid-cols-1 md:grid-cols-2 gap-1">
                            <li>• Comillas latinas («») en lugar de rectas (")</li>
                            <li>• Días y meses en minúscula</li>
                            <li>• Espaciado correcto con signos de puntuación</li>
                            <li>• Rayas de diálogo (—) en lugar de guiones</li>
                            <li>• Puntos suspensivos (…) correctos</li>
                            <li>• Formato de números español</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Paso 2: Revisión */}
            {paso === 'review' && (
                <div className="space-y-6">
                    {nombreArchivo && (
                        <div className="bg-gray-800/50 p-3 rounded-lg flex items-center gap-2">
                            <span>📄</span>
                            <span className="text-gray-400">Archivo:</span>
                            <span className="font-semibold">{nombreArchivo}</span>
                        </div>
                    )}

                    {correcciones.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">✅</div>
                            <h2 className="text-2xl font-bold mb-2">¡Texto perfecto!</h2>
                            <p className="text-gray-400 mb-6">No se encontraron errores ortotipográficos.</p>
                            <button
                                onClick={handleReset}
                                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                            >
                                Analizar otro texto
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold">
                                    Se encontraron <span className="text-[--accent]">{correcciones.length}</span> correcciones
                                </h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCorrecciones(prev => prev.map(c => ({ ...c, aprobada: true })))}
                                        className="text-sm bg-green-600/20 text-green-400 px-3 py-1 rounded hover:bg-green-600/30"
                                    >
                                        Aprobar todas
                                    </button>
                                    <button
                                        onClick={() => setCorrecciones(prev => prev.map(c => ({ ...c, aprobada: false })))}
                                        className="text-sm bg-red-600/20 text-red-400 px-3 py-1 rounded hover:bg-red-600/30"
                                    >
                                        Rechazar todas
                                    </button>
                                </div>
                            </div>

                            {Object.entries(correccionesPorCategoria).map(([categoria, corrs]) => (
                                <div key={categoria} className="bg-gray-800/50 rounded-lg overflow-hidden">
                                    <div className="bg-gray-700/50 px-4 py-2 font-semibold">
                                        {categoria} ({corrs.length})
                                    </div>
                                    <div className="divide-y divide-gray-700">
                                        {corrs.map((corr) => (
                                            <div
                                                key={corr.id}
                                                className={`p-4 flex items-start gap-4 transition-colors ${corr.aprobada ? 'bg-green-900/10' : 'bg-gray-800/30'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={corr.aprobada}
                                                    onChange={() => handleToggleCorreccion(corr.id)}
                                                    className="mt-1 w-5 h-5 rounded accent-[--accent]"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex gap-4 mb-2 flex-wrap">
                                                        <span className="bg-red-600/20 text-red-300 px-2 py-1 rounded text-sm line-through">
                                                            {corr.original}
                                                        </span>
                                                        <span className="text-gray-500">→</span>
                                                        <span className="bg-green-600/20 text-green-300 px-2 py-1 rounded text-sm">
                                                            {corr.sugerido}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-400">{corr.explicacion}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-between pt-4">
                                <button
                                    onClick={() => setPaso('input')}
                                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                                >
                                    ← Volver
                                </button>
                                <button
                                    onClick={handleAplicar}
                                    className="bg-[--accent] hover:bg-[--accent]/90 text-[--primary] font-bold py-3 px-8 rounded-lg transition-colors"
                                >
                                    ✓ Aplicar correcciones ({correcciones.filter(c => c.aprobada).length})
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Paso 3: Resultado */}
            {paso === 'result' && (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="text-6xl mb-4">✅</div>
                        <h2 className="text-2xl font-bold mb-2">¡Correcciones aplicadas!</h2>
                        <p className="text-gray-400">
                            Se aplicaron {correcciones.filter(c => c.aprobada).length} de {correcciones.length} correcciones
                        </p>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-lg font-semibold">Texto corregido</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCopiar}
                                    className="text-sm bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded transition-colors"
                                >
                                    📋 Copiar
                                </button>
                                <button
                                    onClick={handleDescargarTxt}
                                    className="text-sm bg-[--accent] hover:bg-[--accent]/90 text-[--primary] px-3 py-1 rounded transition-colors"
                                >
                                    ⬇️ Descargar .txt
                                </button>
                            </div>
                        </div>
                        <textarea
                            value={textoCorregido}
                            readOnly
                            className="w-full h-64 p-4 bg-gray-800 border border-green-600/30 rounded-lg text-white resize-none"
                        />
                    </div>

                    <div className="flex justify-center gap-4">
                        <button
                            onClick={handleReset}
                            className="bg-[--accent] hover:bg-[--accent]/90 text-[--primary] font-bold py-3 px-8 rounded-lg transition-colors"
                        >
                            Corregir otro texto
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
