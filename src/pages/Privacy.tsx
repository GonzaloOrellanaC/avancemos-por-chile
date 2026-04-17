import React from 'react';

const Privacy = () => {
  return (
    <div className="min-h-screen pt-24 pb-12 bg-white">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-brand-blue mb-6">Política de Privacidad</h1>

        <p className="text-gray-700 mb-4">En Avancemos Por Chile protegemos la privacidad de las personas que utilizan nuestros servicios. Esta política describe qué datos recopilamos, con qué finalidad y cómo los protegemos.</p>

        <h2 className="text-xl font-bold text-brand-blue mt-6 mb-2">1. Datos que recopilamos</h2>
        <p className="text-gray-700 mb-2">Recopilamos información que los usuarios proporcionan voluntariamente al registrarse, suscribirse al blog, enviar formularios o participar en actividades: nombre, correo electrónico, contraseña (almacenada de forma segura), y otros datos de perfil.</p>

        <h2 className="text-xl font-bold text-brand-blue mt-6 mb-2">2. Uso de los datos</h2>
        <p className="text-gray-700 mb-2">Los datos se utilizan para gestionar cuentas de usuario, enviar comunicaciones relacionadas con el servicio (notificaciones de publicaciones, cambios en la cuenta), y para fines administrativos y de seguridad.</p>

        <h2 className="text-xl font-bold text-brand-blue mt-6 mb-2">3. Cookies y seguimiento</h2>
        <p className="text-gray-700 mb-2">Utilizamos cookies y tecnologías similares para mejorar la experiencia, gestionar sesiones y analizar el uso del sitio. Los usuarios pueden configurar o bloquear cookies desde su navegador, lo que puede afectar la funcionalidad.</p>

        <h2 className="text-xl font-bold text-brand-blue mt-6 mb-2">4. Seguridad</h2>
        <p className="text-gray-700 mb-2">Implementamos medidas técnicas y organizativas razonables para proteger los datos personales (cifrado, control de acceso, copias de seguridad). Sin embargo, ningún sistema es 100% infalible; en caso de incidente le notificaremos según la normativa aplicable.</p>

        <h2 className="text-xl font-bold text-brand-blue mt-6 mb-2">5. Retención</h2>
        <p className="text-gray-700 mb-2">Conservamos los datos mientras la cuenta esté activa y durante los plazos necesarios para cumplir obligaciones legales o resolver disputas.</p>

        <h2 className="text-xl font-bold text-brand-blue mt-6 mb-2">6. Derechos de los usuarios</h2>
        <p className="text-gray-700 mb-2">Los usuarios pueden solicitar acceso, rectificación, supresión u oposición al tratamiento de sus datos, así como la portabilidad. Para ejercer estos derechos, contacte a contacto@avancemosporchile.cl.</p>

        <h2 className="text-xl font-bold text-brand-blue mt-6 mb-2">7. Transferencias y terceros</h2>
        <p className="text-gray-700 mb-2">Podemos compartir datos con proveedores que prestan servicios en nuestro nombre (hosting, correo, analítica). Exigimos a estos proveedores garantías de seguridad y cumplimiento legal.</p>

        <h2 className="text-xl font-bold text-brand-blue mt-6 mb-2">8. Cambios en la política</h2>
        <p className="text-gray-700 mb-8">Nos reservamos el derecho de actualizar esta política; informaremos sobre cambios significativos en el sitio o por correo.</p>

        <p className="text-gray-700">Última actualización: {new Date().getFullYear()}</p>
      </div>
    </div>
  );
};

export default Privacy;
