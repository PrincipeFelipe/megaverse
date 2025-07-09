import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const RSSFeedPage: React.FC = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090/api';
  const rssUrl = `${API_URL}/rss/blog`;
  
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-8 h-8 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 11a9 9 0 0 1 9-9 9 9 0 0 1 9 9 9 9 0 0 1-9 9 9 9 0 0 1-9-9M6 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3M12 12.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3m6 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3" />
            </svg>
            <h1 className="text-3xl font-bold text-white">
              Feed RSS del Blog
            </h1>
          </div>
          <p className="text-secondary-300">
            Mantente al día con las últimas noticias y artículos del blog de MEGAVERSE
          </p>
        </div>

        {/* URL del RSS */}
        <div className="bg-dark-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">URL del Feed RSS</h2>
          <div className="flex items-center gap-3 p-4 bg-dark-700 rounded-lg">
            <code className="flex-1 text-primary-300 font-mono text-sm break-all">
              {rssUrl}
            </code>
            <button
              onClick={() => copyToClipboard(rssUrl)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-dark-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-3">Ver Feed RSS</h3>
            <p className="text-secondary-300 mb-4">
              Abre el feed RSS directamente en tu navegador
            </p>
            <a
              href={rssUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Abrir RSS
            </a>
          </div>

          <div className="bg-dark-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-3">Descargar XML</h3>
            <p className="text-secondary-300 mb-4">
              Descarga el archivo XML del feed RSS
            </p>
            <a
              href={rssUrl}
              download="megaverse-blog-feed.xml"
              className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              Descargar XML
            </a>
          </div>
        </div>

        {/* Información sobre el RSS */}
        <div className="bg-dark-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">¿Qué es un Feed RSS?</h2>
          <div className="text-secondary-300 space-y-4">
            <p>
              RSS (Really Simple Syndication) es un formato estándar para distribuir contenido web actualizado. 
              Permite a los usuarios suscribirse a contenido sin visitar el sitio web constantemente.
            </p>
            <p>
              Nuestro feed RSS incluye:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Los 20 artículos más recientes del blog</li>
              <li>Título, resumen y enlace de cada artículo</li>
              <li>Fecha de publicación</li>
              <li>Autor y categorías</li>
              <li>Etiquetas (tags) de los artículos</li>
            </ul>
          </div>
        </div>

        {/* Automatización con Make */}
        <div className="bg-dark-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Automatización con Make</h2>
          <div className="text-secondary-300 space-y-4">
            <p>
              Puedes usar este feed RSS con <strong>Make</strong> (anteriormente Integromat) para crear automatizaciones:
            </p>
            <div className="bg-dark-700 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Ejemplos de automatización:</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Publicar automáticamente nuevos posts en redes sociales</li>
                <li>Enviar notificaciones por email cuando haya nuevo contenido</li>
                <li>Crear entradas en otras plataformas (Discord, Slack, etc.)</li>
                <li>Generar reportes semanales de actividad del blog</li>
                <li>Sincronizar con sistemas de gestión de contenido</li>
              </ul>
            </div>
            <div className="bg-primary-900/20 border border-primary-600 rounded-lg p-4">
              <h4 className="font-semibold text-primary-300 mb-2">💡 Tip para Make:</h4>
              <p className="text-sm">
                Usa el módulo "RSS" → "Watch RSS feed items" en Make e introduce la URL del RSS arriba. 
                Configura la frecuencia de verificación según tus necesidades.
              </p>
            </div>
          </div>
        </div>

        {/* Información técnica */}
        <div className="bg-dark-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Información Técnica</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-white mb-2">Características del Feed:</h4>
              <ul className="text-secondary-300 space-y-1 text-sm">
                <li>• Formato: RSS 2.0</li>
                <li>• Codificación: UTF-8</li>
                <li>• Límite: 20 artículos</li>
                <li>• Ordenación: Por fecha (más reciente primero)</li>
                <li>• Contenido: Solo posts publicados</li>
                <li>• Cache: 1 hora</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Campos incluidos:</h4>
              <ul className="text-secondary-300 space-y-1 text-sm">
                <li>• Título del post</li>
                <li>• Enlace permanente</li>
                <li>• Descripción/resumen</li>
                <li>• Fecha de publicación</li>
                <li>• Autor</li>
                <li>• Categoría</li>
                <li>• Etiquetas</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
