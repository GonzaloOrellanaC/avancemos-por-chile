import React from 'react';

const Legal = () => {
  return (
    <div className="min-h-screen pt-24 pb-12 bg-white">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-brand-blue mb-6">Aviso Legal</h1>

        <p className="text-gray-700 mb-4">El acceso y uso de este sitio web se rigen por las siguientes condiciones. Si no está de acuerdo con ellas, por favor no use el sitio.</p>

        <h2 className="text-xl font-bold text-brand-blue mt-6 mb-2">1. Propiedad intelectual</h2>
        <p className="text-gray-700 mb-2">Todos los contenidos del sitio (textos, imágenes, logos, código) son propiedad de Avancemos Por Chile o de terceros que han autorizado su uso. Queda prohibida su reproducción total o parcial sin permiso expreso.</p>

        <h2 className="text-xl font-bold text-brand-blue mt-6 mb-2">2. Uso del sitio y responsabilidades</h2>
        <p className="text-gray-700 mb-2">El sitio se proporciona "tal cual". Avancemos Por Chile no garantiza la ausencia de errores, interrupciones o la exactitud completa de la información. No somos responsables por daños derivados del uso del sitio salvo en los casos previstos por la ley aplicable.</p>

        <h2 className="text-xl font-bold text-brand-blue mt-6 mb-2">3. Enlaces a terceros</h2>
        <p className="text-gray-700 mb-2">El sitio puede contener enlaces a recursos externos. No ejercemos control sobre esos sitios y no asumimos responsabilidad por su contenido o prácticas de privacidad.</p>

        <h2 className="text-xl font-bold text-brand-blue mt-6 mb-2">4. Protección de datos</h2>
        <p className="text-gray-700 mb-2">El tratamiento de los datos personales se rige por la Política de Privacidad disponible en la sección correspondiente. Para consultas sobre datos personales, contacte a contacto@avancemosporchile.cl.</p>

        <h2 className="text-xl font-bold text-brand-blue mt-6 mb-2">5. Limitación de responsabilidad</h2>
        <p className="text-gray-700 mb-2">En la máxima medida permitida por la ley, Avancemos Por Chile no será responsable por daños indirectos, incidentales o consecuentes relacionados con el uso del sitio.</p>

        <h2 className="text-xl font-bold text-brand-blue mt-6 mb-2">6. Legislación y jurisdicción</h2>
        <p className="text-gray-700 mb-8">Las presentes condiciones se rigen por las leyes de la República de Chile. Cualquier conflicto se someterá a los tribunales competentes.</p>

        <p className="text-gray-700">Última actualización: {new Date().getFullYear()}</p>
      </div>
    </div>
  );
};

export default Legal;
