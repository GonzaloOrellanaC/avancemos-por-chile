import React from 'react';
import { Link } from 'react-router-dom';
import { Fingerprint, ShieldCheck, Database, Eye, Mail, Lock, FileText } from 'lucide-react';

const FirmasData = () => {
  return (
    <div className="min-h-screen pt-24 pb-12 bg-gray-50">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-8 md:p-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-blue/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-brand-blue">
            <ShieldCheck size={14} />
            <span>Privacidad y datos</span>
          </div>
          <h1 className="mt-4 text-3xl md:text-4xl font-black text-brand-blue mb-4">
            Uso de tus datos al firmar iniciativas
          </h1>
          <p className="text-gray-700 mb-6">
            En <strong>Avancemos Por Chile</strong> tratamos los datos de las personas que firman iniciativas con
            responsabilidad, transparencia y respeto a la normativa chilena de protección de la vida privada
            (Ley N° 19.628 y su normativa complementaria).
          </p>

          <div className="space-y-6">
            <section className="flex items-start gap-4">
              <div className="shrink-0 rounded-2xl bg-brand-blue/10 p-3 text-brand-blue">
                <FileText size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-brand-blue mb-2">1. Qué datos se solicitan</h2>
                <p className="text-gray-700 mb-2">Al firmar una iniciativa pedimos:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li><strong>Nombre completo</strong> (obligatorio).</li>
                  <li><strong>RUT</strong> (obligatorio): se valida automáticamente su formato y dígito verificador.</li>
                  <li><strong>Correo electrónico</strong> (opcional).</li>
                  <li><strong>Comuna o región</strong> (opcional).</li>
                  <li><strong>Comentario</strong> (opcional).</li>
                </ul>
                <p className="text-gray-700 mt-2">
                  Además, por seguridad registramos la <strong>fecha</strong> y datos técnicos del envío (dirección IP y
                  navegador) para prevenir abusos y falsificaciones, tal como exige un proceso de firma oficial.
                </p>
              </div>
            </section>

            <section className="flex items-start gap-4">
              <div className="shrink-0 rounded-2xl bg-brand-red/10 p-3 text-brand-red">
                <Eye size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-brand-blue mb-2">2. Para qué se usan</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Validar que <strong>cada persona firma una sola vez</strong> por iniciativa (identificación única por RUT).</li>
                  <li>Contabilizar el apoyo ciudadano a cada propuesta oficial.</li>
                  <li>Elaborar <strong>reportes</strong> y documentos de respaldo de las iniciativas.</li>
                  <li>Contactarte solo si <strong>autorizas</strong> ser contactado y cuando corresponda.</li>
                </ul>
                <p className="text-gray-700 mt-2">
                  No usamos tus datos para publicidad ni los vendemos a terceros.
                </p>
              </div>
            </section>

            <section className="flex items-start gap-4">
              <div className="shrink-0 rounded-2xl bg-brand-blue/10 p-3 text-brand-blue">
                <Lock size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-brand-blue mb-2">3. Cómo se protegen</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>El RUT y los datos de las firmas se tratan como <strong>datos personales</strong>.</li>
                  <li>El acceso a las firmas está <strong>restringido a la administración</strong> de la plataforma; no se publican públicamente.</li>
                  <li>La información se transmite de forma cifrada y se almacena con medidas de seguridad técnicas y organizativas.</li>
                  <li>Aplicamos controles anti-abuso (límite de firmas por persona y por origen) para proteger la integridad del proceso.</li>
                </ul>
              </div>
            </section>

            <section className="flex items-start gap-4">
              <div className="shrink-0 rounded-2xl bg-brand-red/10 p-3 text-brand-red">
                <Database size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-brand-blue mb-2">4. Retención</h2>
                <p className="text-gray-700">
                  Conservamos las firmas mientras la iniciativa esté vigente y durante los plazos necesarios para
                  cumplir obligaciones legales, respaldar la propuesta o resolver consultas. Cuando dejan de ser
                  necesarias, se eliminan de forma segura.
                </p>
              </div>
            </section>

            <section className="flex items-start gap-4">
              <div className="shrink-0 rounded-2xl bg-brand-blue/10 p-3 text-brand-blue">
                <Fingerprint size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-brand-blue mb-2">5. Tus derechos</h2>
                <p className="text-gray-700">
                  Puedes solicitar <strong>acceso, rectificación o supresión</strong> de tus datos de firma en cualquier
                  momento. Para ejercer estos derechos escribe a{' '}
                  <a href="mailto:contacto@avancemosporchile.cl" className="text-brand-red font-semibold hover:underline">
                    contacto@avancemosporchile.cl
                  </a>{' '}
                  indicando el RUT utilizado y la iniciativa.
                </p>
              </div>
            </section>

            <section className="flex items-start gap-4">
              <div className="shrink-0 rounded-2xl bg-brand-red/10 p-3 text-brand-red">
                <Mail size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-brand-blue mb-2">6. Contacto</h2>
                <p className="text-gray-700">
                  Ante cualquier duda sobre el tratamiento de tus datos, contáctanos en{' '}
                  <a href="mailto:contacto@avancemosporchile.cl" className="text-brand-red font-semibold hover:underline">
                    contacto@avancemosporchile.cl
                  </a>
                  . También puedes revisar nuestra{' '}
                  <Link to="/privacy" className="text-brand-blue font-semibold hover:underline">Política de Privacidad</Link>.
                </p>
              </div>
            </section>
          </div>

          <div className="mt-10 rounded-2xl bg-brand-blue/5 border border-brand-blue/10 p-6 text-center">
            <Link to="/firmas" className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-6 py-3 font-bold text-white hover:bg-brand-red transition-colors">
              Volver a firmas de iniciativas
            </Link>
          </div>

          <p className="mt-8 text-gray-500 text-sm">
            Última actualización: {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FirmasData;
