import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Page } from './src/models/Page.ts';

dotenv.config();

const seedHome = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Conectado a MongoDB para seeding de página de inicio...');

    // Eliminar página de inicio existente si hay
    await Page.deleteMany({ isHome: true });

    const homePage = new Page({
      title: 'Avancemos Por Chile',
      slug: 'home',
      isHome: true,
      hero: {
        images: [
          { url: '/100.jpg', animation: 'pan-right' },
          { url: '/101.jpg', animation: 'pan-left' },
          { url: '/102.jpg', animation: 'zoom' }
        ],
        duration: 6000,
        overlayOpacity: 0.6
      },
      sections: [
        {
          type: 'cards',
          layout: '3',
          columns: [
            {
              title: 'Misión',
              icon: 'Target',
              content: [{
                type: 'text',
                value: 'Empoderar a la ciudadanía mediante formación técnica y espacios de diálogo para transformar a las personas en actores incidentes ante sus representantes, fortaleciendo la democracia a través de la participación formal, técnica y permanente.',
                align: 'left'
              }]
            },
            {
              title: 'Visión',
              icon: 'Eye',
              iconColor: '#BB2830',
              content: [{
                type: 'text',
                value: 'Ser el referente nacional en articulación ciudadana técnica, logrando que la voz de las personas sea un pilar institucionalizado, directo y no violento en la toma de decisiones del Congreso y el Estado.',
                align: 'left'
              }]
            },
            {
              title: 'Objetivo',
              icon: 'Compass',
              content: [{
                type: 'text',
                value: 'Consolidar una plataforma de articulación que desarticule la dependencia de intermediarios políticos, capacitando a ciudadanos para que ejerzan su soberanía de manera autónoma, crítica y constante a través de los canales institucionales.',
                align: 'left'
              }]
            }
          ]
        }
      ],
      status: 'published'
    });

    await homePage.save();
    console.log('Página de inicio restaurada y convertida a autoadministrable con éxito.');
    process.exit(0);
  } catch (error) {
    console.error('Error en el seeding:', error);
    process.exit(1);
  }
};

seedHome();
