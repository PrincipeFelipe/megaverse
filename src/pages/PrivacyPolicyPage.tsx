import React from 'react';
import { useNavigate } from 'react-router-dom';

export const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header con botón de volver */}
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
          <h1 className="text-3xl font-bold text-white mb-4">
            Política de Privacidad
          </h1>
          <p className="text-secondary-300">
            Última actualización: 9 de julio de 2025
          </p>
        </div>

        {/* Contenido */}
        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              1. Información que Recopilamos
            </h2>
            <div className="text-secondary-300 space-y-4">
              <p>
                En MEGAVERSE, recopilamos la siguiente información:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Información de registro: nombre, email, teléfono</li>
                <li>Información de perfil: avatar, preferencias de juego</li>
                <li>Datos de reservas: fechas, horarios, servicios solicitados</li>
                <li>Información de pagos: datos de facturación (no almacenamos datos de tarjetas)</li>
                <li>Datos de navegación: cookies, dirección IP, tipo de navegador</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              2. Uso de la Información
            </h2>
            <div className="text-secondary-300 space-y-4">
              <p>
                Utilizamos tu información para:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Gestionar tu cuenta y reservas</li>
                <li>Procesar pagos y generar facturas</li>
                <li>Mejorar nuestros servicios y experiencia de usuario</li>
                <li>Comunicarnos contigo sobre eventos y promociones</li>
                <li>Cumplir con obligaciones legales</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              3. Cookies y Tecnologías Similares
            </h2>
            <div className="text-secondary-300 space-y-4">
              <p>
                Utilizamos cookies para:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Mantener tu sesión iniciada</li>
                <li>Recordar tus preferencias</li>
                <li>Analizar el uso del sitio web</li>
                <li>Mejorar la funcionalidad del sitio</li>
              </ul>
              <p>
                Puedes controlar las cookies a través de la configuración de tu navegador.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              4. Compartir Información
            </h2>
            <div className="text-secondary-300 space-y-4">
              <p>
                No vendemos ni alquilamos tu información personal. Podemos compartir información solo en estos casos:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Con proveedores de servicios necesarios para nuestras operaciones</li>
                <li>Cuando sea requerido por ley</li>
                <li>Para proteger nuestros derechos o los de nuestros usuarios</li>
                <li>Con tu consentimiento explícito</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              5. Seguridad de los Datos
            </h2>
            <div className="text-secondary-300 space-y-4">
              <p>
                Implementamos medidas de seguridad técnicas y organizativas para proteger tu información:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Cifrado de datos en tránsito y en reposo</li>
                <li>Acceso restringido a información personal</li>
                <li>Monitoreo regular de seguridad</li>
                <li>Actualizaciones de seguridad regulares</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              6. Tus Derechos
            </h2>
            <div className="text-secondary-300 space-y-4">
              <p>
                Tienes derecho a:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Acceder a tu información personal</li>
                <li>Rectificar datos incorrectos</li>
                <li>Solicitar la eliminación de tus datos</li>
                <li>Limitar el procesamiento de tu información</li>
                <li>Portabilidad de datos</li>
                <li>Oponerte al procesamiento</li>
              </ul>
              <p>
                Para ejercer estos derechos, contáctanos en: privacy@megaverse.es
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              7. Retención de Datos
            </h2>
            <div className="text-secondary-300 space-y-4">
              <p>
                Conservamos tu información personal:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Mientras mantengas una cuenta activa</li>
                <li>Durante el tiempo necesario para cumplir con obligaciones legales</li>
                <li>Para resolver disputas y hacer cumplir nuestros acuerdos</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              8. Cambios en esta Política
            </h2>
            <div className="text-secondary-300 space-y-4">
              <p>
                Podemos actualizar esta política de privacidad ocasionalmente. Te notificaremos sobre cambios significativos por email o mediante un aviso en nuestro sitio web.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">
              9. Contacto
            </h2>
            <div className="text-secondary-300 space-y-4">
              <p>
                Si tienes preguntas sobre esta política de privacidad, contáctanos:
              </p>
              <ul className="list-none space-y-2">
                <li><strong>Email:</strong> privacy@megaverse.es</li>
                <li><strong>Dirección:</strong> MEGAVERSE - Asociación de Ocio y Gaming</li>
                <li><strong>Teléfono:</strong> +34 XXX XXX XXX</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
