import React from 'react';
import { motion } from 'motion/react';
import { Target, Eye, Compass } from 'lucide-react';

const InfoCards = () => {
  const items = [
    {
      title: 'Misión',
      icon: <Target className="text-brand-red" size={40} />,
      text: 'Empoderar a la ciudadanía mediante formación técnica y espacios de diálogo para transformar a las personas en actores incidentes ante sus representantes, fortaleciendo la democracia a través de la participación formal, técnica y permanente.',
      delay: 0.1
    },
    {
      title: 'Visión',
      icon: <Eye className="text-brand-red" size={40} />,
      text: 'Ser el referente nacional en articulación ciudadana técnica, logrando que la voz de las personas sea un pilar institucionalizado, directo y no violento en la toma de decisiones del Congreso y el Estado.',
      delay: 0.2
    },
    {
      title: 'Objetivo',
      icon: <Compass className="text-brand-red" size={40} />,
      text: 'Consolidar una plataforma de articulación que desarticule la dependencia de intermediarios políticos, capacitando a ciudadanos para que ejerzan su soberanía de manera autónoma, crítica y constante a través de los canales institucionales.',
      delay: 0.3
    }
  ];

  return (
    <section id="mision" className="py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: item.delay }}
              className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-brand-red hover:shadow-2xl transition-shadow"
            >
              <div className="mb-6">{item.icon}</div>
              <h3 className="text-2xl font-bold text-brand-blue mb-4">{item.title}</h3>
              <p className="text-gray-600 leading-relaxed">
                {item.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InfoCards;
